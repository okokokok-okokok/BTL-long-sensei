import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/lib/portal/store';
import { mutate, PortalError } from '../src/lib/portal/domain';
import type { Actor } from '../src/lib/portal/types';

const academic: Actor = { id: 'gv', username: 'gv', name: 'Giáo vụ', role: 'academic', studentCode: null, lecturerCode: null };
const admin: Actor = { ...academic, id: 'admin', username: 'admin', role: 'admin' };
const studentActor: Actor = { ...academic, id: 'sv', username: 'sv', role: 'student', studentCode: 'SV01' };

function fixture() {
  const state = emptyState();
  state.students.push({ id: 'student', code: 'SV01', name: 'Sinh viên', email: 'sv@test.vn', cohortId: 'cohort', major: 'CNTT', faculty: 'CNTT', academicYear: '2024-2028', degreeSystem: '', curriculumId: null, phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 });
  state.cohorts.push({ id: 'cohort', code: 'D24CNTT1', name: 'D24CNTT1', major: 'CNTT', faculty: 'CNTT', startYear: 2024, endYear: 2028, active: true });
  state.subjects.push({ id: 'subject', code: 'INT01', name: 'Môn kiểm thử', credits: 3, department: 'CNTT', active: true });
  state.sections.push({ id: 'section', code: 'INT01-01', subjectId: 'subject', semester: 'HK1 2024-2025', lecturerId: null, capacity: 30, status: 'draft', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting', sectionId: 'section', day: 1, startPeriod: 1, endPeriod: 3, startDate: '2099-01-01', endDate: '2099-12-31', room: 'A101' });
  return state;
}

test('staff can remove unused records in dependency order, with an audit for each action', () => {
  const state = fixture();
  assert.throws(() => mutate(state, academic, 'section.delete', { id: 'section' }), /xóa lịch trước/);
  assert.throws(() => mutate(state, academic, 'cohort.delete', { id: 'cohort' }), /đã có sinh viên/);
  mutate(state, academic, 'meeting.delete', { id: 'meeting' });
  mutate(state, academic, 'section.delete', { id: 'section' });
  mutate(state, academic, 'subject.delete', { id: 'subject' });
  mutate(state, academic, 'student.delete', { id: 'student' });
  mutate(state, academic, 'cohort.delete', { id: 'cohort' });
  assert.equal(state.meetings.length + state.sections.length + state.subjects.length + state.students.length + state.cohorts.length, 0);
  assert.deepEqual(state.audits.map(row => row.action), ['meeting.delete', 'section.delete', 'subject.delete', 'student.delete', 'cohort.delete']);
});

test('history and account links block removal; only Admin can remove an unused account', () => {
  const state = fixture();
  state.enrollments.push({ id: 'enrollment', studentId: 'student', sectionId: 'section', status: 'cancelled', registeredAt: '2024-09-01T00:00:00.000Z' });
  assert.throws(() => mutate(state, academic, 'student.delete', { id: 'student' }), /lịch sử đăng ký/);
  assert.throws(() => mutate(state, academic, 'meeting.delete', { id: 'meeting' }), /lịch sử đăng ký/);
  assert.throws(() => mutate(state, academic, 'section.delete', { id: 'section' }), /xóa lịch trước/);
  assert.throws(() => mutate(state, studentActor, 'meeting.delete', { id: 'meeting' }), (error: unknown) => error instanceof PortalError && error.status === 403);
  state.enrollments = [];
  state.users.push({ id: 'account', username: 'sv', name: 'Sinh viên', email: 'sv@test.vn', role: 'student', studentCode: 'SV01', lecturerCode: null, department: '', faculty: 'CNTT', passwordHash: 'hash', avatarUrl: '', active: true });
  assert.throws(() => mutate(state, academic, 'student.delete', { id: 'student' }), /liên kết tài khoản/);
  assert.throws(() => mutate(state, academic, 'user.delete', { id: 'account' }), (error: unknown) => error instanceof PortalError && error.status === 403);
  mutate(state, admin, 'user.delete', { id: 'account' });
  mutate(state, academic, 'student.delete', { id: 'student' });
  assert.equal(state.students.length, 0);
});

test('only unreferenced curriculum drafts can be deleted', () => {
  const state = fixture();
  state.curriculumPrograms.push({ id: 'program', code: 'P1', name: 'Chương trình', active: true });
  state.curriculumVersions.push({ id: 'draft', programId: 'program', version: '1.0', faculty: 'CNTT', major: 'CNTT', degreeSystem: 'Chính quy', intakeStartYear: 2024, intakeEndYear: 2024, planStartYear: 2024, status: 'draft', totalCreditsRequired: 3, trainingTime: '', terms: [], courses: [], electiveGroups: [], createdAt: '', updatedAt: '', publishedAt: '' });
  assert.throws(() => mutate(state, studentActor, 'curriculum.draft.delete', { id: 'draft' }), (error: unknown) => error instanceof PortalError && error.status === 403);
  state.students[0].curriculumId = 'draft';
  assert.throws(() => mutate(state, academic, 'curriculum.draft.delete', { id: 'draft' }), /tham chiếu/);
  state.students[0].curriculumId = null;
  mutate(state, academic, 'curriculum.draft.delete', { id: 'draft' });
  assert.equal(state.curriculumPrograms.length, 0);
  assert.equal(state.curriculumVersions.length, 0);
});

test('a periodic schedule with past sessions remains part of the academic record', () => {
  const state = fixture();
  state.meetings[0].startDate = '2024-09-01';
  state.meetings[0].endDate = '2024-12-31';
  assert.throws(() => mutate(state, academic, 'meeting.delete', { id: 'meeting' }), /quá khứ/);
  assert.equal(state.meetings.length, 1);
});
