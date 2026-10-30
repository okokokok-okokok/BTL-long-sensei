// Import the current academic portal JSON into an empty Neon database.
// Usage: node --import tsx scripts/import-demo-to-neon.mjs --check|--apply
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import lockfile from 'proper-lockfile';
import { collections, loadState } from '../src/lib/portal/store.ts';

const mode = process.argv[2];
if (!['--check', '--apply'].includes(mode) || process.argv.length !== 3) {
  console.error('Usage: node --import tsx scripts/import-demo-to-neon.mjs --check|--apply');
  process.exit(2);
}

const configPath = path.resolve('.env.local');
const migrationFiles = [
  'database/001_portal.sql',
  'database/002_support_tickets.sql',
  'database/003_directories.sql',
  'database/004_student_curriculum.sql',
  'database/005_curriculum_management.sql',
  'database/006_fractional_subject_credits.sql',
  'database/007_cross_program_sections.sql',
  'database/008_grade_component_handoff.sql',
];
const jsonColumns = {
  catalogs: new Set(['aliases']),
  curriculumVersions: new Set(['terms', 'electiveGroups', 'courses']),
  supportTickets: new Set(['appealScores', 'legacyData']),
};
class SafeError extends Error {}
const sha256 = data => createHash('sha256').update(data).digest('hex');
const quote = value => `"${value.replaceAll('"', '""')}"`;
const tableName = collection => `portal_${collection.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`;

function envValue(config, key) {
  const lines = config.split(/\r?\n/).filter(line => new RegExp(`^\\s*${key}\\s*=`).test(line));
  if (lines.length > 1) throw new SafeError(`.env.local contains duplicate ${key} entries`);
  if (!lines.length) return '';
  const value = lines[0].replace(new RegExp(`^\\s*${key}\\s*=\\s*`), '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  return value.replace(/\s+#.*$/, '').trim();
}

function setEnvValue(config, key, value) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  return pattern.test(config) ? config.replace(pattern, line) : `${config.replace(/\s*$/, '')}\n${line}\n`;
}

function readState(bytes) {
  let raw;
  try { raw = JSON.parse(bytes.toString('utf8')); }
  catch { throw new SafeError('Source JSON is invalid'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new SafeError('Source JSON must be an object');
  const unknown = Object.keys(raw).filter(key => !collections.includes(key));
  if (unknown.length) throw new SafeError(`Unknown source collections: ${unknown.join(', ')}`);
  const state = {};
  for (const name of collections) {
    if (!Array.isArray(raw[name])) throw new SafeError(`Source collection ${name} is missing or invalid`);
    const seen = new Set();
    state[name] = raw[name].map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !item.id) throw new SafeError(`Invalid row in ${name}`);
      if (seen.has(item.id)) throw new SafeError(`Duplicate ID in ${name}`);
      seen.add(item.id);
      // SQL migrations add these defaults; the original JSON is never modified.
      if (name === 'students') return { ...item, curriculumId: item.curriculumId ?? null, degreeSystem: item.degreeSystem ?? '' };
      return item;
    });
  }
  return state;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}

function verifyState(expected, actual) {
  for (const name of collections) {
    const sortRows = rows => rows.map(canonical).sort((a, b) => a.id.localeCompare(b.id));
    try { assert.deepEqual(sortRows(actual[name]), sortRows(expected[name])); }
    catch { throw new SafeError(`Round-trip content mismatch in ${name}`); }
  }
}

