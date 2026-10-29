import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/lib/portal/store';
import { mutate, view, meetingsOverlap, PortalError } from '../src/lib/portal/domain';
import { gradeSummary, studentSummary } from '../src/lib/portal/analytics';
import { hashPassword, checkPassword } from '../src/lib/portal/password';
import { registrationIssue } from '../src/lib/portal/registration';
import { ensureDirectories, findCatalog } from '../src/lib/portal/directories';
import { saveDirectory } from '../src/lib/portal/directory-mutations';
import { importLegacyDemoCurricula } from '../src/lib/portal/curricula';
import type { Actor, PortalState, PortalUser, Meeting } from '../src/lib/portal/types';

function fixture() {
  const s = emptyState();
  const user = (id: string, role: PortalUser['role'], studentCode: string | null = null): PortalUser => ({ id, role, username: id, name: id, email: `${id}@test.vn`, passwordHash: 'not-used', active: true, studentCode, lecturerCode: role === 'lecturer' ? id : null, department: role === 'lecturer' ? 'CNTT' : '', faculty: role === 'lecturer' ? 'CNTT' : '', avatarUrl: '' });
  s.users.push(user('admin', 'admin'), user('academic', 'academic'), user('lecturer', 'lecturer'), user('other-teacher', 'lecturer'), user('student', 'student', 'SV01'), user('student2', 'student', 'SV02'));
  for (let i = 1; i <= 2; i++) s.students.push({ id: `st${i}`, code: `SV0${i}`, name: `Sinh viên ${i}`, email: `s${i}@test.vn`, cohortId: null, major: 'Kỹ thuật Điện tử Viễn thông', faculty: 'Khoa Viễn thông 1', academicYear: '2023 - 2027', curriculumId: 'ptit-vt-chinh-quy-v1', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 3.9, legacyCredits: 50, targetGpa: 3.5, requiredCredits: 140 });
  s.subjects.push({ id: 'subject', code: 'BAS1201', name: 'Môn học', credits: 3, department: 'CNTT', active: true }, { id: 'subject2', code: 'BAS1106', name: 'Môn khác', credits: 2, department: 'CNTT', active: true }, { id: 'subject3', code: 'BAS1151', name: 'Môn học kỳ hai', credits: 2, department: 'CNTT', active: true });
  s.sections.push({ id: 'sec', code: 'BAS1201-01', subjectId: 'subject', semester: 'Học kỳ 1 · Năm học 2023-2024', lecturerId: 'lecturer', capacity: 1, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  s.meetings.push({ id: 'm', sectionId: 'sec', day: 1, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'A101' });
  importLegacyDemoCurricula(s); ensureDirectories(s);
  for (const [kind, name] of [['semester', 'HK2'], ['room', 'B101']] as const) saveDirectory(s, s.users[0], 'catalog.save', { kind, name });
  return s;
}
function actor(s: PortalState, id: string): Actor { return s.users.find(u => u.id === id)!; }
function apply(s: PortalState, id: string, action: string, body: Record<string, unknown>) { const copy = structuredClone(s); mutate(copy, actor(copy, id), action, body); return copy; }
function throwsStatus(fn: () => unknown, status: number) { assert.throws(fn, (e: unknown) => e instanceof PortalError && e.status === status); }

test('four-role permission matrix is enforced in domain', () => {
  const s = fixture();
  for (const id of ['student', 'lecturer']) throwsStatus(() => apply(s, id, 'cohort.save', {}), 403);
  for (const id of ['academic', 'lecturer', 'student']) throwsStatus(() => apply(s, id, 'user.save', {}), 403);
  throwsStatus(() => apply(s, 'lecturer', 'enrollment.add', { sectionId: 'sec', studentId: 'st1' }), 403);
  const next = apply(s, 'academic', 'cohort.save', { code: 'D23VT', name: 'Lớp Viễn thông', major: 'Kỹ thuật Điện tử Viễn thông', faculty: 'Khoa Viễn thông 1', startYear: 2023, endYear: 2027 });
  assert.equal(next.cohorts.length, 1); assert.equal(next.audits.length, 1);
});
test('registration owns identity, prevents over-capacity and duplicates', () => {
  const s = fixture();
  throwsStatus(() => apply(s, 'student', 'enrollment.add', { sectionId: 'sec', studentId: 'st2' }), 403);
  const next = apply(s, 'student', 'enrollment.add', { sectionId: 'sec' });
  assert.equal(next.enrollments[0].studentId, 'st1');
  throwsStatus(() => apply(next, 'student2', 'enrollment.add', { sectionId: 'sec' }), 409);
  throwsStatus(() => apply(next, 'student', 'enrollment.add', { sectionId: 'sec' }), 409);
  const cancelled = apply(next, 'student', 'enrollment.cancel', { id: next.enrollments[0].id });
  assert.equal(cancelled.enrollments[0].status, 'cancelled');
  const again = apply(cancelled, 'student2', 'enrollment.add', { sectionId: 'sec' }); assert.equal(again.enrollments.filter(e => e.status === 'registered').length, 1);
});
test('registration checks deadlines, active student, missing schedule, subject duplicates', () => {
  const s = fixture(); s.sections[0].registrationStart = '2099-01-01T00:00:00Z';
  throwsStatus(() => apply(s, 'student', 'enrollment.add', { sectionId: 'sec' }), 409);
  s.sections[0].registrationStart = ''; s.meetings = [];
  throwsStatus(() => apply(s, 'student', 'enrollment.add', { sectionId: 'sec' }), 409);
  const a = fixture(); a.students[0].active = false;
  throwsStatus(() => apply(a, 'student', 'enrollment.add', { sectionId: 'sec' }), 409);
  let b = fixture(); b.sections.push({ ...b.sections[0], id: 'sec2', code: 'INT01-02', lecturerId: 'other-teacher' }); b.meetings.push({ ...b.meetings[0], id: 'm2', sectionId: 'sec2', day: 2 });
  b = apply(b, 'student', 'enrollment.add', { sectionId: 'sec' });
  throwsStatus(() => apply(b, 'student', 'enrollment.add', { sectionId: 'sec2' }), 409);
});

test('creating a class is separate from scheduling and opening registration', () => {
  let s = fixture();
  const body = { code: 'BAS1106-NEW', subjectId: 'subject2', semester: 'Học kỳ 1 · Năm học 2023-2024', lecturerId: 'lecturer', capacity: 2, status: 'open', registrationStart: '', registrationEnd: '' };
  throwsStatus(() => apply(s, 'academic', 'section.save', body), 400);
  s = apply(s, 'academic', 'section.save', { ...body, status: 'draft' });
  const section = s.sections.find(row => row.code === body.code)!;
  throwsStatus(() => apply(s, 'student', 'enrollment.add', { sectionId: section.id }), 409);
  throwsStatus(() => apply(s, 'academic', 'section.save', { ...body, id: section.id }), 400);
  s = apply(s, 'academic', 'meeting.save', { sectionId: section.id, day: 2, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'B101' });
  s = apply(s, 'academic', 'section.save', { ...body, id: section.id });
  s = apply(s, 'student', 'enrollment.add', { sectionId: section.id });
  const meeting = s.meetings.find(row => row.sectionId === section.id)!;
  throwsStatus(() => apply(s, 'academic', 'meeting.save', { ...meeting, sectionId: 'sec' }), 409);
  const enrollment = s.enrollments.find(row => row.sectionId === section.id)!;
  s = apply(s, 'student', 'enrollment.cancel', { id: enrollment.id });
  s = apply(s, 'student', 'enrollment.add', { sectionId: section.id });
  assert.equal(s.enrollments.filter(row => row.sectionId === section.id).length, 1, 're-registration reuses the cancelled enrollment');
  assert.equal(s.enrollments.find(row => row.id === enrollment.id)?.status, 'registered');
});

test('registration becomes available at the opening time and expires after the deadline', () => {
  const section = fixture().sections[0];
  section.registrationStart = '2026-10-28T00:00:00Z'; section.registrationEnd = '2026-10-29T00:00:00Z';
  assert.ok(registrationIssue(section, 0, true, Date.parse(section.registrationStart) - 1));
  assert.equal(registrationIssue(section, 0, true, Date.parse(section.registrationStart)), null);
  assert.equal(registrationIssue(section, 0, true, Date.parse(section.registrationEnd)), null);
  assert.ok(registrationIssue(section, 0, true, Date.parse(section.registrationEnd) + 1));
  assert.ok(registrationIssue(section, section.capacity, true, Date.parse(section.registrationStart)));
});
test('weekly overlap handles disjoint dates and weekday not occurring in intersection', () => {
  const m = fixture().meetings[0]; assert.equal(meetingsOverlap(m, m), true);
  assert.equal(meetingsOverlap(m, { ...m, startDate: '2027-01-01', endDate: '2027-02-01' }), false);
  assert.equal(meetingsOverlap(m, { ...m, startPeriod: 4, endPeriod: 6 }), false);
  assert.equal(meetingsOverlap({ ...m, startDate: '2026-10-26', endDate: '2026-10-27' }, { ...m, startDate: '2026-10-27', endDate: '2026-10-28' }), false);
});
test('scheduling rejects room, lecturer and enrolled student conflicts', () => {
  for (const scenario of ['room', 'teacher', 'student']) {
    let s = fixture(); s.sections.push({ ...s.sections[0], id: 'sec2', code: 'INT02-01', subjectId: 'subject2', lecturerId: scenario === 'teacher' ? 'lecturer' : 'other-teacher' });
    s.meetings.push({ ...s.meetings[0], id: 'm2', sectionId: 'sec2', day: 2, room: scenario === 'room' ? 'A101' : 'A102' });
    if (scenario === 'student') { s = apply(s, 'student', 'enrollment.add', { sectionId: 'sec' }); s = apply(s, 'student', 'enrollment.add', { sectionId: 'sec2' }); }
    throwsStatus(() => apply(s, 'academic', 'meeting.save', { ...s.meetings[1], day: 1 }), 409);
    assert.equal(s.meetings[1].day, 2, 'original state untouched after failure');
  }
});
test('changing teacher also checks conflicts and capacity cannot undercut enrollment', () => {
  let s = fixture(); s.sections.push({ ...s.sections[0], id: 'sec2', code: 'INT02-01', subjectId: 'subject2', lecturerId: 'other-teacher' }); s.meetings.push({ ...s.meetings[0], id: 'm2', sectionId: 'sec2', room: 'A102' });
  throwsStatus(() => apply(s, 'academic', 'section.save', { ...s.sections[1], lecturerId: 'lecturer' }), 409);
  s.sections[0].capacity = 2; s = apply(s, 'student', 'enrollment.add', { sectionId: 'sec' }); s = apply(s, 'student2', 'enrollment.add', { sectionId: 'sec' });
  throwsStatus(() => apply(s, 'academic', 'section.save', { ...s.sections[0], capacity: 1 }), 409);
});
test('grade entry belongs to Giáo vụ and rejects invalid/partial published values or locked classes', () => {
  let s = apply(fixture(), 'student', 'enrollment.add', { sectionId: 'sec' }); const enrollmentId = s.enrollments[0].id;
  const b = { enrollmentId, attendance: 10, midterm: 8, exam: 9, published: true };
  throwsStatus(() => apply(s, 'student', 'result.save', b), 403);
  throwsStatus(() => apply(s, 'other-teacher', 'result.save', b), 403);
  throwsStatus(() => apply(s, 'lecturer', 'result.save', b), 403);
  throwsStatus(() => apply(s, 'lecturer', 'result.batch', { rows: [b] }), 403);
  throwsStatus(() => apply(s, 'academic', 'result.save', { ...b, exam: 10.1 }), 400);
  throwsStatus(() => apply(s, 'academic', 'result.save', { ...b, exam: '' }), 400);
  s = apply(s, 'academic', 'result.save', b); assert.equal(gradeSummary(s.results[0]).final, 8.8);
  throwsStatus(() => apply(s, 'student', 'enrollment.cancel', { id: enrollmentId }), 409);
  s = apply(s, 'academic', 'section.lock', { id: 'sec', locked: true });
  throwsStatus(() => apply(s, 'academic', 'section.save', { ...s.sections[0], status: 'open' }), 409);
  throwsStatus(() => apply(s, 'academic', 'result.save', b), 409);
  s = apply(s, 'academic', 'section.lock', { id: 'sec', locked: false });
  s = apply(s, 'academic', 'result.save', { ...b, exam: 0 }); assert.equal(s.results[0].exam, 0);
});
test('projection never exposes hashes, unrelated student profiles or unpublished grades', () => {
  let s = apply(fixture(), 'student', 'enrollment.add', { sectionId: 'sec' });
  s = apply(s, 'academic', 'result.save', { enrollmentId: s.enrollments[0].id, attendance: 10, midterm: 8, exam: 9, published: false });
  const v = view(s, actor(s, 'student'), 'demo'); assert.deepEqual(v.students.map(s => s.id), ['st1']); assert.equal(v.results.length, 0); assert.equal(v.sectionCounts.sec, 1); assert.equal(JSON.stringify(v).includes('passwordHash'), false); assert.equal(v.audits.length, 0);
  const teacher = view(s, actor(s, 'lecturer'), 'demo'); assert.deepEqual(teacher.sections.map(section => section.id), ['sec']); assert.deepEqual(teacher.students.map(student => student.id), ['st1']); assert.equal(teacher.students[0].email, ''); assert.equal(teacher.students[0].phone, ''); assert.equal(teacher.results.length, 0, 'lecturer sees only published results'); assert.deepEqual(teacher.users.map(user => user.id), ['lecturer']);
  const otherTeacher = view(s, actor(s, 'other-teacher'), 'demo'); assert.equal(otherTeacher.students.length, 0); assert.equal(otherTeacher.results.length, 0);
  assert.equal(JSON.stringify(teacher).includes('passwordHash'), false); assert.equal(JSON.stringify(teacher).includes('s1@test.vn'), false);
});
test('lecturer data projection is limited to each assigned class and active roster', () => {
  const s = fixture();
  s.sections.push({ ...s.sections[0], id: 'sec2', code: 'INT02-01', subjectId: 'subject2', lecturerId: 'other-teacher' });
  s.meetings.push({ ...s.meetings[0], id: 'm2', sectionId: 'sec2', day: 2, room: 'B101' });
  s.enrollments.push(
    { id: 'e1', sectionId: 'sec', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01' },
    { id: 'e2', sectionId: 'sec2', studentId: 'st2', status: 'registered', registeredAt: '2026-09-01' },
    { id: 'e3-cancelled', sectionId: 'sec', studentId: 'st2', status: 'cancelled', registeredAt: '2026-09-01' },
  );
  s.results.push(
    { id: 'r1', enrollmentId: 'e1', attendance: 9, midterm: 8, exam: 9, published: true, updatedAt: '' },
    { id: 'r2', enrollmentId: 'e2', attendance: 9, midterm: 8, exam: 9, published: true, updatedAt: '' },
  );
  const lecturerA = view(s, actor(s, 'lecturer'), 'demo');
  const lecturerB = view(s, actor(s, 'other-teacher'), 'demo');
  assert.deepEqual(lecturerA.sections.map(row => row.id), ['sec']);
  assert.deepEqual(lecturerA.subjects.map(row => row.id), ['subject']);
  assert.deepEqual(lecturerA.meetings.map(row => row.id), ['m']);
  assert.deepEqual(lecturerA.enrollments.map(row => row.id), ['e1']);
  assert.deepEqual(lecturerA.students.map(row => row.id), ['st1']);
  assert.deepEqual(lecturerA.results.map(row => row.id), ['r1']);
  assert.deepEqual(lecturerB.sections.map(row => row.id), ['sec2']);
  assert.deepEqual(lecturerB.students.map(row => row.id), ['st2']);
  assert.deepEqual(lecturerB.results.map(row => row.id), ['r2']);
  assert.deepEqual(lecturerA.users.map(row => row.id), ['lecturer']);
  assert.deepEqual(lecturerB.users.map(row => row.id), ['other-teacher']);
  assert.ok(lecturerA.catalogs.every(row => row.kind === 'semester'));
  assert.equal(JSON.stringify(lecturerA).includes('INT02-01'), false);
  assert.equal(JSON.stringify(lecturerB).includes('INT01-01'), false);
});
test('GPA weights credits, includes F, selects best retake and ignores unpublished results', () => {
  let s = fixture(); s.sections[0].capacity = 2; s.sections.push({ ...s.sections[0], id: 'sec2', code: 'BAS1151-01', subjectId: 'subject3', semester: 'Học kỳ 2 · Năm học 2023-2024' });
  s.meetings.push({ ...s.meetings[0], id: 'm2', sectionId: 'sec2', day: 2 });
  s = apply(s, 'student', 'enrollment.add', { sectionId: 'sec' }); s = apply(s, 'student', 'enrollment.add', { sectionId: 'sec2' });
  for (const e of s.enrollments) s = apply(s, 'academic', 'result.save', { enrollmentId: e.id, attendance: e.sectionId === 'sec' ? 9 : 0, midterm: e.sectionId === 'sec' ? 9 : 0, exam: e.sectionId === 'sec' ? 9 : 0, published: true });
  assert.deepEqual(studentSummary(s, 'st1'), { gpa: 2.4, earnedCredits: 3, attemptedCredits: 5, subjects: 2 });
  assert.equal(studentSummary(s, 'st1', 'Học kỳ 1 · Năm học 2023-2024').gpa, 4);
  s.sections.push({ ...s.sections[0], id: 'retake', code: 'BAS1201-03', semester: 'Học kỳ 3 · Năm học 2024-2025' }); s.meetings.push({ ...s.meetings[0], id: 'm3', sectionId: 'retake', day: 3 });
  s.enrollments.push({ id: 'retake-enrollment', sectionId: 'retake', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01' }); const e = s.enrollments.find(e => e.sectionId === 'retake')!;
  s = apply(s, 'academic', 'result.save', { enrollmentId: e.id, attendance: 4, midterm: 4, exam: 4, published: true });
  assert.equal(studentSummary(s, 'st1').gpa, 2.4); assert.equal(studentSummary(s, 'st1').earnedCredits, 3);
});
test('user provisioning hashes passwords and protects self/last admin', () => {
  const s = fixture();
  const b = { username: 'giaovu2', name: 'Giáo vụ 2', email: 'gv2@test.vn', role: 'academic', password: 'a-new-password', active: true };
  const next = apply(s, 'admin', 'user.save', b); const user = next.users.find(u => u.username === 'giaovu2')!;
  assert.notEqual(user.passwordHash, b.password); assert.ok(checkPassword(b.password, user.passwordHash)); assert.equal(checkPassword('wrong', user.passwordHash), false);
  throwsStatus(() => apply(s, 'admin', 'user.save', { ...s.users[0], active: false }), 400);
});
test('password hashing uses fresh salt and grade boundary 0 is valid F', () => {
  const a = hashPassword('test-password'); const b = hashPassword('test-password'); assert.notEqual(a, b); assert.ok(checkPassword('test-password', a));
  assert.equal(gradeSummary({ attendance: 0, midterm: 0, exam: 0 }).letter, 'F'); assert.equal(gradeSummary({ attendance: 0, midterm: null, exam: 0 }).final, null);
});
