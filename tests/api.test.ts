import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { NextRequest } from 'next/server';
import { POST as login } from '../src/app/api/auth/login/route';
import { GET, POST } from '../src/app/api/portal/route';
import { GET as getGrades } from '../src/app/api/grades/route';
import { GET as getStudent } from '../src/app/api/student/route';
import { GET as getStudents } from '../src/app/api/students/route';
import { GET as getStudentClasses } from '../src/app/api/student/classes/route';
import { POST as coursePost } from '../src/app/api/courses/route';
import { GET as courseGet } from '../src/app/api/courses/route';
import { POST as updateGrade } from '../src/app/api/grades/update/route';
import { GET as authMe } from '../src/app/api/auth/me/route';
import { GET as exportSchedule } from '../src/app/api/portal/schedule-export/route';
import { emptyState, withState } from '../src/lib/portal/store';
import { hashPassword } from '../src/lib/portal/password';

const origin = 'http://localhost:3000';
function request(url: string, token?: string, body?: object, extra: Record<string, string> = {}) {
  return new NextRequest(origin + url, { method: body ? 'POST' : 'GET', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json', origin } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('API workflow: four roles, concurrent capacity, authorization, transactional grades and persistence', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ptit-api-'));
  const oldMode = process.env.PORTAL_STORAGE, oldFile = process.env.PORTAL_DEMO_FILE;
  process.env.PORTAL_STORAGE = 'demo'; process.env.PORTAL_DEMO_FILE = path.join(directory, 'state.json');
  const state = emptyState();
  const password = 'test-api-password';
  for (const [id, role, code] of [['admin', 'admin', null], ['academic', 'academic', null], ['lecturer', 'lecturer', null], ['teacher2', 'lecturer', null], ['sv1', 'student', 'SV01'], ['sv2', 'student', 'SV02'], ['sv3', 'student', 'SV03']] as const) state.users.push({ id, username: id, name: id, email: `${id}@test.vn`, role, studentCode: code, lecturerCode: role === 'lecturer' ? id : null, passwordHash: hashPassword(password), active: true, department: '', faculty: '', avatarUrl: '/default-avatar.png' });
  state.students.push(
    { id: 'st1', code: 'SV01', name: 'SV01', email: 'st1@test.vn', cohortId: null, major: 'Kỹ thuật Điện tử Viễn thông', faculty: 'Khoa Viễn thông 1', academicYear: '2023 - 2027', curriculumId: 'ptit-vt-chinh-quy-v1', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
    { id: 'st2', code: 'SV02', name: 'SV02', email: 'st2@test.vn', cohortId: null, major: 'Kỹ thuật Điện tử Viễn thông', faculty: 'Khoa Viễn thông 1', academicYear: '2023 - 2027', curriculumId: 'ptit-vt-chinh-quy-v1', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
    { id: 'st3', code: 'SV03', name: 'SV03', email: 'st3@test.vn', cohortId: null, major: 'An toàn thông tin', faculty: 'Khoa An toàn thông tin', academicYear: '2024-2028', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
  );
  state.subjects.push({ id: 'subject', code: 'BAS1106', name: 'Môn kiểm thử', credits: 2, department: 'CNTT', active: true });
  state.sections.push({ id: 'section', code: 'BAS1106-01', subjectId: 'subject', semester: 'Học kỳ 1 · Năm học 2023-2024', lecturerId: 'lecturer', capacity: 1, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting', sectionId: 'section', day: 1, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'A101' });
  state.sections.push({ id: 'section-other', code: 'BAS1106-02', subjectId: 'subject', semester: 'Học kỳ 1 · Năm học 2023-2024', lecturerId: 'teacher2', capacity: 10, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting-other', sectionId: 'section-other', day: 2, startPeriod: 1, endPeriod: 3, startDate: '2026-09-01', endDate: '2026-12-31', room: 'A102' });
  state.enrollments.push({ id: 'enrollment-other', sectionId: 'section-other', studentId: 'st3', status: 'registered', registeredAt: '2026-09-01' });
  await fs.writeFile(process.env.PORTAL_DEMO_FILE, JSON.stringify(state));
  try {
    assert.equal((await GET(request('/api/portal'))).status, 401);
    const tokens: Record<string, string> = {};
    for (const username of ['admin', 'academic', 'lecturer', 'teacher2', 'sv1', 'sv2', 'sv3']) {
      const res = await login(request('/api/auth/login', undefined, { username, password })); const json = await res.json(); assert.equal(res.status, 200, JSON.stringify(json)); tokens[username] = json.data.token;
    }
    assert.equal((await exportSchedule(request('/api/portal/schedule-export?scope=date-range&startDate=2026-09-01&endDate=2026-09-07'))).status, 401);
    assert.equal((await exportSchedule(request('/api/portal/schedule-export?scope=date-range&startDate=2026-09-01&endDate=2026-09-07', tokens.sv1))).status, 403);
    assert.equal((await exportSchedule(request('/api/portal/schedule-export?scope=date-range&startDate=2026-09-01&endDate=2026-09-07', tokens.lecturer))).status, 403);
    const substitutionUrl = '/api/portal/schedule-export?scope=date-range&startDate=2026-09-01&endDate=2026-09-07&targetMeetingId=meeting&targetDate=2026-09-07';
    assert.equal((await exportSchedule(request(substitutionUrl, tokens.sv1))).status, 403);
    for (const staffRole of ['admin', 'academic']) {
      const exported = await exportSchedule(request('/api/portal/schedule-export?scope=date-range&startDate=2026-09-01&endDate=2026-09-07', tokens[staffRole]));
      assert.equal(exported.status, 200);
      assert.match(exported.headers.get('content-type') || '', /spreadsheetml\.sheet/);
      assert.match(exported.headers.get('content-disposition') || '', /\.xlsx/);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await exported.arrayBuffer());
      assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ['Lịch giảng dạy', 'Giảng viên']);
      assert.equal(workbook.getWorksheet('Lịch giảng dạy')?.rowCount, 9, 'all meeting occurrences in range are exported, not the visible page');
      assert.equal(workbook.getWorksheet('Giảng viên')?.rowCount, 8, 'both active lecturers appear in the directory sheet');
      const comparisonExport = await exportSchedule(request(substitutionUrl, tokens[staffRole]));
      assert.equal(comparisonExport.status, 200);
      const comparisonWorkbook = new ExcelJS.Workbook();
      await comparisonWorkbook.xlsx.load(await comparisonExport.arrayBuffer());
      assert.ok(comparisonWorkbook.getWorksheet('Đối chiếu dạy thay'));
    }
    const call = (who: string, action: string, body: object) => POST(request('/api/portal', tokens[who], { ...body, action }));
    for (const who of ['sv1', 'lecturer']) assert.equal((await call(who, 'curriculum.create', {})).status, 403, `${who} cannot create or edit curriculum versions`);
    const programDraft = await call('academic', 'curriculum.create', { code: 'API-CURRICULUM', name: 'Chương trình API', version: '1.0', faculty: 'Khoa Viễn thông 1', major: 'Kỹ thuật Điện tử Viễn thông', degreeSystem: 'Chính quy', intakeStartYear: 2026, intakeEndYear: 2027, planStartYear: 2026, totalCreditsRequired: 3, trainingTime: '4 năm' });
    assert.equal(programDraft.status, 200, 'academic staff can create a saved draft through the API');
    assert.equal((await call('sv1', 'curriculum.publish', { id: (await programDraft.json()).data.entityId })).status, 403, 'students cannot publish a draft by changing the request');
    assert.equal((await call('sv1', 'student.save', {})).status, 403);
    assert.equal((await call('academic', 'user.save', {})).status, 403);
    assert.equal((await POST(request('/api/portal', tokens.sv1, { action: 'user.save' }, { cookie: `ptit_auth_session=${tokens.admin}` }))).status, 403, 'Bearer identity wins over other-tab admin cookie');
    assert.equal((await POST(request('/api/portal', tokens.admin, { action: 'cohort.save' }, { origin: 'https://untrusted.test' }))).status, 403);
    const created = await call('academic', 'cohort.save', { code: 'D23VT', name: 'Viễn thông 2023', major: 'Kỹ thuật Điện tử Viễn thông', faculty: 'Khoa Viễn thông 1', startYear: 2023, endYear: 2027 }); assert.equal(created.status, 200);
    assert.equal((await getStudent(request('/api/student?code=SV02', tokens.sv1))).status, 403);
    assert.equal((await getGrades(request('/api/grades?studentCode=SV02', tokens.sv1))).status, 403);
    assert.equal((await coursePost(request('/api/courses', tokens.sv1, { courseCode: 'BAS1106-01', studentCode: 'SV02' }))).status, 403);
    const concurrent = await Promise.all(['sv1', 'sv2'].map(who => call(who, 'enrollment.add', { sectionId: 'section' })));
    assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
    let stored = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8'));
    assert.equal(stored.enrollments.filter((row: { sectionId: string }) => row.sectionId === 'section').length, 1); const sectionEnrollment = stored.enrollments.find((row: { sectionId: string }) => row.sectionId === 'section'); const enrollmentId = sectionEnrollment.id;
    const grade = { enrollmentId, attendance: 10, midterm: 8, exam: 9, published: true };
    assert.equal((await call('teacher2', 'result.save', grade)).status, 403);
    assert.equal((await call('lecturer', 'result.save', grade)).status, 403, 'even the assigned lecturer cannot enter grades');
    assert.equal((await call('lecturer', 'result.batch', { rows: [grade] })).status, 403);
    const studentCode = sectionEnrollment.studentId === 'st1' ? 'SV01' : 'SV02';
    const legacyGradeResponse = await updateGrade(request('/api/grades/update', tokens.lecturer, { courseCode: 'BAS1106-01', studentCode, attendanceGrade: 10, midtermGrade: 8, examGrade: 9, published: true }));
    assert.equal(legacyGradeResponse.status, 403, 'legacy grade API also blocks lecturers');
    const lecturerView = await (await GET(request('/api/portal', tokens.lecturer))).json();
    const teacher2View = await (await GET(request('/api/portal', tokens.teacher2))).json();
    assert.deepEqual(lecturerView.data.sections.map((section: { id: string }) => section.id), ['section']);
    assert.deepEqual(lecturerView.data.students.map((student: { id: string }) => student.id), [sectionEnrollment.studentId]);
    assert.equal(lecturerView.data.students[0].email, '', 'unneeded student contact data is not returned to lecturers');
    assert.deepEqual(teacher2View.data.sections.map((section: { id: string }) => section.id), ['section-other']);
    assert.deepEqual(teacher2View.data.students.map((student: { id: string }) => student.id), ['st3']);
    assert.equal((await getStudent(request('/api/student?code=SV01', tokens.lecturer))).status, 403, 'lecturers cannot read an individual academic profile through the legacy API');
    const scopedStudents = await (await getStudents(request('/api/students', tokens.lecturer))).json();
    assert.deepEqual(scopedStudents.data.map((student: { studentCode: string }) => student.studentCode), ['SV01', 'SV02'].filter(code => code === studentCode));
    assert.equal('cumulativeGpa' in scopedStudents.data[0], false, 'legacy lecturer student lists contain only teaching identity fields');
    assert.equal((await GET(request('/api/portal?roster=section-other', tokens.lecturer))).status, 403, 'a lecturer cannot inspect another lecturer roster by changing section ID');
    const ownLegacyCourses = await (await courseGet(request('/api/courses', tokens.lecturer))).json();
    assert.deepEqual(ownLegacyCourses.data.map((section: { id: string }) => section.id), ['section']);
    stored = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8')); assert.equal(stored.results.length, 0, 'entire batch rolls back');
    assert.equal((await call('academic', 'result.batch', { rows: [grade, { ...grade, exam: 15 }] })).status, 400);
    stored = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8')); assert.equal(stored.results.length, 0, 'invalid office batch rolls back atomically');
    assert.equal((await call('academic', 'result.save', grade)).status, 200, 'Academic Affairs retains grade entry');
    const lecturerGrades = await (await getGrades(request('/api/grades', tokens.lecturer))).json();
    const otherLecturerGrades = await (await getGrades(request('/api/grades', tokens.teacher2))).json();
    assert.equal(lecturerGrades.data.length, 1, 'lecturer can read published grades in their own class');
    assert.equal(otherLecturerGrades.data.length, 0, 'another lecturer cannot read those grades');
    assert.equal((await call('academic', 'section.lock', { id: 'section', locked: true })).status, 200);
    assert.equal((await call('lecturer', 'result.save', grade)).status, 403);
    const winner = sectionEnrollment.studentId === 'st1' ? 'sv1' : 'sv2';
    const outsider = winner === 'sv1' ? 'sv2' : 'sv1';
    const ownClassesResponse = await getStudentClasses(request('/api/student/classes?view=sections&semester=Học kỳ 1 · Năm học 2023-2024', tokens[winner]));
    const ownClasses = await ownClassesResponse.json();
    assert.equal(ownClassesResponse.status, 200, JSON.stringify(ownClasses)); assert.equal(ownClasses.data.sections.length, 1, JSON.stringify(ownClasses)); assert.equal(ownClasses.data.sections[0].id, 'section');
    assert.equal((await getStudentClasses(request('/api/student/classes?view=sections&sectionId=section', tokens[outsider]))).status, 403, 'a student cannot inspect another student’s class roster');
    const own = await (await GET(request('/api/portal', tokens[winner]))).json(); assert.equal(own.data.results.length, 1); assert.equal(own.data.students.length, 1); assert.equal(JSON.stringify(own).includes('passwordHash'), false);
    assert.equal(own.data.curriculumVersions, undefined, 'student API responses do not contain unrelated or draft versions');
    assert.equal(own.data.studentCurriculum?.id, 'ptit-vt-chinh-quy-v1', 'student response contains only the assigned published curriculum');
    const ownProfile = own.data.students[0];
    assert.equal(own.data.studentAcademicCalendar.programAssigned, true);
    assert.equal(own.data.studentAcademicCalendar.plannedSemesters[0].actualSemester, 'Học kỳ 1 · Năm học 2023-2024');
    const noProgramView = await (await GET(request('/api/portal', tokens.sv3))).json();
    assert.equal(noProgramView.data.studentAcademicCalendar.programAssigned, false); assert.equal(noProgramView.data.studentAcademicCalendar.plannedSemesters.length, 0, 'API does not guess from the matching major');
    await withState(true, s => { s.users.find(u => u.id === winner)!.active = false; });
    assert.equal((await authMe(request('/api/auth/me', tokens[winner]))).status, 401, 'account disable takes effect for an existing token');
    const disk = JSON.parse(await fs.readFile(process.env.PORTAL_DEMO_FILE, 'utf8')); assert.equal(disk.results[0].exam, 9); assert.equal(disk.sections[0].gradesLocked, true);
  } finally {
    if (oldMode === undefined) delete process.env.PORTAL_STORAGE; else process.env.PORTAL_STORAGE = oldMode;
    if (oldFile === undefined) delete process.env.PORTAL_DEMO_FILE; else process.env.PORTAL_DEMO_FILE = oldFile;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