async function importRows(db, state) {
  for (const name of collections) {
    const groups = new Map();
    for (const row of state[name]) {
      const columns = Object.keys(row).sort();
      const signature = columns.join('\0');
      if (!groups.has(signature)) groups.set(signature, { columns, rows: [] });
      groups.get(signature).rows.push(row);
    }
    for (const { columns, rows } of groups.values()) {
      for (let offset = 0; offset < rows.length; offset += 50) {
        const batch = rows.slice(offset, offset + 50);
        const values = [];
        const tuples = batch.map(row => {
          const fields = columns.map(column => {
            const raw = row[column];
            const json = jsonColumns[name]?.has(column);
            values.push(json && raw !== null ? JSON.stringify(raw) : raw);
            return `$${values.length}${json ? '::jsonb' : ''}`;
          });
          return `(${fields.join(',')})`;
        });
        try { await db.query(`INSERT INTO ${quote(tableName(name))} (${columns.map(quote).join(',')}) VALUES ${tuples.join(',')}`, values); }
        catch (error) { throw new SafeError(`Insert failed in ${name} (${error?.code || error?.name || 'unknown'})`); }
      }
    }
    console.log(`${name}: ${state[name].length} rows`);
  }
}

async function insertMarkers(db, state, sourceHash) {
  const record = JSON.stringify({ source: 'portal-demo-json', sourceSha256: sourceHash, importedAt: new Date().toISOString(), counts: Object.fromEntries(collections.map(name => [name, state[name].length])) });
  await db.query('INSERT INTO portal_meta(id,value) VALUES ($1,$2),($3,$4),($5,$6)', [
    'legacy-import-v1', record,
    'legacy-support-import-v2', record,
    'demo-json-import-v1', record,
  ]);
}

async function createSchema(db) {
  for (const file of migrationFiles) await db.query(await fs.readFile(file, 'utf8'));
}

async function checkTargetEmpty(db) {
  const { rows } = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
  const occupied = [];
  for (const { table_name: table } of rows) {
    const result = await db.query(`SELECT EXISTS(SELECT 1 FROM public.${quote(table)} LIMIT 1) AS has_rows`);
    if (result.rows[0].has_rows) occupied.push(table);
  }
  if (occupied.length) throw new SafeError(`Neon target already contains data in: ${occupied.join(', ')}`);
  return rows.length;
}

async function checkPort3000() {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: 3000 });
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

async function dryRun(state, sourceHash) {
  const db = new PGlite();
  try {
    await db.exec('BEGIN');
    await createSchema({ query: sql => db.exec(sql) });
    await importRows(db, state);
    await insertMarkers(db, state, sourceHash);
    const adapter = { query: async (sql, values = []) => ({ rows: (await db.query(sql, values)).rows }) };
    verifyState(state, await loadState(adapter));
    await db.exec('ROLLBACK');
    console.log('Embedded PostgreSQL dry run: passed');
  } finally { await db.close(); }
}

