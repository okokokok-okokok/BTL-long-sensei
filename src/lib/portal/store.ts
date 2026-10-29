import fs from 'node:fs/promises';
import path from 'node:path';
import lockfile from 'proper-lockfile';
import { PrismaClient, Prisma } from '@prisma/client';
import type { PortalState } from './types';
import { createDemoState } from './seed';
import { PortalError } from './domain';
import { ensureDirectories } from './directories';
import { importLegacyDemoCurricula } from './curricula';
import { purgeInvalidLecturerTickets } from './support';

export const collections = ['catalogs', 'lecturers', 'curriculumPrograms', 'curriculumVersions', 'users', 'cohorts', 'students', 'subjects', 'sections', 'meetings', 'enrollments', 'results', 'audits', 'supportTickets', 'curriculumAssignments'] as const;
const tableNames: Record<typeof collections[number], string> = {
  users: 'portal_users', cohorts: 'portal_cohorts', students: 'portal_students', subjects: 'portal_subjects',
  sections: 'portal_sections', meetings: 'portal_meetings', enrollments: 'portal_enrollments',
  results: 'portal_results', audits: 'portal_audits', supportTickets: 'portal_support_tickets',
  catalogs: 'portal_catalogs', lecturers: 'portal_lecturers',
  curriculumPrograms: 'portal_curriculum_programs', curriculumVersions: 'portal_curriculum_versions', curriculumAssignments: 'portal_curriculum_assignments',
};
export interface Queryable { query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }> }
export function emptyState(): PortalState {
  return { users: [], cohorts: [], students: [], subjects: [], sections: [], meetings: [], enrollments: [], results: [], audits: [], supportTickets: [], catalogs: [], lecturers: [], curriculumPrograms: [], curriculumVersions: [], curriculumAssignments: [] };
}
export async function loadState(db: Queryable): Promise<PortalState> {
  const state = emptyState();
  for (const key of collections) {
    const { rows } = await db.query(`SELECT * FROM ${tableNames[key]} ORDER BY id`);
    (state[key] as unknown[]) = rows;
  }
  return state;
}
// Apply explicit removals in reverse dependency order. Mutations guard every removal.
export async function saveState(db: Queryable, state: PortalState, before = emptyState()) {
  for (const key of [...collections].reverse()) {
    const remaining = new Set(state[key].map(row => row.id));
    for (const row of before[key]) {
      if (!remaining.has(row.id)) await db.query(`DELETE FROM ${tableNames[key]} WHERE id=$1`, [row.id]);
    }
  }
  for (const key of collections) {
    const previous = new Map(before[key].map(row => [row.id, JSON.stringify(row)]));
    for (const item of state[key]) {
      if (previous.get(item.id) === JSON.stringify(item)) continue;
      const row = item as unknown as Record<string, unknown>;
      const columns = Object.keys(row);
      const quoted = columns.map(c => `"${c}"`);
      const updates = columns.filter(c => c !== 'id').map(c => `"${c}"=EXCLUDED."${c}"`).join(',');
      const jsonColumns = key === 'supportTickets' ? new Set(['appealScores', 'legacyData']) : key === 'catalogs' ? new Set(['aliases']) : key === 'curriculumVersions' ? new Set(['terms', 'electiveGroups', 'courses']) : new Set<string>();
      const placeholders = columns.map((column, i) => `$${i + 1}${jsonColumns.has(column) ? '::jsonb' : ''}`);
      const values = columns.map(column => jsonColumns.has(column) ? JSON.stringify(row[column]) : row[column]);
      await db.query(`INSERT INTO ${tableNames[key]} (${quoted.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (id) DO UPDATE SET ${updates}`, values);
    }
  }
}
export function storageMode(): 'postgresql' | 'demo' {
  if (process.env.PORTAL_STORAGE === 'demo') return 'demo';
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('postgres') && !url.includes('YOUR_NEON_PASSWORD')) return 'postgresql';
  if (process.env.NODE_ENV === 'production') throw new PortalError('Cần cấu hình DATABASE_URL, hoặc PORTAL_STORAGE=demo để chạy bản trình diễn.', 503);
  return 'demo';
}
const globalDb = globalThis as unknown as { portalPrisma?: PrismaClient };
function client() {
  if (!globalDb.portalPrisma) globalDb.portalPrisma = new PrismaClient();
  return globalDb.portalPrisma;
}
export function prismaAdapter(tx: Prisma.TransactionClient): Queryable {
  return { query: async (sql, values = []) => {
    if (/^\s*SELECT/i.test(sql)) return { rows: await tx.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...values) };
    await tx.$executeRawUnsafe(sql, ...values); return { rows: [] };
  } };
}
let demoCache: { state: PortalState; mtime: number } | null = null;
let pgCache: { state: PortalState; timestamp: number } | null = null;
const PG_CACHE_TTL_MS = 2000;

