import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { emptyState } from '../src/lib/portal/store';
import { hashPassword, checkPassword } from '../src/lib/portal/password';
import { completedSubjectCodes, studentSummary } from '../src/lib/portal/analytics';
import { POST as login } from '../src/app/api/auth/login/route';
import { POST as portal, GET as portalGet } from '../src/app/api/portal/route';
import { POST as changePassword } from '../src/app/api/auth/password/route';
import { POST as supportPost, GET as supportGet, PATCH as supportPatch } from '../src/app/api/support/tickets/route';
import { GET as demoAccounts } from '../src/app/api/demo/accounts/route';
import { readDemoAiSettings, writeDemoAiSettings } from '../src/lib/portal/demo-ai-settings';
import { ensureDirectories, findCatalog } from '../src/lib/portal/directories';
import { saveDirectory } from '../src/lib/portal/directory-mutations';

const origin = 'http://localhost:3000';
function req(method: string, token?: string, body?: object) {
  return new NextRequest(origin + '/api/test', { method, headers: { origin, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test('desktop demo: create student/class, register, publish, appeal, lock and manage passwords without touching existing data', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-desktop-'));
  const old = { mode: process.env.PORTAL_STORAGE, file: process.env.PORTAL_DEMO_FILE, ai: process.env.PORTAL_AI_CONFIG_FILE, database: process.env.DATABASE_URL };
  process.env.PORTAL_STORAGE = 'demo'; process.env.PORTAL_DEMO_FILE = path.join(directory, 'state.json'); process.env.PORTAL_AI_CONFIG_FILE = path.join(directory, 'ai.json');
  const state = emptyState(), password = 'desktop-test-password';
  for (const role of ['admin', 'academic', 'lecturer'] as const) state.users.push({ id: role, username: role, name: role, role, email: role + '@test.vn', passwordHash: hashPassword(password), studentCode: null, lecturerCode: role === 'lecturer' ? 'GV01' : null, active: true, department: '', faculty: '', avatarUrl: '' });
  state.users.find(row => row.role === 'lecturer')!.department = 'CNTT'; state.users.find(row => row.role === 'lecturer')!.faculty = 'CNTT';
  ensureDirectories(state);
  saveDirectory(state, state.users[0], 'catalog.save', { kind: 'major', name: 'CNTT', parentId: findCatalog(state, 'faculty', 'CNTT')!.id });
  const faculty = 'Khoa Viễn thông 1', major = 'Kỹ thuật Điện tử Viễn thông', semester = 'Học kỳ 1 · Năm học 2023-2024';
  const facultyEntry = saveDirectory(state, state.users[0], 'catalog.save', { kind: 'faculty', name: faculty });
  saveDirectory(state, state.users[0], 'catalog.save', { kind: 'major', name: major, parentId: facultyEntry });
  for (const [kind, name] of [['semester', semester], ['room', 'TEST101']] as const) saveDirectory(state, state.users[0], 'catalog.save', { kind, name });
  await fs.writeFile(process.env.PORTAL_DEMO_FILE, JSON.stringify(state));
  try {
    const signIn = async (username: string, secret: string) => {
      const response = await login(req('POST', undefined, { username, password: secret })); const json = await response.json(); assert.equal(response.status, 200, JSON.stringify(json)); return json.data.token as string;
    };
    const admin = await signIn('admin', password), academic = await signIn('academic', password), lecturer = await signIn('lecturer', password);
    const act = async (token: string, action: string, body: object) => {
      const response = await portal(req('POST', token, { action, ...body })); const json = await response.json(); assert.equal(response.status, 200, JSON.stringify(json)); return json.data;
    };
    const cohort = await act(academic, 'cohort.save', { code: 'D23VT01', name: 'Lớp kiểm thử', major, faculty, startYear: 2023, endYear: 2027 });
    const student = await act(academic, 'student.save', { code: 'B23DCVT022', name: 'Sinh viên kiểm thử', email: 'student@test.vn', cohortId: cohort.entityId, major, faculty, academicYear: '2023-2027', curriculumId: 'ptit-vt-chinh-quy-v1', requiredCredits: 140 });
    await act(admin, 'user.save', { username: 'B23DCVT022', name: 'Sinh viên kiểm thử', email: 'student@test.vn', role: 'student', studentCode: 'B23DCVT022', password: 'ptit@123', active: true });
    const studentToken = await signIn('B23DCVT022', 'ptit@123');
    const subject = await act(academic, 'subject.save', { code: 'BAS1150', name: 'Môn kiểm thử', credits: 3, department: 'CNTT' });
    const sectionBody = { code: 'BAS1150-TEST', subjectId: subject.entityId, semester, lecturerId: 'lecturer', capacity: 2, status: 'draft', registrationStart: '', registrationEnd: '' };
    const section = await act(academic, 'section.save', sectionBody);
    await act(academic, 'meeting.save', { sectionId: section.entityId, day: 1, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'TEST101' });
    await act(academic, 'section.save', { ...sectionBody, id: section.entityId, status: 'open' });
    const registered = await act(studentToken, 'enrollment.add', { sectionId: section.entityId });
    const grade = { enrollmentId: registered.entityId, attendance: 0, midterm: 8, exam: 9, published: false };
    assert.equal((await portal(req('POST', lecturer, { action: 'result.save', ...grade }))).status, 403, 'lecturers cannot enter grades');
    await act(academic, 'result.save', grade);
    const beforePublish = await (await portalGet(req('GET', studentToken))).json();
    assert.equal(beforePublish.data.results.length, 0);
    assert.ok(beforePublish.data.cancellationIssues[registered.entityId], 'student sees cancellation restriction without seeing unpublished scores');
    assert.equal((await portal(req('POST', studentToken, { action: 'enrollment.cancel', id: registered.entityId }))).status, 409);
    await act(academic, 'result.save', { ...grade, published: true });
    const appealOptions = await (await supportGet(req('GET', studentToken))).json(); assert.equal(appealOptions.data.appealOptions.length, 1);
    const sent = await supportPost(req('POST', studentToken, { category: 'grade_appeal', subject: 'Phúc khảo', content: 'Xin kiểm tra điểm thi.', sectionId: section.entityId })); assert.equal(sent.status, 201);
    const ticket = (await sent.json()).data;
    assert.equal((await supportPatch(req('PATCH', admin, { ticketCode: ticket.ticketCode, status: 'closed', adminResponse: 'Không đúng phạm vi' }))).status, 403);
    assert.equal((await supportPatch(req('PATCH', academic, { ticketCode: ticket.ticketCode, status: 'closed', adminResponse: 'Đã kiểm tra, giữ nguyên điểm.' }))).status, 200);
    const seen = await (await supportGet(req('GET', studentToken))).json(); assert.equal(seen.data.tickets[0].status, 'closed');
    await act(academic, 'section.lock', { id: section.entityId, locked: true });
    const second = await act(academic, 'student.save', { code: 'SV02', name: 'Sinh viên hai', email: 's2@test.vn', major: 'CNTT', faculty: 'CNTT', academicYear: '2026-2030' });
    assert.equal((await portal(req('POST', academic, { action: 'enrollment.add', sectionId: section.entityId, studentId: second.entityId }))).status, 409, 'locked class rejects new enrollment even with spare capacity');
    assert.equal((await portal(req('POST', lecturer, { action: 'result.save', ...grade }))).status, 403);
    assert.equal((await changePassword(req('POST', undefined, {}))).status, 401);
    assert.equal((await changePassword(req('POST', studentToken, { currentPassword: 'wrong', newPassword: password, confirmPassword: password }))).status, 400);
    assert.equal((await changePassword(req('POST', studentToken, { currentPassword: 'ptit@123', newPassword: password, confirmPassword: 'different' }))).status, 400);
    assert.equal((await changePassword(req('POST', studentToken, { userId: 'admin', currentPassword: 'ptit@123', newPassword: password, confirmPassword: password }))).status, 200);
    assert.equal((await login(req('POST', undefined, { username: 'B23DCVT022', password: 'ptit@123' }))).status, 401);
    await signIn('B23DCVT022', password); await signIn('admin', password);
    const hints = await (await demoAccounts()).json(); assert.equal(hints.accounts.find((row: { username: string }) => row.username.toUpperCase() === 'B23DCVT022').password, null);
    const stored = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'));
    const studentUser = stored.users.find((row: { studentCode: string }) => row.studentCode === 'B23DCVT022');
    assert.equal((await portal(req('POST', studentToken, { action: 'user.password.reset', id: 'admin', password }))).status, 403);
    await act(admin, 'user.password.reset', { id: studentUser.id, password: 'admin-reset-password' });
    await signIn('B23DCVT022', 'admin-reset-password');
    assert.equal(checkPassword(password, studentUser.passwordHash), true);
    assert.equal(studentSummary(stored, student.entityId).earnedCredits, 3);
    assert.deepEqual([...completedSubjectCodes(stored, student.entityId)], ['BAS1150']);
    assert.equal(stored.results[0].exam, 9, 'appeal never changes grades');
    const unpublished = structuredClone(stored); unpublished.results[0].published = false; assert.equal(completedSubjectCodes(unpublished, student.entityId).size, 0);
    const failed = structuredClone(stored); failed.results[0].attendance = 0; failed.results[0].midterm = 0; failed.results[0].exam = 0; assert.equal(completedSubjectCodes(failed, student.entityId).size, 0);
    const cancelled = structuredClone(stored); cancelled.enrollments[0].status = 'cancelled'; assert.equal(completedSubjectCodes(cancelled, student.entityId).size, 0);
    await writeDemoAiSettings('dummy-key-for-local-test'); assert.equal((await readDemoAiSettings()).geminiKey, 'dummy-key-for-local-test');
    await fs.writeFile(process.env.PORTAL_AI_CONFIG_FILE, 'broken'); await assert.rejects(readDemoAiSettings);
    process.env.PORTAL_STORAGE = 'postgresql'; process.env.DATABASE_URL = 'postgresql://test:unused@127.0.0.1:1/test';
    assert.equal((await (await demoAccounts()).json()).enabled, false, 'demo account hints never load real database users');
  } finally {
    for (const [key, value] of Object.entries({ PORTAL_STORAGE: old.mode, PORTAL_DEMO_FILE: old.file, PORTAL_AI_CONFIG_FILE: old.ai, DATABASE_URL: old.database })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await fs.rm(directory, { recursive: true, force: true });
  }
});
