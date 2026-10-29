import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState } from '../src/lib/portal/store';
import { mutate, PortalError, view } from '../src/lib/portal/domain';
import { ensureDirectories, findCatalog } from '../src/lib/portal/directories';
import { validateCurriculumStructure } from '../src/lib/portal/curriculum-validation';
import type { Actor, CurriculumVersion } from '../src/lib/portal/types';

const academic: Actor = { id: 'academic', username: 'academic', name: 'Giáo vụ', role: 'academic', studentCode: null, lecturerCode: null };
const studentActor: Actor = { id: 'student-account', username: 'student', name: 'SV', role: 'student', studentCode: 'SV01', lecturerCode: null };
function fixture() {
  const state = emptyState();
  state.users.push({ id: 'academic', username: 'academic', name: 'Giáo vụ', email: 'academic@test.vn', role: 'academic', passwordHash: 'x', active: true, studentCode: null, lecturerCode: null, department: '', faculty: '', avatarUrl: '' });
  state.students.push({ id: 'st1', code: 'SV01', name: 'Sinh viên', email: 'sv@test.vn', cohortId: null, major: 'CNTT', faculty: 'Khoa CNTT', academicYear: '2024-2028', degreeSystem: 'Chính quy', curriculumId: null, phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 });
  state.subjects.push({ id: 'sub-1', code: 'INT1001', name: 'Cơ sở dữ liệu', credits: 3, department: 'Khoa CNTT', active: true }, { id: 'sub-2', code: 'INT1002', name: 'Lập trình', credits: 3, department: 'Khoa CNTT', active: true });
  state.catalogs.push({ id: 'degree-regular', kind: 'degreeSystem', code: 'CQ', name: 'Chính quy', aliases: [], parentId: null, active: true, startYear: null, endYear: null });
  ensureDirectories(state);
  return state;
}
function create(state: ReturnType<typeof fixture>, code = 'CNTT24') {
  mutate(state, academic, 'curriculum.create', { code, name: `Chương trình ${code}`, version: '1.0', faculty: 'Khoa CNTT', major: 'CNTT', degreeSystem: 'Chính quy', intakeStartYear: 2024, intakeEndYear: 2024, planStartYear: 2024, totalCreditsRequired: 3, trainingTime: '4 năm' });
  return state.curriculumVersions.at(-1)!;
}
function validBody(version: CurriculumVersion) {
  return { ...version, programCode: 'CNTT24', programName: 'Chương trình CNTT', terms: [{ id: 'term-1', sequence: 1, name: 'Kỳ 1', yearOffset: 0, termNumber: 1 as const }], electiveGroups: [], courses: [{ id: 'course-1', termId: 'term-1', subjectId: 'sub-1', code: 'INT1001', name: 'Cơ sở dữ liệu', credits: 3, required: true, electiveGroupId: null, prerequisiteCourseIds: [] }] };
}

test('academic staff can create, edit and publish a version; assignments resolve from persisted curriculum data', () => {
  const state = fixture();
  const draft = create(state);
  assert.throws(() => mutate(state, academic, 'curriculum.publish', { id: draft.id }), /học kỳ và môn học/);
  const completeDraft = { ...validBody(draft), courses: [{ ...validBody(draft).courses[0], subjectId: 'sub-1' }] };
  mutate(state, academic, 'curriculum.draft.save', completeDraft);
  mutate(state, academic, 'curriculum.publish', { id: draft.id });
  assert.equal(state.curriculumVersions[0].status, 'active');
  const student = state.students[0];
  mutate(state, academic, 'student.save', { ...student, curriculumId: draft.id, degreeSystem: 'Chính quy' });
  assert.equal(state.curriculumAssignments.length, 1);
  const own = view(state, studentActor, 'demo');
  assert.equal(own.studentCurriculum?.id, draft.id);
  assert.equal(own.curriculumVersions, undefined, 'students cannot browse drafts or unrelated program versions');
  assert.equal(view(state, academic, 'demo').curriculumVersions?.length, 1, 'staff can manage saved versions');
});

