import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { POST as login } from '../src/app/api/auth/login/route';
import { GET as getPortal } from '../src/app/api/portal/route';
import { GET, PATCH, POST } from '../src/app/api/support/tickets/route';
import { emptyState } from '../src/lib/portal/store';
import { migrateLegacySupportCategory, migrateLegacySupportStatus } from '../src/lib/portal/support';

const origin = 'http://localhost:3000';
function request(url: string, method: string, token?: string, body?: object) {
  return new NextRequest(origin + url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json', origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('legacy support categories and statuses map into the reduced workflow without orphaning closed requests', () => {
  assert.equal(migrateLegacySupportCategory('grade_appeal'), 'grade_appeal');
  assert.equal(migrateLegacySupportCategory('course_reg'), 'academic_support');
  assert.equal(migrateLegacySupportCategory('account_security'), 'account_website');
  assert.equal(migrateLegacySupportCategory('facility_tech'), 'account_website');
  assert.equal(migrateLegacySupportCategory('tuition_scholarship'), 'other');
  assert.equal(migrateLegacySupportStatus('submitted', ''), 'pending');
  assert.equal(migrateLegacySupportStatus('processing', ''), 'in_progress');
  assert.equal(migrateLegacySupportStatus('resolved', 'Đã xử lý'), 'closed');
  assert.equal(migrateLegacySupportStatus('rejected', ''), 'in_progress');
});