export function invalidateStoreCache() {
  demoCache = null;
  pgCache = null;
}

export async function withState<T>(write: boolean, fn: (state: PortalState) => T | Promise<T>): Promise<T> {
  if (storageMode() === 'postgresql') {
    if (!write && pgCache && Date.now() - pgCache.timestamp < PG_CACHE_TTL_MS) {
      return await fn(structuredClone(pgCache.state));
    }
    try {
      return await client().$transaction(async tx => {
        const db = prismaAdapter(tx);
        if (write) await tx.$queryRawUnsafe('SELECT 1 AS locked FROM pg_advisory_xact_lock(72402517)');
        const state = await loadState(db);
        const before = write ? structuredClone(state) : undefined;
        ensureDirectories(state, process.env.PORTAL_CURRENT_SEMESTER);
        purgeInvalidLecturerTickets(state);
        const value = await fn(state);
        if (write) {
          await saveState(db, state, before);
          invalidateStoreCache();
          pgCache = { state: structuredClone(state), timestamp: Date.now() };
        } else {
          pgCache = { state: structuredClone(state), timestamp: Date.now() };
        }
        return value;
      }, { maxWait: 15000, timeout: 30000, isolationLevel: write ? Prisma.TransactionIsolationLevel.ReadCommitted : Prisma.TransactionIsolationLevel.RepeatableRead });
    } catch (e) {
      if (e instanceof PortalError) throw e;
      console.error('Portal database transaction failed:', e instanceof Error ? e.name : 'unknown');
      // Never silently fall back to demo when a configured database is unavailable.
      throw new PortalError('Không truy cập được dữ liệu. Kiểm tra DATABASE_URL và chạy npm run db:upgrade trước khi sử dụng.', 503);
    }
  }
  const location = path.resolve(process.env.PORTAL_DEMO_FILE || path.join(process.cwd(), '.data', 'portal-demo.json'));
  if (!write && demoCache) {
    try {
      const stat = await fs.stat(location);
      if (stat.mtimeMs === demoCache.mtime) {
        return await fn(structuredClone(demoCache.state));
      }
    } catch {
      // file might not exist yet, proceed
    }
  }
  await fs.mkdir(path.dirname(location), { recursive: true });
  const release = await lockfile.lock(location, { realpath: false, retries: { retries: 40, minTimeout: 50, maxTimeout: 250 }, stale: 30000 });
  try {
    let state: PortalState;
    let initialized = false;
    let original = '';
    try { original = await fs.readFile(location, 'utf8'); state = { ...emptyState(), ...JSON.parse(original) }; }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw new PortalError('Tệp dữ liệu demo không đọc được. Hãy sao lưu và kiểm tra tệp, không tự động đặt lại dữ liệu.', 503);
      state = createDemoState(); initialized = true;
    }
    const curriculaUpgraded = importLegacyDemoCurricula(state);
    const directoriesUpgraded = ensureDirectories(state, process.env.PORTAL_CURRENT_SEMESTER);
    purgeInvalidLecturerTickets(state);
    const upgraded = directoriesUpgraded || curriculaUpgraded;
    const value = await fn(state);
    if (write || initialized || upgraded) {
      if (directoriesUpgraded && original) {
        try { await fs.writeFile(`${location}.before-directories.json`, original, { flag: 'wx', mode: 0o600 }); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
      }
      if (curriculaUpgraded && original) {
        try { await fs.writeFile(`${location}.before-curriculum-upgrade.json`, original, { flag: 'wx', mode: 0o600 }); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
      }
      const temporary = `${location}.${process.pid}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
      await fs.rename(temporary, location);
      const stat = await fs.stat(location).catch(() => null);
      if (stat) demoCache = { state: structuredClone(state), mtime: stat.mtimeMs };
    } else {
      const stat = await fs.stat(location).catch(() => null);
      if (stat) demoCache = { state: structuredClone(state), mtime: stat.mtimeMs };
    }
    return value;
  } finally { await release(); }
}