test('publishing rejects duplicate subjects, bad prerequisites and unavailable elective credits', () => {
  const state = fixture();
  const draft = create(state);
  const common = validBody(draft);
  const duplicate = { ...common, courses: [...common.courses, { ...common.courses[0], id: 'course-2', termId: 'term-1' }] } as CurriculumVersion;
  assert.throws(() => validateCurriculumStructure(duplicate, state, true), /cùng một môn học/);
  const prerequisite = { ...common, terms: [...common.terms, { id: 'term-2', sequence: 2, name: 'Kỳ 2', yearOffset: 0, termNumber: 2 as const }], courses: [common.courses[0], { ...common.courses[0], id: 'course-2', termId: 'term-2', subjectId: 'sub-2', code: 'INT1002', prerequisiteCourseIds: ['course-1'] }] } as CurriculumVersion;
  prerequisite.courses[0].prerequisiteCourseIds = ['course-2'];
  assert.throws(() => validateCurriculumStructure(prerequisite, state, true), /vòng phụ thuộc|phải nằm ở học kỳ trước/);
  const elective = { ...common, totalCreditsRequired: 9, electiveGroups: [{ id: 'group-1', name: 'Tự chọn', minCredits: 6 }], courses: [...common.courses, { id: 'course-2', termId: 'term-1', subjectId: 'sub-2', code: 'INT1002', name: 'Lập trình', credits: 3, required: false, electiveGroupId: 'group-1', prerequisiteCourseIds: [] }] } as CurriculumVersion;
  assert.throws(() => validateCurriculumStructure(elective, state, true), /thấp hơn mức tối thiểu/);
  assert.ok(findCatalog(state, 'major', 'CNTT'));
});

test('overlapping active versions are blocked and changing a student assignment with history requires a reason', () => {
  const state = fixture();
  const first = create(state, 'CNTT24A');
  mutate(state, academic, 'curriculum.draft.save', { ...validBody(first), programCode: 'CNTT24A' });
  mutate(state, academic, 'curriculum.publish', { id: first.id });
  const overlap = create(state, 'CNTT24B');
  mutate(state, academic, 'curriculum.draft.save', { ...validBody(overlap), programCode: 'CNTT24B' });
  assert.throws(() => mutate(state, academic, 'curriculum.publish', { id: overlap.id }), /chồng lấn/);
  mutate(state, academic, 'student.save', { ...state.students[0], curriculumId: first.id, degreeSystem: 'Chính quy' });
  state.sections.push({ id: 'section', code: 'INT1001-01', subjectId: 'sub-1', semester: 'HK1 2024-2025', lecturerId: null, capacity: 20, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.enrollments.push({ id: 'enrollment', sectionId: 'section', studentId: 'st1', status: 'registered', registeredAt: '2024-09-01T00:00:00.000Z' });
  assert.throws(() => mutate(state, academic, 'student.save', { ...state.students[0], curriculumId: '', degreeSystem: 'Chính quy' }), /lý do đổi chương trình/);
  mutate(state, academic, 'student.save', { ...state.students[0], curriculumId: '', degreeSystem: 'Chính quy', curriculumChangeReason: 'Chuyển ngành theo quyết định' });
  assert.equal(state.curriculumAssignments.at(-1)?.reason, 'Chuyển ngành theo quyết định');
  assert.equal(state.enrollments.length, 1, 'assignment changes leave historical registration records untouched');
});

test('lecturers and students cannot mutate curriculum management APIs', () => {
  const state = fixture();
  const lecturer: Actor = { ...academic, id: 'lecturer', username: 'lecturer', role: 'lecturer' };
  assert.throws(() => mutate(state, studentActor, 'curriculum.create', {}), (error: unknown) => error instanceof PortalError && error.status === 403);
  assert.throws(() => mutate(state, lecturer, 'curriculum.create', {}), (error: unknown) => error instanceof PortalError && error.status === 403);
});