test('support workflow routes by category, preserves sender identity, returns response only to owner, and validates appeals', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-support-'));
  const oldMode = process.env.PORTAL_STORAGE, oldFile = process.env.PORTAL_DEMO_FILE;
  process.env.PORTAL_STORAGE = 'demo';
  process.env.PORTAL_DEMO_FILE = path.join(directory, 'state.json');
  const state = emptyState();
  const password = 'support-api-test-password';
  for (const [id, role, code] of [
    ['admin', 'admin', null], ['academic', 'academic', null],
    ['sv1', 'student', 'SV01'], ['sv2', 'student', 'SV02'],
  ] as const) state.users.push({
    id, username: id, name: `Tài khoản ${id}`, email: `${id}@test.vn`, role,
    studentCode: code, lecturerCode: null, passwordHash: 'unused', active: true,
    department: role === 'academic' ? 'Phòng Giáo vụ' : '', faculty: '', avatarUrl: '/default-avatar.png',
  });
  state.cohorts.push({ id: 'cohort', code: 'D26CNTT', name: 'CNTT 2026', major: 'CNTT', faculty: 'CNTT', startYear: 2026, endYear: 2030, active: true });
  state.students.push(
    { id: 'st1', code: 'SV01', name: 'Sinh viên Một', email: 'sv1@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'CNTT', academicYear: '2026-2030', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
    { id: 'st2', code: 'SV02', name: 'Sinh viên Hai', email: 'sv2@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'CNTT', academicYear: '2026-2030', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
  );
  state.subjects.push({ id: 'subject', code: 'INT01', name: 'Môn kiểm thử', credits: 3, department: 'CNTT', active: true });
  state.sections.push({ id: 'section', code: 'INT01-01', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: null, capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.enrollments.push({ id: 'enrollment', sectionId: 'section', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' });
  state.results.push({ id: 'result', enrollmentId: 'enrollment', attendance: 0, midterm: 8, exam: 9, published: true, updatedAt: '2026-10-01T00:00:00.000Z' });
  await fs.writeFile(process.env.PORTAL_DEMO_FILE, JSON.stringify(state));

  try {
    const tokens: Record<string, string> = {};
    for (const username of ['admin', 'academic', 'sv1', 'sv2']) {
      // The login handler verifies a real test password; seed it through the same password helper.
      const { hashPassword } = await import('../src/lib/portal/password');
      const user = state.users.find(row => row.username === username)!;
      user.passwordHash = hashPassword(password);
    }
    await fs.writeFile(process.env.PORTAL_DEMO_FILE, JSON.stringify(state));
    for (const username of ['admin', 'academic', 'sv1', 'sv2']) {
      const response = await login(request('/api/auth/login', 'POST', undefined, { username, password }));
      const json = await response.json();
      assert.equal(response.status, 200, JSON.stringify(json));
      tokens[username] = json.data.token;
    }

    const sentAcademic = await POST(request('/api/support/tickets', 'POST', tokens.sv1, {
      category: 'academic_support', subject: 'Không đăng ký được lớp', content: 'Xin kiểm tra giúp.',
      userId: 'admin', userName: 'Tên giả', userCode: 'ADMIN', receiverUnit: 'admin',
    }));
    assert.equal(sentAcademic.status, 201);
    const academicTicket = (await sentAcademic.json()).data;
    assert.equal(academicTicket.userId, 'sv1');
    assert.equal(academicTicket.userName, 'Tài khoản sv1');
    assert.equal(academicTicket.receiverUnit, 'academic');
    assert.equal(academicTicket.userCode, 'SV01');

    const studentTickets = await (await GET(request('/api/support/tickets', 'GET', tokens.sv1))).json();
    assert.deepEqual(studentTickets.data.tickets.map((ticket: { ticketCode: string }) => ticket.ticketCode), [academicTicket.ticketCode]);
    assert.equal(studentTickets.data.sender.email, 'sv1@test.vn');
    const otherStudentTickets = await (await GET(request('/api/support/tickets', 'GET', tokens.sv2))).json();
    assert.equal(otherStudentTickets.data.tickets.length, 0, 'another student cannot list the first student\'s request');

    const portalView = await (await getPortal(request('/api/portal', 'GET', tokens.sv2))).json();
    assert.equal(Object.hasOwn(portalView.data, 'supportTickets'), false, 'general portal API does not expose support records');

    const sentAdmin = await POST(request('/api/support/tickets', 'POST', tokens.sv2, {
      category: 'account_website', subject: 'Không đăng nhập được', content: 'Báo lỗi đăng nhập.',
    }));
    assert.equal(sentAdmin.status, 201);
    const adminTicket = (await sentAdmin.json()).data;
    assert.equal(adminTicket.receiverUnit, 'admin');

    const academicInbox = await (await GET(request('/api/support/tickets', 'GET', tokens.academic))).json();
    assert.deepEqual(academicInbox.data.tickets.map((ticket: { ticketCode: string }) => ticket.ticketCode), [academicTicket.ticketCode]);
    const adminInbox = await (await GET(request('/api/support/tickets', 'GET', tokens.admin))).json();
    assert.deepEqual(adminInbox.data.tickets.map((ticket: { ticketCode: string }) => ticket.ticketCode), [adminTicket.ticketCode]);
    assert.equal((await PATCH(request('/api/support/tickets', 'PATCH', tokens.admin, { ticketCode: academicTicket.ticketCode, status: 'in_progress' }))).status, 403);
    assert.equal((await PATCH(request('/api/support/tickets', 'PATCH', tokens.academic, { ticketCode: adminTicket.ticketCode, status: 'in_progress' }))).status, 403);
    assert.equal((await PATCH(request('/api/support/tickets', 'PATCH', tokens.academic, { ticketCode: academicTicket.ticketCode, status: 'closed', adminResponse: '' }))).status, 400);

    assert.equal((await PATCH(request('/api/support/tickets', 'PATCH', tokens.academic, { ticketCode: academicTicket.ticketCode, status: 'in_progress', adminResponse: 'Đang kiểm tra.' }))).status, 200);
    assert.equal((await PATCH(request('/api/support/tickets', 'PATCH', tokens.academic, { ticketCode: academicTicket.ticketCode, status: 'closed', adminResponse: 'Đã hướng dẫn đăng ký lớp.' }))).status, 200);
    const afterResponse = await (await GET(request('/api/support/tickets', 'GET', tokens.sv1))).json();
    assert.equal(afterResponse.data.tickets[0].status, 'closed');
    assert.equal(afterResponse.data.tickets[0].adminResponse, 'Đã hướng dẫn đăng ký lớp.');

    const appealOptions = await (await GET(request('/api/support/tickets', 'GET', tokens.sv1))).json();
    assert.equal(appealOptions.data.appealOptions.length, 1);
    assert.equal(appealOptions.data.appealOptions[0].scores.attendance, 0, 'zero is a valid published score');
    const appeal = await POST(request('/api/support/tickets', 'POST', tokens.sv1, {
      category: 'grade_appeal', subject: 'Xin phúc khảo', content: 'Xin xem lại bài thi.', sectionId: 'section',
    }));
    assert.equal(appeal.status, 201);
    assert.equal((await appeal.json()).data.receiverUnit, 'academic');
    const invalidAppeal = await POST(request('/api/support/tickets', 'POST', tokens.sv2, {
      category: 'grade_appeal', subject: 'Phúc khảo giả', content: 'Xin xem lại điểm.', sectionId: 'section',
    }));
    assert.equal(invalidAppeal.status, 403, 'server rejects a section without the requesting student\'s active enrollment');

    const persisted = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'));
    assert.equal(persisted.supportTickets.length, 3);
    assert.equal(persisted.results[0].exam, 9, 'appeal creation never changes the grade');
  } finally {
    if (oldMode === undefined) delete process.env.PORTAL_STORAGE; else process.env.PORTAL_STORAGE = oldMode;
    if (oldFile === undefined) delete process.env.PORTAL_DEMO_FILE; else process.env.PORTAL_DEMO_FILE = oldFile;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