let stage = 'preflight';
async function main() {
  const config = await fs.readFile(configPath, 'utf8').catch(() => { throw new SafeError('.env.local is missing'); });
  const rawTarget = envValue(config, 'NEON_TARGET_DATABASE_URL');
  if (!rawTarget) throw new SafeError('NEON_TARGET_DATABASE_URL is missing from .env.local');
  let target;
  try { target = new URL(rawTarget); }
  catch { throw new SafeError('NEON_TARGET_DATABASE_URL is invalid'); }
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || !target.hostname.endsWith('.neon.tech') || !target.username || !target.password || !target.pathname.slice(1)) throw new SafeError('Target must be a complete Neon PostgreSQL URL');
  const sourcePath = path.resolve(process.env.PORTAL_DEMO_FILE || envValue(config, 'PORTAL_DEMO_FILE') || '.data/portal-demo.json');
  const sourceBytes = await fs.readFile(sourcePath).catch(() => { throw new SafeError('Demo JSON source is missing'); });
  let state = readState(sourceBytes);
  let sourceHash = sha256(sourceBytes);
  const client = new pg.Client({ connectionString: rawTarget, connectionTimeoutMillis: 10000 });
  stage = 'target connection';
  try {
    await client.connect();
    const identity = await client.query('SELECT current_database() AS db, current_user AS role');
    if (identity.rows[0].db !== decodeURIComponent(target.pathname.slice(1)) || identity.rows[0].role !== decodeURIComponent(target.username)) throw new SafeError('Connected database or role differs from the target URL');
    stage = 'target preflight';
    const tables = await checkTargetEmpty(client);
    console.log(`Neon target is reachable and empty (${tables} existing public tables).`);
    stage = 'embedded dry run';
    await dryRun(state, sourceHash);
    if (mode === '--check') return;

    stage = 'application shutdown check';
    if (await checkPort3000()) throw new SafeError('localhost:3000 is still running; stop the application before import');
    if (envValue(config, 'PORTAL_STORAGE') !== 'demo') throw new SafeError('Expected PORTAL_STORAGE=demo before import');
    const release = await lockfile.lock(sourcePath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 250 }, stale: 30000 });
    let preparedConfig = '';
    try {
      stage = 'source snapshot';
      const finalBytes = await fs.readFile(sourcePath);
      state = readState(finalBytes);
      sourceHash = sha256(finalBytes);
      const directory = path.resolve('backups', `neon-import-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(3).toString('hex')}`);
      await fs.mkdir(directory, { recursive: true, mode: 0o700 });
      await fs.writeFile(path.join(directory, 'portal-demo.json'), finalBytes, { mode: 0o600 });
      await fs.copyFile(configPath, path.join(directory, 'env.local.backup'));
      await fs.chmod(path.join(directory, 'env.local.backup'), 0o600);
      await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ sourceSha256: sourceHash, counts: Object.fromEntries(collections.map(name => [name, state[name].length])) }, null, 2), { mode: 0o600 });
      console.log(`Private source and configuration backup: ${directory}`);
      let nextConfig = setEnvValue(config, 'PORTAL_STORAGE', 'postgresql');
      nextConfig = setEnvValue(nextConfig, 'DATABASE_URL', rawTarget);
      if (!envValue(config, 'AUTH_SECRET') || envValue(config, 'AUTH_SECRET').length < 32) nextConfig = setEnvValue(nextConfig, 'AUTH_SECRET', randomBytes(32).toString('hex'));
      preparedConfig = path.join(directory, 'env.local.next');
      await fs.writeFile(preparedConfig, nextConfig, { mode: 0o600 });

      stage = 'final embedded dry run';
      await dryRun(state, sourceHash);
      stage = 'Neon transaction';
      await client.query('BEGIN');
      try {
        await client.query('SELECT pg_advisory_xact_lock(72402517)');
        await checkTargetEmpty(client);
        await createSchema(client);
        await importRows(client, state);
        await insertMarkers(client, state, sourceHash);
        const adapter = { query: async (sql, values = []) => ({ rows: (await client.query(sql, values)).rows }) };
        verifyState(state, await loadState(adapter));
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
      stage = 'post-commit verification';
      verifyState(state, await loadState({ query: async (sql, values = []) => ({ rows: (await client.query(sql, values)).rows }) }));
      const marker = await client.query("SELECT value FROM portal_meta WHERE id='demo-json-import-v1'");
      if (marker.rows.length !== 1 || JSON.parse(marker.rows[0].value).sourceSha256 !== sourceHash) throw new SafeError('Import metadata verification failed');
      if (sha256(await fs.readFile(sourcePath)) !== sourceHash) throw new SafeError('Source JSON changed during import');
      stage = 'local configuration switch';
      await fs.rename(preparedConfig, configPath);
      preparedConfig = '';
      console.log('Neon import verified; .env.local now selects PostgreSQL. Source JSON remains untouched.');
    } finally {
      if (preparedConfig) await fs.unlink(preparedConfig).catch(() => {});
      await release();
    }
  } finally { await client.end().catch(() => {}); }
}

main().catch(error => {
  const description = error instanceof SafeError ? error.message : (error?.code || error?.name || 'unknown error');
  console.error(`Import stopped at ${stage}: ${description}`);
  process.exitCode = 1;
});
