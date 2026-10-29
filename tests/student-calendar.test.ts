import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStudentAcademicCalendar } from '../src/lib/portal/student-calendar';
import { emptyState } from '../src/lib/portal/store';
import { semesterLabel, sortSemesters } from '../src/lib/portal/semester';
import { importLegacyDemoCurricula, curriculumVersionMatchesStudent } from '../src/lib/portal/curricula';
import type { Student } from '../src/lib/portal/types';

function student(id: string, faculty: string, major: string, academicYear: string, curriculumId: string | null): Student {
  return { id, code: id, name: id, email: `${id}@test.vn`, cohortId: null, faculty, major, academicYear, curriculumId, phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 };
}

test('maps the configured curriculum by its intake and retains real off-plan retake semesters', () => {
  const state = emptyState();
  const vt = student('vt23', 'Khoa Viễn thông 1', 'Kỹ thuật Điện tử Viễn thông', '2023 - 2027', 'ptit-vt-chinh-quy-v1');
  const it = student('it25', 'Khoa Công nghệ thông tin 1', 'Công nghệ thông tin', '2025-2029', 'ptit-cntt-chinh-quy-v1');
  state.students.push(vt, it);
  importLegacyDemoCurricula(state);
  state.sections.push(
    { id: 'vt-first', code: 'VT-1', subjectId: 'sub', semester: 'HK1 2023-2024', lecturerId: null, capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' },
    { id: 'vt-retake', code: 'VT-R', subjectId: 'sub', semester: 'Học kỳ 3 - Năm học 2027 - 2028', lecturerId: null, capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' },
    { id: 'it-first', code: 'IT-1', subjectId: 'sub', semester: 'HK1 2026-2027', lecturerId: null, capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' },
  );
  state.enrollments.push(
    { id: 'e-vt-retake', sectionId: 'vt-retake', studentId: vt.id, status: 'registered', registeredAt: '' },
    { id: 'e-it-first', sectionId: 'it-first', studentId: it.id, status: 'registered', registeredAt: '' },
  );
  const vtCalendar = buildStudentAcademicCalendar(state, vt, 'HK1 2026-2027');
  const itCalendar = buildStudentAcademicCalendar(state, it, 'HK1 2026-2027');
  assert.equal(vtCalendar.plannedSemesters[0].actualSemester, 'Học kỳ 1 · Năm học 2023-2024');
  assert.equal(vtCalendar.plannedSemesters[2].actualSemester, 'Học kỳ 1 · Năm học 2024-2025');
  assert.ok(vtCalendar.actualSemesters.some(row => row.value === 'Học kỳ 3 · Năm học 2027-2028'), 'the real retake term remains available outside the normal plan');
  assert.equal(itCalendar.plannedSemesters[0].actualSemester, 'Học kỳ 1 · Năm học 2025-2026', 'a 2025 intake shifts the 2024 plan by one year');
  assert.equal(vtCalendar.currentSemester, 'Học kỳ 1 · Năm học 2026-2027');
  assert.equal(itCalendar.defaultSemester, 'Học kỳ 1 · Năm học 2026-2027');
  assert.equal(state.sections[1].semester, 'Học kỳ 3 - Năm học 2027 - 2028', 'calendar mapping never rewrites actual history');
});

test('unassigned students do not receive a guessed plan, while their own actual terms remain visible', () => {
  const state = emptyState();
  const unassigned = student('no-program', 'Khoa Công nghệ thông tin 1', 'Công nghệ thông tin', '2024-2028', null);
  state.students.push(unassigned);
  state.sections.push({ id: 'retake', code: 'INT-RETAKE', subjectId: 'sub', semester: 'HK2 2029-2030', lecturerId: null, capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.enrollments.push({ id: 'e', sectionId: 'retake', studentId: unassigned.id, status: 'registered', registeredAt: '' });
  const calendar = buildStudentAcademicCalendar(state, unassigned, 'HK1 2026-2027');
  assert.equal(calendar.programAssigned, false);
  assert.equal(calendar.curriculumId, null);
  assert.deepEqual(calendar.plannedSemesters, []);
  assert.deepEqual(calendar.actualSemesters.map(row => row.value), ['Học kỳ 2 · Năm học 2029-2030']);
  assert.equal(calendar.defaultSemester, 'Học kỳ 2 · Năm học 2029-2030');
});

test('program matching is explicit, major-scoped and intake-shifted only after assignment', () => {
  const cntt = student('cntt', 'Khoa Công nghệ thông tin 1', 'Công nghệ thông tin', '2025-2029', 'ptit-cntt-chinh-quy-v1');
  const attt = student('attt', 'Khoa An toàn thông tin', 'An toàn thông tin', '2024-2028', 'ptit-attt-chinh-quy-v1');
  const state = emptyState(); state.students.push(cntt, attt); importLegacyDemoCurricula(state);
  const versions = state.curriculumVersions;
  assert.equal(versions.find(row => row.id === cntt.curriculumId)?.status, 'active');
  assert.equal(curriculumVersionMatchesStudent(versions.find(row => row.id === 'ptit-attt-chinh-quy-v1')!, cntt), false);
  assert.equal(curriculumVersionMatchesStudent(versions.find(row => row.id === 'ptit-cntt-chinh-quy-v1')!, { ...cntt, major: 'Viễn Thông' }), false);
});

test('semester labels sort by school year and term, including configured summer terms', () => {
  const rows = ['HK2 2024-2025', 'Học kỳ hè · Năm học 2024-2025', 'Học kỳ 1 - Năm học 2024 - 2025', 'HK1 2023-2024'].map(value => ({ value, label: semesterLabel(value) }));
  assert.deepEqual(sortSemesters(rows).map(row => row.label), [
    'Học kỳ 1 · Năm học 2023-2024',
    'Học kỳ 1 · Năm học 2024-2025',
    'Học kỳ 2 · Năm học 2024-2025',
    'Học kỳ hè · Năm học 2024-2025',
  ]);
});
