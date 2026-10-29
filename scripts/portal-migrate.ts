import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readLegacy, convertLegacy } from '../src/lib/portal/import-legacy';
import { emptyState, loadState, saveState, type Queryable } from '../src/lib/portal/store';
import { hashPassword } from '../src/lib/portal/password';
import { convertLegacySupportTickets } from '../src/lib/portal/support';
import { ensureDirectories } from '../src/lib/portal/directories';

loadEnvConfig(process.cwd());
async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('YOUR_NEON_PASSWORD')) throw new Error('Hãy đặt DATABASE_URL thật trong .env.local.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const db = await pool.connect();
  const adapter: Queryable = { query: async (sql, values) => ({ rows: (await db.query(sql, values)).rows }) };
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(72402517)');
    const snapshot = await readLegacy(adapter);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const directory = path.resolve('backups', stamp);
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    const exists = await db.query("SELECT to_regclass('public.portal_users') AS name");
    await db.query(await fs.readFile('database/001_portal.sql', 'utf8'));
    await db.query(await fs.readFile('database/002_support_tickets.sql', 'utf8'));
    await db.query(await fs.readFile('database/003_directories.sql', 'utf8'));
    await db.query(await fs.readFile('database/004_student_curriculum.sql', 'utf8'));
    await db.query(await fs.readFile('database/005_curriculum_management.sql', 'utf8'));
    let previous = exists.rows[0]?.name ? await loadState(adapter) : null;
    await fs.writeFile(path.join(directory, 'before-upgrade.json'), JSON.stringify({ createdAt: new Date().toISOString(), legacy: snapshot, portal: previous }, null, 2), { mode: 0o600 });
    if (previous) {
      const upgraded = structuredClone(previous);
      ensureDirectories(upgraded, process.env.PORTAL_CURRENT_SEMESTER);
      await saveState(adapter, upgraded, previous);
      previous = upgraded;
    }

    const supportImport = await db.query("SELECT value FROM portal_meta WHERE id='legacy-support-import-v2'");
    if (!supportImport.rows.length) {
      const supportState = structuredClone(previous || emptyState());
      const knownIds = new Set(supportState.supportTickets.map(ticket => ticket.id));
      const knownCodes = new Set(supportState.supportTickets.map(ticket => ticket.ticketCode));
      const imported = convertLegacySupportTickets(snapshot.support_tickets || [])
        .filter(ticket => !knownIds.has(ticket.id) && !knownCodes.has(ticket.ticketCode));
      supportState.supportTickets.push(...imported);
      await saveState(adapter, supportState, previous || emptyState());
      await db.query("INSERT INTO portal_meta(id,value) VALUES ('legacy-support-import-v2',$1)", [JSON.stringify({ imported: imported.length, preservedInLegacyTable: true })]);
    }

    const applied = await db.query("SELECT value FROM portal_meta WHERE id='legacy-import-v1'");
    if (applied.rows.length) {
      await db.query('COMMIT');
      console.log(`Schema đã được kiểm tra; không nhập lặp dữ liệu cũ. Bản sao trước thao tác: ${directory}`);
      return;
    }
    if (previous && previous.users.length) throw new Error('Đã có portal data nhưng thiếu dấu mốc nhập. Dừng để tránh ghi đè.');
    const { state, warnings } = convertLegacy(snapshot);
    if (!state.users.some(u => u.active && u.role === 'admin' && u.passwordHash.startsWith('scrypt:'))) {
      const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
      if (!password || password.length < 12) throw new Error('Cần BOOTSTRAP_ADMIN_PASSWORD ít nhất 12 ký tự để tạo Admin mới. Không có mật khẩu mặc định trong database thật.');
      const username = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin@ptit';
      if (state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Tên bootstrap trùng tài khoản cũ. Đặt BOOTSTRAP_ADMIN_USERNAME khác để giữ nguyên tài khoản cũ.');
      state.users.push({ id: randomUUID(), username, name: 'Quản trị viên PTIT', email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@ptit.edu.vn', role: 'admin', passwordHash: hashPassword(password), active: true, studentCode: null, lecturerCode: null, department: 'Quản trị hệ thống', faculty: '', avatarUrl: '/default-avatar.png' });
    }
    const academicPassword = process.env.BOOTSTRAP_ACADEMIC_PASSWORD;
    if (academicPassword) {
      if (academicPassword.length < 12) throw new Error('BOOTSTRAP_ACADEMIC_PASSWORD cần ít nhất 12 ký tự.');
      if (!state.users.some(u => u.username === 'giaovu@ptit' || u.email === 'giaovu@ptit.edu.vn')) state.users.push({ id: randomUUID(), username: 'giaovu@ptit', name: 'Phòng Giáo vụ', email: 'giaovu@ptit.edu.vn', role: 'academic', passwordHash: hashPassword(academicPassword), active: true, studentCode: null, lecturerCode: null, department: 'Phòng Giáo vụ', faculty: '', avatarUrl: '/default-avatar.png' });
    }
    ensureDirectories(state, process.env.PORTAL_CURRENT_SEMESTER);
    await saveState(adapter, state, emptyState());
    const report = { counts: Object.fromEntries(Object.entries(state).map(([k, v]) => [k, v.length])), warnings, policy: 'Không sửa/xóa bảng cũ. Điểm tổng kết mới tính theo 10%-30%-60%; dữ liệu gốc được giữ nguyên trong bảng cũ và backup. Legacy GPA/credits lưu riêng, không cộng với kết quả mới vì không có đủ lịch sử để chống trùng.' };
    await db.query("INSERT INTO portal_meta(id,value) VALUES ('legacy-import-v1',$1)", [JSON.stringify(report)]);
    await fs.writeFile(path.join(directory, 'import-report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
    await db.query('COMMIT');
    console.log('Cập nhật thành công. Các bảng cũ được giữ nguyên.');
    console.log(JSON.stringify(report.counts, null, 2));
    console.log(`Bản sao và danh sách lớp cần xác nhận lịch: ${directory}`);
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  } finally { db.release(); await pool.end(); }
}
main().catch(e => { console.error(e instanceof Error ? e.message.replace(/postgres(?:ql)?:\/\/\S+/g, '[DATABASE_URL]') : 'Cập nhật thất bại'); process.exitCode = 1; });
