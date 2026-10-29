import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcademicDashboard, todayInVietnam } from '../src/lib/portal/academic-dashboard';
import type { PortalState } from '../src/lib/portal/types';

function fixture(): PortalState {
  return {
    users: [
      { id: 'admin', username: 'admin', name: 'Admin', email: 'admin@test.vn', role: 'admin', passwordHash: 'x', active: true, studentCode: null, lecturerCode: null, department: '', faculty: '', avatarUrl: '' },
      { id: 'lecturer', username: 'lecturer', name: 'Giảng viên A', email: 'lecturer@test.vn', role: 'lecturer', passwordHash: 'x', active: true, studentCode: null, lecturerCode: 'GV01', department: 'Khoa CNTT', faculty: 'Khoa CNTT', avatarUrl: '' },
    ],
    cohorts: [{ id: 'cohort', code: 'D24', name: 'D24', major: 'CNTT', faculty: 'Khoa CNTT', startYear: 2024, endYear: 2028, active: true }],
    students: [
      { id: 'st1', code: 'SV01', name: 'Sinh viên 1', email: 'st1@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'Khoa CNTT', academicYear: '2024 - 2028', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
      { id: 'st2', code: 'SV02', name: 'Sinh viên 2', email: 'st2@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'Khoa CNTT', academicYear: '2024 - 2028', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
      { id: 'st3', code: 'SV03', name: 'Sinh viên ngừng học', email: 'st3@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'Khoa CNTT', academicYear: '2024 - 2028', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: false, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 },
    ],
    subjects: [{ id: 'subject', code: 'INT01', name: 'Cơ sở dữ liệu', credits: 3, department: 'Khoa CNTT', active: true }],
    sections: [
      { id: 'sec-progress', code: 'INT01-01', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 4, status: 'open', gradesLocked: false, registrationStart: '2026-10-20T00:00:00.000Z', registrationEnd: '2026-10-30T23:59:00.000Z' },
      { id: 'sec-no-grade', code: 'INT01-02', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: null, capacity: 3, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' },
      { id: 'sec-ready', code: 'INT01-03', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 2, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' },
      { id: 'sec-locked', code: 'INT01-04', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 2, status: 'closed', gradesLocked: true, registrationStart: '', registrationEnd: '' },
      { id: 'sec-empty', code: 'INT01-05', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 2, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' },
      { id: 'sec-expired', code: 'INT01-06', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 1, status: 'open', gradesLocked: false, registrationStart: '2026-10-01T00:00:00.000Z', registrationEnd: '2026-10-25T00:00:00.000Z' },
      { id: 'sec-full', code: 'INT01-07', subjectId: 'subject', semester: 'HK1 2026-2027', lecturerId: 'lecturer', capacity: 1, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' },
      { id: 'sec-previous', code: 'INT01-08', subjectId: 'subject', semester: 'HK2 2025-2026', lecturerId: 'lecturer', capacity: 2, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' },
    ],
    meetings: [
      { id: 'm-today', sectionId: 'sec-progress', day: 1, startPeriod: 1, endPeriod: 3, startDate: '2026-10-01', endDate: '2026-12-01', room: 'A101' },
      { id: 'm-other-weekday', sectionId: 'sec-no-grade', day: 2, startPeriod: 4, endPeriod: 6, startDate: '2026-10-01', endDate: '2026-12-01', room: 'A102' },
    ],
    enrollments: [
      { id: 'e-zero', sectionId: 'sec-progress', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-partial', sectionId: 'sec-progress', studentId: 'st2', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-cancelled', sectionId: 'sec-progress', studentId: 'st3', status: 'cancelled', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-no-grade', sectionId: 'sec-no-grade', studentId: 'st2', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-ready', sectionId: 'sec-ready', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-locked', sectionId: 'sec-locked', studentId: 'st2', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-expired-cancelled', sectionId: 'sec-expired', studentId: 'st1', status: 'cancelled', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-full', sectionId: 'sec-full', studentId: 'st1', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'e-previous', sectionId: 'sec-previous', studentId: 'st1', status: 'registered', registeredAt: '2026-01-01T00:00:00.000Z' },
    ],
    results: [
      { id: 'r-zero', enrollmentId: 'e-zero', attendance: 0, midterm: 0, exam: 0, published: true, updatedAt: '2026-10-20T00:00:00.000Z' },
      { id: 'r-partial', enrollmentId: 'e-partial', attendance: 0, midterm: null, exam: null, published: false, updatedAt: '2026-10-20T00:00:00.000Z' },
      { id: 'r-ready', enrollmentId: 'e-ready', attendance: 9, midterm: 9, exam: 9, published: true, updatedAt: '2026-10-20T00:00:00.000Z' },
      { id: 'r-locked', enrollmentId: 'e-locked', attendance: 8, midterm: 8, exam: 8, published: true, updatedAt: '2026-10-20T00:00:00.000Z' },
    ],
    audits: [
      { id: 'a1', actorId: 'admin', actorName: 'Admin', action: 'result.save', entityId: 'r-zero', createdAt: '2026-10-20T00:00:00.000Z' },
      { id: 'a2', actorId: 'admin', actorName: 'Admin', action: 'section.save', entityId: 'sec-progress', createdAt: '2026-10-21T00:00:00.000Z' },
    ],
    supportTickets: [],
    catalogs: [], lecturers: [], curriculumPrograms: [], curriculumVersions: [], curriculumAssignments: [],
  };
}

test('uses the configured semester instead of inferring it from semester-name order', () => {
  const data = buildAcademicDashboard(fixture(), { currentSemester: 'HK1 2026-2027', now: new Date('2026-10-26T03:00:00.000Z') });
  assert.equal(data.semester, 'HK1 2026-2027');
  assert.equal(data.stats.sections, 7);
  assert.equal(data.stats.activeEnrollments, 6, 'cancelled and other-semester enrollments are excluded');
  assert.deepEqual(data.semesters, ['HK2 2025-2026', 'HK1 2026-2027']);
});

test('classifies registration state separately from open status, time window and remaining capacity', () => {
  const data = buildAcademicDashboard(fixture(), { semester: 'HK1 2026-2027', now: new Date('2026-10-26T03:00:00.000Z') });
  const byId = new Map(data.registration.map(row => [row.id, row]));
  assert.equal(byId.get('sec-progress')?.canRegister, true);
  assert.equal(byId.get('sec-progress')?.registrationStatus, 'accepting');
  assert.equal(byId.get('sec-expired')?.isOpen, true);
  assert.equal(byId.get('sec-expired')?.canRegister, false);
  assert.equal(byId.get('sec-expired')?.registrationStatus, 'ended');
  assert.equal(byId.get('sec-full')?.registrationStatus, 'full');
  assert.equal(byId.get('sec-no-grade')?.registrationStatus, 'unavailable');
  assert.equal(byId.get('sec-no-grade')?.canRegister, false, 'missing lecturer prevents registration');
  assert.equal(byId.get('sec-locked')?.registrationStatus, 'locked');
  assert.equal(byId.get('sec-full')?.count, 1, 'cancelled registrations do not occupy capacity');
});

test('grade workflow buckets are exclusive, ignore empty sections, and accept numeric zero as entered', () => {
  const data = buildAcademicDashboard(fixture(), { semester: 'HK1 2026-2027', now: new Date('2026-10-26T03:00:00.000Z') });
  assert.equal(data.tasks.noGrades.some(row => row.id === 'sec-empty'), false);
  assert.deepEqual(data.tasks.noGrades.map(row => row.id).sort(), ['sec-full', 'sec-no-grade']);
  assert.deepEqual(data.tasks.gradeInProgress.map(row => row.id), ['sec-progress']);
  assert.deepEqual(data.tasks.readyToLock.map(row => row.id), ['sec-ready']);
  assert.deepEqual(data.gradeProgress, {
    noStudents: 2,
    notStarted: 2,
    inProgress: 1,
    publishedUnlocked: 1,
    locked: 1,
    sections: data.gradeProgress.sections,
  });
  assert.equal(data.gradeProgress.sections.find(row => row.id === 'sec-progress')?.completedCount, 1);
});

test('reported passing rate only uses complete published scores and zero is a valid failed grade', () => {
  const data = buildAcademicDashboard(fixture(), { semester: 'HK1 2026-2027', now: new Date('2026-10-26T03:00:00.000Z') });
  assert.equal(data.report.completedEnrollments, 3);
  assert.equal(data.report.passed, 2);
  assert.equal(data.report.failed, 1);
  assert.equal(data.report.passRate, 66.7);
});

test('daily schedule honors the selected weekday and effective date range', () => {
  const data = buildAcademicDashboard(fixture(), { semester: 'HK1 2026-2027', date: '2026-10-26', now: new Date('2026-10-26T03:00:00.000Z') });
  assert.equal(data.todaySchedule.length, 1);
  assert.equal(data.todaySchedule[0].id, 'm-today');
});

test('empty report has no misleading pass rate and recent activity resolves real entities', () => {
  const state = fixture();
  state.results = state.results.map(result => ({ ...result, exam: null, published: false }));
  const data = buildAcademicDashboard(state, { semester: 'HK1 2026-2027', now: new Date('2026-10-26T03:00:00.000Z') });
  assert.equal(data.report.completedEnrollments, 0);
  assert.equal(data.report.passRate, null);
  assert.deepEqual(data.audits.map(row => row.entityLabel), ['Lớp tín chỉ INT01-01', 'SV01 · INT01-01']);
  assert.deepEqual(data.audits.map(row => row.actionLabel), ['Cập nhật lớp tín chỉ / phân công', 'Cập nhật điểm']);
});

test('Vietnamese day boundary is used for the default date', () => {
  assert.equal(todayInVietnam(new Date('2026-06-01T17:30:00.000Z')), '2026-06-02');
});
