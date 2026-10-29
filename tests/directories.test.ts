import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { emptyState, withState } from '../src/lib/portal/store';
import { mutate, PortalError, view } from '../src/lib/portal/domain';
import { ensureDirectories, findCatalog, cohortMatches, catalogChoices } from '../src/lib/portal/directories';
import { getFormFields, updateFormValue, accountFormValues, type FormState } from '../src/lib/portal/form-model';
import type { PortalState, PortalUser } from '../src/lib/portal/types';
import { POST } from '../src/app/api/portal/route';
import { signSessionToken } from '../src/lib/auth';
import { authUser } from '../src/lib/portal/session';
import { studentSummary } from '../src/lib/portal/analytics';
import { buildAcademicDashboard } from '../src/lib/portal/academic-dashboard';

function fixture() {
  const state = emptyState();
  for (const role of ['admin', 'academic', 'lecturer'] as const) state.users.push({ id: role, username: role, name: role, email: role + '@test.vn', role, passwordHash: 'not-used', active: true, studentCode: null, lecturerCode: role === 'lecturer' ? 'GV01' : null, faculty: role === 'lecturer' ? 'Khoa A' : '', department: role === 'lecturer' ? 'Khoa A' : 'Phòng đào tạo', avatarUrl: '' });
  state.cohorts.push({ id: 'class-a', code: 'D23A', name: 'Lớp A', faculty: 'Khoa A', major: 'Ngành A', startYear: 2023, endYear: 2027, active: true }, { id: 'class-b', code: 'D24B', name: 'Lớp B', faculty: 'Khoa B', major: 'Ngành B', startYear: 2024, endYear: 2028, active: true });
  for (const [id, code, faculty, major, academicYear, cohortId] of [['st-a', 'SVA', 'Khoa A', 'Ngành A', '2023 - 2027', 'class-a'], ['st-b', 'SVB', 'Khoa B', 'Ngành B', '2024-2028', 'class-b']]) state.students.push({ id, code, name: 'Hồ sơ ' + code, email: code.toLowerCase() + '@test.vn', faculty, major, academicYear, cohortId, active: true, phone: '', address: '', dateOfBirth: '', avatarUrl: '', legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 });
  state.subjects.push({ id: 'subject', code: 'INT01', name: 'Môn A', credits: 3, department: 'Khoa A', active: true });
  state.sections.push({ id: 'section', code: 'INT01-01', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 20, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting', sectionId: 'section', day: 1, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'A101' });
  ensureDirectories(state); return state;
}
function apply(state: PortalState, action: string, body: Record<string, unknown>, role = 'admin') { const copy = structuredClone(state); mutate(copy, copy.users.find(row => row.role === role)!, action, body); return copy; }
function fails(fn: () => unknown, status: number) { assert.throws(fn, error => error instanceof PortalError && error.status === status); }
const studentBody = { code: 'SVC', name: 'Sinh viên mới', email: 'svc@test.vn', faculty: 'Khoa A', major: 'Ngành A', academicYear: '2023-2027', cohortId: 'class-a' };

test('directory upgrade preserves original rows, derives parent relationships and is repeatable', () => {
  const state = fixture(); const original = JSON.stringify([state.users, state.students, state.cohorts, state.sections, state.meetings]);
  state.catalogs = []; state.lecturers = [];
  assert.equal(ensureDirectories(state), true); assert.equal(ensureDirectories(state), false);
  assert.equal(JSON.stringify([state.users, state.students, state.cohorts, state.sections, state.meetings]), original);
  const faculty = findCatalog(state, 'faculty', 'Khoa A')!;
  assert.equal(findCatalog(state, 'major', 'Ngành A', faculty.id)?.name, 'Ngành A');
  assert.equal(findCatalog(state, 'major', 'Ngành B', faculty.id), undefined);
  assert.equal(findCatalog(state, 'intake', '2023 - 2027')?.name, '2023-2027');
  assert.equal(state.lecturers[0].code, 'GV01');
  const incomplete = fixture(); incomplete.lecturers = []; incomplete.users.find(row => row.role === 'lecturer')!.department = '';
  ensureDirectories(incomplete); assert.equal(incomplete.lecturers.length, 0, 'upgrade does not invent an incomplete lecturer profile');
});

test('API domain validates faculty/major/intake/cohort relationships on create and edit', () => {
  const state = fixture();
  const created = apply(state, 'student.save', studentBody);
  assert.equal(created.students.length, 3); assert.equal(created.students.find(row => row.code === studentBody.code)?.curriculumId, null);
  fails(() => apply(state, 'student.save', { ...studentBody, curriculumId: 'ptit-attt-chinh-quy-v1' }), 400);
  fails(() => apply(state, 'student.save', { ...studentBody, faculty: 'Khoa B' }), 400);
  fails(() => apply(state, 'student.save', { ...studentBody, cohortId: 'class-b' }), 400);
  fails(() => apply(state, 'student.save', { ...studentBody, academicYear: '2024-2028' }), 400);
  fails(() => apply(state, 'student.save', { ...state.students[0], major: 'Không có trong danh mục' }), 400);
  fails(() => apply(state, 'cohort.save', { ...state.cohorts[0], faculty: 'Khoa B', major: 'Ngành B' }), 409);
  fails(() => apply(state, 'cohort.save', { code: 'NEW', name: 'Lớp mới', faculty: 'Khoa A', major: 'Ngành A', intake: '2023-2027', startYear: 2024, endYear: 2028 }), 400);
  const legacy = fixture(); legacy.students[0].academicYear = '2023-2028'; ensureDirectories(legacy);
  const edited = apply(legacy, 'student.save', { ...legacy.students[0], name: 'Đổi tên, giữ dữ liệu cũ' });
  assert.equal(edited.students[0].academicYear, '2023-2028', 'an unchanged historical mismatch is preserved');
});

test('inactive directory entries reject new use and remain selectable only for their historical record', () => {
  let state = fixture();
  const faculty = findCatalog(state, 'faculty', 'Khoa A')!;
  state = apply(state, 'catalog.save', { ...faculty, active: false });
  fails(() => apply(state, 'student.save', studentBody), 409);
  assert.equal(apply(state, 'student.save', { ...state.students[0], name: 'Tên mới' }).students[0].faculty, 'Khoa A');
  assert.equal(catalogChoices(state.catalogs, 'faculty').some(row => row.value === 'Khoa A'), false);
  assert.ok(catalogChoices(state.catalogs, 'faculty', { current: 'Khoa A' }).some(row => row.label.includes('ngừng hoạt động')));
  const room = findCatalog(state, 'room', 'A101')!;
  state = apply(state, 'catalog.save', { ...room, active: false });
  fails(() => apply(state, 'meeting.save', { ...state.meetings[0], id: undefined, day: 2 }), 409);
  assert.equal(apply(state, 'meeting.save', { ...state.meetings[0], day: 2 }).meetings[0].room, 'A101');
  const term = findCatalog(state, 'semester', state.sections[0].semester)!;
  state = apply(state, 'catalog.save', { ...term, active: false });
  fails(() => apply(state, 'section.save', { ...state.sections[0], id: undefined, code: 'NEW', status: 'draft' }), 409);
  assert.equal(apply(state, 'section.save', { ...state.sections[0], capacity: 30 }).sections[0].semester, term.name);
});

test('catalog management checks roles, duplicate codes/names, parents and historical aliases', () => {
  let state = fixture();
  fails(() => apply(state, 'catalog.save', { kind: 'major', name: 'Ngành mới', parentId: 'invalid' }), 400);
  const faculty = findCatalog(state, 'faculty', 'Khoa A')!;
  fails(() => apply(state, 'catalog.save', { kind: 'faculty', name: 'khoa a' }), 409);
  fails(() => apply(state, 'catalog.save', { kind: 'faculty', name: 'Khoa C', code: faculty.code }), 409);
  state = apply(state, 'catalog.save', { ...faculty, name: 'Khoa A đổi tên' });
  assert.equal(state.students[0].faculty, 'Khoa A');
  assert.ok(findCatalog(state, 'faculty', 'Khoa A')?.aliases.includes('Khoa A'));
  assert.ok(cohortMatches(state.cohorts[0], 'Khoa A đổi tên', 'Ngành A', '2023-2027', state.catalogs));
  const count = state.catalogs.length; ensureDirectories(state); assert.equal(state.catalogs.length, count);
});

test('renaming room and semester preserves historical filters, GPA, conflicts and duplicate registration checks', () => {
  let state = fixture();
  const term = findCatalog(state, 'semester', state.sections[0].semester)!;
  state = apply(state, 'catalog.save', { ...term, name: 'Học kỳ đã đổi tên' });
  state.enrollments.push({ id: 'enrollment', studentId: 'st-a', sectionId: 'section', status: 'registered', registeredAt: new Date().toISOString() });
  state.results.push({ id: 'result', enrollmentId: 'enrollment', attendance: 8, midterm: 8, exam: 8, published: true, updatedAt: new Date().toISOString() });
  assert.equal(studentSummary(state, 'st-a', 'Học kỳ đã đổi tên').earnedCredits, 3);
  const dashboard = buildAcademicDashboard(state, { currentSemester: term.name, date: '2026-10-26' });
  assert.equal(dashboard.semester, 'Học kỳ đã đổi tên');
  assert.equal(dashboard.todaySchedule.length, 1);
  const room = findCatalog(state, 'room', 'A101')!;
  state = apply(state, 'catalog.save', { ...room, name: 'Phòng A101 đổi tên' });
  state.sections.push({ ...state.sections[0], id: 'second-section', code: 'INT01-02', semester: 'Học kỳ đã đổi tên', lecturerId: null });
  fails(() => apply(state, 'meeting.save', { ...state.meetings[0], id: undefined, sectionId: 'second-section', room: 'Phòng A101 đổi tên' }), 409);
  state.meetings.push({ ...state.meetings[0], id: 'second-meeting', sectionId: 'second-section', day: 2 });
  state.sections[1].lecturerId = 'lecturer';
  fails(() => apply(state, 'enrollment.add', { studentId: 'st-a', sectionId: 'second-section' }), 409);
});

test('accounts link existing complete profiles once and derive identity instead of trusting browser fields', () => {
  let state = fixture();
  const input = { username: 'sv-a', role: 'student', studentProfileId: 'st-a', name: 'Giả mạo', email: 'fake@test.vn', faculty: 'Khoa B', lecturerCode: 'FAKE', password: 'test-password' };
  state = apply(state, 'user.save', input);
  const account = state.users.find(row => row.username === 'sv-a')!;
  assert.equal(account.name, state.students[0].name); assert.equal(account.email, state.students[0].email); assert.equal(account.faculty, 'Khoa A'); assert.equal(account.studentCode, 'SVA'); assert.equal(account.lecturerCode, null);
  fails(() => apply(state, 'user.save', { ...input, username: 'duplicate' }), 409);
  const inactiveAccount = structuredClone(state); inactiveAccount.users.find(row => row.id === account.id)!.active = false;
  fails(() => apply(inactiveAccount, 'user.save', { ...input, username: 'still-duplicate' }), 409);
  assert.equal(apply(state, 'user.save', { ...account, studentProfileId: 'st-a', password: '' }).users.find(row => row.id === account.id)?.studentCode, 'SVA');
  fails(() => apply(state, 'user.save', { ...input, username: 'no-profile', studentProfileId: 'missing' }), 409);
  fails(() => apply(state, 'user.save', { username: 'new-gv', role: 'lecturer', lecturerCode: 'GV99', password: 'test-password' }), 409);
  state = apply(state, 'lecturer.save', { code: 'GV02', name: 'Giảng viên mới', email: 'gv02@test.vn', faculty: 'Khoa A', department: 'Khoa A', active: true }, 'academic');
  const lecturer = state.lecturers.find(row => row.code === 'GV02')!;
  state = apply(state, 'user.save', { username: 'gv02', role: 'lecturer', lecturerProfileId: lecturer.id, studentCode: 'SVA', department: 'Giả mạo', password: 'test-password' });
  assert.equal(state.users.find(row => row.username === 'gv02')?.department, 'Khoa A');
  fails(() => apply(state, 'user.save', { username: 'gv02-other', role: 'lecturer', lecturerProfileId: lecturer.id, password: 'test-password' }), 409);
  const promoted = apply(state, 'user.save', { ...account, role: 'academic', name: 'Giáo vụ', email: 'staff@test.vn', department: 'Phòng đào tạo', password: '' });
  assert.equal(promoted.users.find(row => row.id === account.id)?.studentCode, null);
});

test('form models reset invalid children, filter cohorts and show role-appropriate account fields', () => {
  const state = fixture(), data = view(state, state.users[0], 'demo');
  let form: FormState = { title: '', action: 'student.save', fields: [], values: { ...state.students[0] } };
  assert.equal(getFormFields(data, form).find(row => row.key === 'cohortId')?.options?.length, 1);
  form = updateFormValue(data, form, 'faculty', 'Khoa B'); assert.equal(form.values.major, ''); assert.equal(form.values.cohortId, '');
  form = { ...form, values: { ...state.students[0] } }; form = updateFormValue(data, form, 'academicYear', '2024-2028'); assert.equal(form.values.cohortId, '');
  form = { title: '', action: 'user.save', fields: [], values: accountFormValues(data) };
  form = updateFormValue(data, form, 'studentProfileId', 'st-a');
  assert.equal(form.values.studentCode, 'SVA'); assert.equal(form.values.classDisplay, 'D23A');
  let fields = getFormFields(data, form);
  assert.ok(fields.find(row => row.key === 'faculty')?.disabled); assert.ok(!fields.some(row => row.key === 'lecturerCode' || row.key === 'department'));
  form = updateFormValue(data, form, 'role', 'lecturer'); fields = getFormFields(data, form);
  assert.equal(form.values.studentProfileId, ''); assert.ok(!fields.some(row => row.key === 'studentCode')); assert.ok(fields.some(row => row.key === 'lecturerProfileId'));
  form = updateFormValue(data, form, 'role', 'admin'); fields = getFormFields(data, form);
  assert.ok(!fields.some(row => ['studentCode', 'lecturerCode', 'studentProfileId', 'lecturerProfileId'].includes(row.key)));
  for (const action of ['student.save', 'cohort.save', 'lecturer.save']) for (const item of getFormFields(data, { title: '', action, fields: [], values: {} }).filter(row => ['faculty', 'major', 'academicYear', 'intake', 'department', 'cohortId', 'curriculumId'].includes(row.key))) assert.equal(item.type, 'select');
});

test('real portal API rejects invalid relations and duplicate links on create/edit, and checks staff permissions', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-catalog-api-'));
  const oldMode = process.env.PORTAL_STORAGE, oldFile = process.env.PORTAL_DEMO_FILE;
  process.env.PORTAL_STORAGE = 'demo'; process.env.PORTAL_DEMO_FILE = path.join(directory, 'state.json');
  const state = fixture();
  state.users.push({ ...state.users[0], id: 'student-user', username: 'student', role: 'student', studentCode: 'SVA', lecturerCode: null, email: 'student@test.vn' });
  await fs.writeFile(process.env.PORTAL_DEMO_FILE, JSON.stringify(state));
  try {
    const call = async (who: string, action: string, body: object) => POST(new NextRequest('http://localhost:3000/api/portal', { method: 'POST', headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json', authorization: 'Bearer ' + signSessionToken(authUser(state.users.find(row => row.id === who)!, state)) }, body: JSON.stringify({ action, ...body }) }));
    assert.equal((await call('student-user', 'catalog.save', { kind: 'room', name: 'HACK' })).status, 403);
    assert.equal((await call('academic', 'student.save', { ...studentBody, cohortId: 'class-b' })).status, 400);
    const created = await call('admin', 'user.save', { username: 'svb', role: 'student', studentProfileId: 'st-b', name: 'Fake', email: 'fake@test.vn', password: 'test-password' }); assert.equal(created.status, 200);
    const id = (await created.json()).data.entityId;
    assert.equal((await call('admin', 'user.save', { username: 'svb2', role: 'student', studentProfileId: 'st-b', password: 'test-password' })).status, 409);
    assert.equal((await call('admin', 'user.save', { id, username: 'svb', role: 'student', studentProfileId: 'st-b', password: '' })).status, 200);
    const disk = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'));
    assert.equal(disk.users.find((row: PortalUser) => row.id === id).name, 'Hồ sơ SVB');
    assert.equal(disk.students.length, 2, 'account provisioning never creates an incomplete profile');
  } finally {
    if (oldMode === undefined) delete process.env.PORTAL_STORAGE; else process.env.PORTAL_STORAGE = oldMode;
    if (oldFile === undefined) delete process.env.PORTAL_DEMO_FILE; else process.env.PORTAL_DEMO_FILE = oldFile;
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('saved demo directories are upgraded with a backup and without rewriting historical records', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-directory-upgrade-'));
  const oldMode = process.env.PORTAL_STORAGE, oldFile = process.env.PORTAL_DEMO_FILE;
  process.env.PORTAL_STORAGE = 'demo'; process.env.PORTAL_DEMO_FILE = path.join(directory, 'legacy.json');
  const state = fixture(), legacy = structuredClone(state) as unknown as Record<string, unknown>; delete legacy.catalogs; delete legacy.lecturers;
  const original = JSON.stringify(legacy); await fs.writeFile(process.env.PORTAL_DEMO_FILE, original);
  try {
    await withState(false, upgraded => { assert.ok(upgraded.catalogs.length); assert.equal(upgraded.lecturers.length, 1); });
    assert.equal(await fs.readFile(process.env.PORTAL_DEMO_FILE + '.before-directories.json', 'utf8'), original);
    const upgradedText = await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'), upgraded = JSON.parse(upgradedText);
    for (const [key, rows] of Object.entries(legacy)) {
      if (['curriculumPrograms', 'curriculumVersions', 'curriculumAssignments'].includes(key)) continue;
      assert.deepEqual(upgraded[key], rows, key + ' stays unchanged');
    }
    assert.equal(upgraded.curriculumPrograms.length, 3, 'saved demo receives persisted curriculum versions without replacing its old records');
    assert.equal(await fs.readFile(process.env.PORTAL_DEMO_FILE + '.before-curriculum-upgrade.json', 'utf8'), original);
    await withState(false, () => {}); assert.equal(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'), upgradedText);
  } finally {
    if (oldMode === undefined) delete process.env.PORTAL_STORAGE; else process.env.PORTAL_STORAGE = oldMode;
    if (oldFile === undefined) delete process.env.PORTAL_DEMO_FILE; else process.env.PORTAL_DEMO_FILE = oldFile;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
