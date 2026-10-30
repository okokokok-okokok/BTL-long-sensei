import { randomUUID } from 'node:crypto';
import type { UserRole } from '@/types/auth';
import type { Actor, PortalState, PortalView, Meeting, Section, Result, PortalUser, CurriculumVersion, CurriculumTerm, CurriculumElectiveGroup, CurriculumCourseEntry, CurriculumProgram } from './types';
import { hashPassword } from './password';
import { gradeSummary } from './analytics';
import { cancellationIssue, registrationIssue } from './registration';
import { assignedCurriculum, curriculumCourseCodesForStudent, curriculumVersionMatchesStudent, copyCurriculumVersion } from './curricula';
import { validateCurriculumStructure } from './curriculum-validation';
import { buildStudentAcademicCalendar, plannedCourseCodesForStudentInSemester } from './student-calendar';
import { academicSelection, catalogEqual, catalogReferenced, cohortMatches, ensureDirectories, findCatalog, intakeYears, requireCatalog } from './directories';
import { PortalError } from './errors';
import { accountProfile, saveDirectory } from './directory-mutations';
import { configuredCurrentSemester, todayInVietnam } from './academic-dashboard';
import { compareSemesters } from './semester';
import { officialAppealDeadline } from './grade-workflow';
export { PortalError } from './errors';
export { gradeSummary, studentSummary } from './analytics';

export const isStaff = (actor: Actor) => actor.role === 'admin' || actor.role === 'academic';
export function requireRole(actor: Actor, roles: UserRole[]) {
  if (!roles.includes(actor.role)) throw new PortalError('Bạn không có quyền thực hiện thao tác này.', 403);
}
function text(value: unknown, label: string, required = true, max = 250) {
  if (value === undefined || value === null) { if (!required) return ''; throw new PortalError(`Thiếu ${label}.`); }
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new PortalError(`${label} không hợp lệ (tối đa ${max} ký tự).`);
  return value.trim();
}
function integer(value: unknown, label: string, min: number, max: number) {
  if (value === '' || value === null || typeof value === 'boolean') throw new PortalError(`${label} không hợp lệ.`);
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new PortalError(`${label} phải từ ${min} đến ${max}.`);
  return n;
}
function email(value: unknown) {
  const s = text(value, 'email', true, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new PortalError('Email không hợp lệ.');
  return s;
}
function date(value: unknown, required = true) {
  const s = text(value, 'ngày', required, 10);
  if (!s && !required) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s) throw new PortalError('Ngày không hợp lệ.');
  return s;
}
function timestamp(value: unknown) {
  const s = text(value, 'thời hạn đăng ký', false, 40);
  if (!s) return '';
  if (!Number.isFinite(Date.parse(s))) throw new PortalError('Thời hạn đăng ký không hợp lệ.');
  return new Date(s).toISOString();
}
function get<T extends { id: string }>(rows: T[], id: unknown, label: string): T {
  const row = rows.find(r => r.id === id);
  if (!row) throw new PortalError(`Không tìm thấy ${label}.`, 404);
  return row;
}
function code(value: unknown) {
  const s = text(value, 'mã', true, 60).toUpperCase();
  if (!/^[A-Z0-9._-]+$/.test(s)) throw new PortalError('Mã chỉ gồm chữ, số, dấu chấm, gạch nối và gạch dưới.');
  return s;
}
function unique<T extends { id: string }>(rows: T[], id: string, matches: (r: T) => boolean, label: string) {
  if (rows.some(r => r.id !== id && matches(r))) throw new PortalError(`${label} đã tồn tại.`, 409);
}
function put<T extends { id: string }>(rows: T[], row: T) {
  const index = rows.findIndex(r => r.id === row.id);
  if (index < 0) rows.push(row); else rows[index] = row;
}
function flag(value: unknown, fallback: boolean) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new PortalError('Trạng thái không hợp lệ.');
  return value;
}
function curriculumScope(state: PortalState, body: Record<string, unknown>, old?: CurriculumVersion) {
  const faculty = requireCatalog(state, 'faculty', body.faculty, old?.faculty);
  const major = requireCatalog(state, 'major', body.major, old?.major, faculty.row.id);
  const degree = requireCatalog(state, 'degreeSystem', body.degreeSystem, old?.degreeSystem);
  const intakeStartYear = integer(body.intakeStartYear, 'Khóa tuyển sinh bắt đầu', 1990, 2110);
  const intakeEndYear = integer(body.intakeEndYear, 'Khóa tuyển sinh kết thúc', intakeStartYear, 2110);
  const availableYears = new Set(state.catalogs.filter(row => row.kind === 'intake' && row.active && row.startYear !== null).map(row => row.startYear!));
  if (!availableYears.has(intakeStartYear) || !availableYears.has(intakeEndYear)) throw new PortalError('Phạm vi khóa tuyển sinh phải lấy từ danh mục khóa đang hoạt động.');
  return { faculty: faculty.value, major: major.value, degreeSystem: degree.value, intakeStartYear, intakeEndYear };
}
function normalizeCurriculumVersion(state: PortalState, body: Record<string, unknown>, old: CurriculumVersion): CurriculumVersion {
  const scope = curriculumScope(state, body, old);
  if (!Array.isArray(body.terms) || !Array.isArray(body.electiveGroups) || !Array.isArray(body.courses)) throw new PortalError('Cấu trúc học kỳ, nhóm tự chọn và môn học không hợp lệ.');
  const terms: CurriculumTerm[] = body.terms.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PortalError('Học kỳ dự kiến không hợp lệ.');
    const row = value as Record<string, unknown>;
    return { id: text(row.id, 'mã học kỳ', true, 100), sequence: integer(row.sequence, 'Thứ tự học kỳ', 1, 20), name: text(row.name, 'tên học kỳ', true, 100), yearOffset: row.yearOffset === '' || row.yearOffset === null || row.yearOffset === undefined ? null : integer(row.yearOffset, `Năm lệch học kỳ ${index + 1}`, 0, 20), termNumber: row.termNumber === '' || row.termNumber === null || row.termNumber === undefined ? null : integer(row.termNumber, `Học kỳ thực tế ${index + 1}`, 1, 3) as 1 | 2 | 3 };
  });
  const electiveGroups: CurriculumElectiveGroup[] = body.electiveGroups.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PortalError('Nhóm tự chọn không hợp lệ.');
    const row = value as Record<string, unknown>;
    return { id: text(row.id, 'mã nhóm tự chọn', true, 100), name: text(row.name, 'tên nhóm tự chọn', true, 150), minCredits: integer(row.minCredits, 'Tín chỉ tối thiểu của nhóm', 1, 500) };
  });
  const courses: CurriculumCourseEntry[] = body.courses.map(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PortalError('Môn trong chương trình không hợp lệ.');
    const row = value as Record<string, unknown>;
    const prior = old.courses.find(course => course.id === row.id);
    const subjectId = String(row.subjectId || prior?.subjectId || '').trim();
    const subject = state.subjects.find(item => item.id === subjectId) || state.subjects.find(item => item.code.toUpperCase() === String(row.code || prior?.code || '').toUpperCase());
    if (!subject) throw new PortalError(`Không tìm thấy môn học ${String(row.code || '')} trong danh mục.`);
    if (!subject.active && prior?.subjectId !== subject.id) throw new PortalError(`Môn ${subject.code} đã ngừng hoạt động.`);
    const prerequisiteCourseIds = Array.isArray(row.prerequisiteCourseIds) ? row.prerequisiteCourseIds.map(item => text(item, 'mã môn tiên quyết', true, 100)) : [];
    const electiveGroupId = row.electiveGroupId ? text(row.electiveGroupId, 'nhóm tự chọn', true, 100) : null;
    const required = row.required === undefined ? prior?.required ?? true : flag(row.required, true);
    return { id: text(row.id, 'mã môn trong chương trình', true, 100), termId: text(row.termId, 'học kỳ dự kiến của môn', true, 100), subjectId: subject.id, code: prior?.subjectId === subject.id ? prior.code : subject.code, name: prior?.subjectId === subject.id ? prior.name : subject.name, credits: prior?.subjectId === subject.id ? prior.credits : subject.credits, required, electiveGroupId, prerequisiteCourseIds };
  });
  return { ...old, ...scope, planStartYear: integer(body.planStartYear, 'Năm bắt đầu kế hoạch', 1990, 2110), totalCreditsRequired: integer(body.totalCreditsRequired, 'Tổng tín chỉ yêu cầu', 1, 500), trainingTime: text(body.trainingTime, 'Thời gian đào tạo', false, 100), terms, electiveGroups, courses, updatedAt: new Date().toISOString() };
}
function studentHasLearningHistory(state: PortalState, studentId: string) {
  const enrollments = state.enrollments.filter(row => row.studentId === studentId);
  const ids = new Set(enrollments.map(row => row.id));
  return enrollments.length > 0 || state.results.some(row => ids.has(row.enrollmentId));
}
export function meetingsOverlap(a: Meeting, b: Meeting) {
  if (a.day !== b.day || a.startPeriod > b.endPeriod || b.startPeriod > a.endPeriod) return false;
  const first = a.startDate > b.startDate ? a.startDate : b.startDate;
  const last = a.endDate < b.endDate ? a.endDate : b.endDate;
  if (first > last) return false;
  const start = new Date(`${first}T00:00:00Z`);
  const offset = (a.day % 7 - start.getUTCDay() + 7) % 7;
  start.setUTCDate(start.getUTCDate() + offset);
  return start.toISOString().slice(0, 10) <= last;
}
function validateSchedule(state: PortalState) {
  for (let i = 0; i < state.meetings.length; i++) {
    const a = state.meetings[i];
    const sa = get(state.sections, a.sectionId, 'lớp tín chỉ');
    for (let j = i + 1; j < state.meetings.length; j++) {
      const b = state.meetings[j];
      if (!meetingsOverlap(a, b)) continue;
      const sb = get(state.sections, b.sectionId, 'lớp tín chỉ');
      // A section cannot have two simultaneous sessions, even in different rooms.
      if (sa.id === sb.id || catalogEqual('room', a.room, b.room, state.catalogs)) throw new PortalError(`Trùng lịch/phòng giữa ${sa.code} và ${sb.code}.`, 409);
      if (sa.lecturerId && sa.lecturerId === sb.lecturerId) throw new PortalError(`Giảng viên bị trùng lịch giữa ${sa.code} và ${sb.code}.`, 409);
      const registered = state.enrollments.filter(e => e.status === 'registered');
      const ids = new Set(registered.filter(e => e.sectionId === sa.id).map(e => e.studentId));
      if (registered.some(e => e.sectionId === sb.id && ids.has(e.studentId))) throw new PortalError(`Sinh viên bị trùng lịch giữa ${sa.code} và ${sb.code}.`, 409);
    }
  }
}
function ownStudent(state: PortalState, actor: Actor, requested?: unknown) {
  if (actor.role === 'student') {
    const s = state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase());
    if (!s) throw new PortalError('Tài khoản chưa có hồ sơ sinh viên.', 409);
    if (requested && requested !== s.id) throw new PortalError('Chỉ được thao tác trên hồ sơ của mình.', 403);
    return s;
  }
  requireRole(actor, ['admin', 'academic']);
  return get(state.students, requested, 'sinh viên');
}
function editableSection(state: PortalState, actor: Actor, sectionId: unknown) {
  requireRole(actor, ['admin', 'academic']);
  const section = get(state.sections, sectionId, 'lớp tín chỉ');
  if (section.gradesLocked) throw new PortalError('Bảng điểm đã khóa. Giáo vụ phải mở khóa trước khi sửa.', 409);
  return section;
}
function gradeScore(value: unknown) {
  if (value === null || value === '' || value === undefined) return null;
  if (typeof value !== 'number' && typeof value !== 'string') throw new PortalError('Điểm không hợp lệ.');
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 10) throw new PortalError('Điểm phải trong khoảng 0 đến 10.');
  return Math.round(score * 100) / 100;
}
// Called within one database/file transaction. No partially applied mutation is persisted.
export function mutate(state: PortalState, actor: Actor, action: string, b: Record<string, unknown>) {
  ensureDirectories(state);
  let entityId = '';
  switch (action) {
    case 'user.delete': {
      requireRole(actor, ['admin']);
      const row = get(state.users, b.id, 'tài khoản');
      if (row.id === actor.id) throw new PortalError('Không thể xóa tài khoản đang đăng nhập.', 409);
      if (row.role === 'admin' && row.active && state.users.filter(item => item.role === 'admin' && item.active).length <= 1) throw new PortalError('Phải còn ít nhất một Admin hoạt động.', 409);
      if (state.sections.some(item => item.lecturerId === row.id) || state.supportTickets.some(item => item.userId === row.id)) throw new PortalError('Tài khoản đã có lớp giảng dạy hoặc yêu cầu hỗ trợ. Hãy khóa tài khoản để giữ lịch sử.', 409);
      if (row.studentCode) {
        const student = state.students.find(item => item.code.toLowerCase() === row.studentCode?.toLowerCase());
        if (student && state.enrollments.some(item => item.studentId === student.id)) throw new PortalError('Tài khoản sinh viên đã có lịch sử đăng ký. Hãy khóa tài khoản.', 409);
      }
      state.users = state.users.filter(item => item.id !== row.id); entityId = `Tài khoản ${row.username}`; break;
    }
    case 'student.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.students, b.id, 'sinh viên');
      if (state.enrollments.some(item => item.studentId === row.id)) throw new PortalError('Sinh viên đã có lịch sử đăng ký hoặc điểm. Hãy chuyển hồ sơ sang ngừng hoạt động.', 409);
      if (state.users.some(item => item.studentCode?.toLowerCase() === row.code.toLowerCase())) throw new PortalError('Sinh viên đã liên kết tài khoản. Admin cần xử lý tài khoản trước khi xóa hồ sơ.', 409);
      if (state.curriculumAssignments.some(item => item.studentId === row.id)) throw new PortalError('Sinh viên đã có lịch sử gán chương trình. Hãy chuyển hồ sơ sang ngừng hoạt động.', 409);
      state.students = state.students.filter(item => item.id !== row.id); entityId = `Sinh viên ${row.code} · ${row.name}`; break;
    }
    case 'meeting.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.meetings, b.id, 'lịch học định kỳ');
      const section = get(state.sections, row.sectionId, 'lớp tín chỉ');
      const today = todayInVietnam();
      const previousDay = new Date(`${today}T00:00:00Z`); previousDay.setUTCDate(previousDay.getUTCDate() - 1);
      if (row.startDate < today && meetingsOverlap(row, { ...row, endDate: previousDay.toISOString().slice(0, 10) })) throw new PortalError('Lịch học đã có buổi trong quá khứ. Hãy điều chỉnh khoảng ngày để giữ lịch sử.', 409);
      if (section.status === 'open' && state.meetings.filter(item => item.sectionId === section.id).length === 1) throw new PortalError('Đây là lịch cuối cùng của lớp đang mở đăng ký. Hãy đóng lớp hoặc lập lịch khác trước.', 409);
      if (state.enrollments.some(item => item.sectionId === section.id)) throw new PortalError('Lớp đã có lịch sử đăng ký. Hãy điều chỉnh lịch để giữ lịch sử học tập.', 409);
      state.meetings = state.meetings.filter(item => item.id !== row.id); entityId = `Lịch ${section.code} · thứ ${row.day} tiết ${row.startPeriod}–${row.endPeriod} · ${row.startDate}–${row.endDate}`; break;
    }
    case 'section.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.sections, b.id, 'lớp tín chỉ');
      if (row.status !== 'draft') throw new PortalError('Chỉ xóa lớp tín chỉ ở trạng thái Nháp. Hãy đóng lớp đã sử dụng.', 409);
      if (state.meetings.some(item => item.sectionId === row.id)) throw new PortalError('Lớp đã có lịch học. Hãy xóa lịch trước khi xóa lớp nháp.', 409);
      if (state.enrollments.some(item => item.sectionId === row.id) || state.supportTickets.some(item => item.appealSectionId === row.id)) throw new PortalError('Lớp đã có đăng ký hoặc yêu cầu phúc khảo. Hãy giữ lớp để bảo toàn lịch sử.', 409);
      state.sections = state.sections.filter(item => item.id !== row.id); entityId = `Lớp tín chỉ ${row.code}`; break;
    }
    case 'cohort.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.cohorts, b.id, 'lớp niên khóa');
      if (state.students.some(item => item.cohortId === row.id)) throw new PortalError('Lớp đã có sinh viên. Hãy chuyển lớp sang ngừng hoạt động.', 409);
      state.cohorts = state.cohorts.filter(item => item.id !== row.id); entityId = `Lớp niên khóa ${row.code}`; break;
    }
    case 'subject.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.subjects, b.id, 'môn học');
      if (state.sections.some(item => item.subjectId === row.id) || state.curriculumVersions.some(version => version.courses.some(course => course.subjectId === row.id || course.code === row.code))) throw new PortalError('Môn đã thuộc lớp tín chỉ hoặc chương trình đào tạo. Hãy ngừng hoạt động môn.', 409);
      state.subjects = state.subjects.filter(item => item.id !== row.id); entityId = `Môn ${row.code} · ${row.name}`; break;
    }
    case 'lecturer.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.lecturers, b.id, 'giảng viên');
      if (state.users.some(item => item.lecturerCode?.toLowerCase() === row.code.toLowerCase())) throw new PortalError('Giảng viên đã liên kết tài khoản. Admin cần xử lý tài khoản trước.', 409);
      state.lecturers = state.lecturers.filter(item => item.id !== row.id); entityId = `Giảng viên ${row.code} · ${row.name}`; break;
    }
    case 'catalog.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.catalogs, b.id, 'danh mục');
      if (row.kind === 'intake') throw new PortalError('Khóa tuyển sinh được giữ trong danh mục để bảo toàn lịch sử. Hãy ngừng hoạt động mục không dùng.', 409);
      if (row.kind === 'semester' && compareSemesters(row.name, configuredCurrentSemester(), state.catalogs) >= 0) throw new PortalError('Chỉ xóa được học kỳ trước học kỳ hiện tại. Học kỳ hiện tại hoặc tương lai có thể được ngừng hoạt động.', 409);
      if (row.kind === 'semester' && catalogReferenced(state, row)) throw new PortalError('Không thể xóa học kỳ đã được lớp tín chỉ tham chiếu. Hãy ngừng hoạt động để giữ lịch sử.', 409);
      if (catalogReferenced(state, row) || state.curriculumVersions.some(version =>
        row.kind === 'faculty' && catalogEqual('faculty', version.faculty, row.name, state.catalogs)
        || row.kind === 'major' && catalogEqual('major', version.major, row.name, state.catalogs)
        || row.kind === 'intake' && row.startYear !== null && version.intakeStartYear <= row.startYear && row.startYear <= version.intakeEndYear
      )) throw new PortalError('Danh mục đã có dữ liệu liên quan. Hãy ngừng hoạt động danh mục.', 409);
      state.catalogs = state.catalogs.filter(item => item.id !== row.id); entityId = `Danh mục ${row.name}`; break;
    }
    case 'curriculum.draft.delete': {
      requireRole(actor, ['admin', 'academic']);
      const row = get(state.curriculumVersions, b.id, 'bản nháp chương trình');
      if (row.status !== 'draft') throw new PortalError('Chỉ xóa được bản nháp; chương trình đã công bố cần ngừng áp dụng.', 409);
      if (state.students.some(item => item.curriculumId === row.id) || state.curriculumAssignments.some(item => item.oldVersionId === row.id || item.newVersionId === row.id)) throw new PortalError('Bản nháp có dữ liệu tham chiếu; không thể xóa.', 409);
      const programCode = state.curriculumPrograms.find(item => item.id === row.programId)?.code || row.programId;
      state.curriculumVersions = state.curriculumVersions.filter(item => item.id !== row.id);
      if (!state.curriculumVersions.some(item => item.programId === row.programId)) state.curriculumPrograms = state.curriculumPrograms.filter(item => item.id !== row.programId);
      entityId = `Bản nháp ${programCode} · ${row.version}`; break;
    }
    case 'catalog.save':
    case 'lecturer.save': { entityId = saveDirectory(state, actor, action, b); break; }
    case 'curriculum.create': {
      requireRole(actor, ['admin', 'academic']);
      const programCode = code(b.code);
      unique(state.curriculumPrograms, '', row => row.code.toUpperCase() === programCode, 'Mã chương trình');
      const program: CurriculumProgram = { id: randomUUID(), code: programCode, name: text(b.name, 'tên chương trình', true, 200), active: true };
      const stamp = new Date().toISOString();
      const scope = curriculumScope(state, b);
      const rawVersion = text(b.version, 'mã bản chương trình', true, 40);
      if (state.curriculumVersions.some(row => row.programId === program.id && row.version === rawVersion)) throw new PortalError('Bản chương trình này đã tồn tại.', 409);
      const version: CurriculumVersion = { id: randomUUID(), programId: program.id, version: rawVersion, ...scope, planStartYear: integer(b.planStartYear, 'Năm bắt đầu kế hoạch', 1990, 2110), status: 'draft', totalCreditsRequired: integer(b.totalCreditsRequired, 'Tổng tín chỉ yêu cầu', 1, 500), trainingTime: text(b.trainingTime, 'Thời gian đào tạo', false, 100), terms: [], electiveGroups: [], courses: [], createdAt: stamp, updatedAt: stamp, publishedAt: '' };
      state.curriculumPrograms.push(program); state.curriculumVersions.push(version); entityId = version.id; break;
    }
    case 'curriculum.version.create': {
      requireRole(actor, ['admin', 'academic']);
      const source = get(state.curriculumVersions, b.sourceVersionId, 'chương trình đào tạo');
      if (source.status === 'draft') throw new PortalError('Chỉ tạo bản mới từ chương trình đã áp dụng hoặc ngừng áp dụng.');
      const versionName = text(b.version, 'mã bản chương trình mới', true, 40);
      if (state.curriculumVersions.some(row => row.programId === source.programId && row.version === versionName)) throw new PortalError('Bản chương trình này đã tồn tại.', 409);
      const version = copyCurriculumVersion(source, randomUUID(), versionName);
      state.curriculumVersions.push(version); entityId = version.id; break;
    }
    case 'curriculum.draft.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = get(state.curriculumVersions, b.id, 'chương trình đào tạo');
      if (old.status !== 'draft') throw new PortalError('Chỉ chỉnh sửa được bản nháp. Hãy tạo bản mới để thay đổi chương trình đã công bố.', 409);
      const program = get(state.curriculumPrograms, old.programId, 'chương trình đào tạo');
      const programCode = code(b.programCode || program.code);
      unique(state.curriculumPrograms, program.id, row => row.code.toUpperCase() === programCode, 'Mã chương trình');
      const hasPublishedSibling = state.curriculumVersions.some(row => row.programId === program.id && row.id !== old.id && row.status !== 'draft');
      const programName = text(b.programName || program.name, 'tên chương trình', true, 200);
      if (hasPublishedSibling && (programCode !== program.code || programName !== program.name)) throw new PortalError('Chương trình đã được áp dụng; không sửa mã hoặc tên dùng chung để bảo toàn lịch sử.', 409);
      program.code = programCode; program.name = text(b.programName || program.name, 'tên chương trình', true, 200);
      const next = normalizeCurriculumVersion(state, b, old);
      if (state.curriculumVersions.some(row => row.id !== old.id && row.programId === old.programId && row.version === text(b.version || old.version, 'mã bản chương trình', true, 40))) throw new PortalError('Bản chương trình này đã tồn tại.', 409);
      next.version = text(b.version || old.version, 'mã bản chương trình', true, 40);
      validateCurriculumStructure(next, state, false);
      state.curriculumVersions[state.curriculumVersions.findIndex(row => row.id === old.id)] = next;
      entityId = next.id; break;
    }
    case 'curriculum.publish': {
      requireRole(actor, ['admin', 'academic']);
      const version = get(state.curriculumVersions, b.id, 'chương trình đào tạo');
      if (version.status !== 'draft') throw new PortalError('Chỉ công bố được bản nháp.', 409);
      validateCurriculumStructure(version, state, true);
      const faculty = findCatalog(state, 'faculty', version.faculty);
      const major = faculty ? findCatalog(state, 'major', version.major, faculty.id) : undefined;
      const degreeSystem = findCatalog(state, 'degreeSystem', version.degreeSystem);
      if (!faculty?.active || !major?.active || !degreeSystem?.active) throw new PortalError('Khoa, ngành hoặc hệ đào tạo trong phạm vi đã ngừng hoạt động; không thể công bố chương trình mới.', 409);
      const conflict = state.curriculumVersions.find(row => row.id !== version.id && row.status === 'active'
        && catalogEqual('faculty', row.faculty, version.faculty, state.catalogs)
        && catalogEqual('major', row.major, version.major, state.catalogs)
        && catalogEqual('degreeSystem', row.degreeSystem, version.degreeSystem, state.catalogs)
        && row.intakeStartYear <= version.intakeEndYear && version.intakeStartYear <= row.intakeEndYear);
      if (conflict) throw new PortalError('Phạm vi đang chồng lấn với một chương trình đang áp dụng. Hãy xác định lại khóa hoặc ngừng áp dụng chương trình cũ trước.', 409);
      version.status = 'active'; version.publishedAt = new Date().toISOString(); version.updatedAt = version.publishedAt;
      entityId = version.id; break;
    }
    case 'curriculum.retire': {
      requireRole(actor, ['admin', 'academic']);
      const version = get(state.curriculumVersions, b.id, 'chương trình đào tạo');
      if (version.status !== 'active') throw new PortalError('Chỉ ngừng áp dụng được chương trình đang hoạt động.', 409);
      version.status = 'retired'; version.updatedAt = new Date().toISOString(); entityId = version.id; break;
    }
    case 'user.save': {
      requireRole(actor, ['admin']);
      const existing = b.id ? get(state.users, b.id, 'tài khoản') : undefined;
      const id = existing?.id || randomUUID();
      const role = text(b.role, 'vai trò') as UserRole;
      if (!['admin', 'academic', 'lecturer', 'student'].includes(role)) throw new PortalError('Vai trò không hợp lệ.');
      const username = text(b.username, 'tên đăng nhập', true, 100).toLowerCase();
      const profile = accountProfile(state, role, b, existing);
      const mail = email(profile.email);
      unique(state.users, id, u => u.username.toLowerCase() === username || u.email.toLowerCase() === username || u.username.toLowerCase() === mail || u.email.toLowerCase() === mail || u.studentCode?.toLowerCase() === username, 'Tên đăng nhập/email');
      const active = flag(b.active, true);
      if (existing?.id === actor.id && (!active || role !== 'admin')) throw new PortalError('Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập.');
      if (existing?.role === 'admin' && (!active || role !== 'admin') && state.users.filter(u => u.role === 'admin' && u.active).length <= 1) throw new PortalError('Phải còn ít nhất một Admin hoạt động.');
      if (existing && (existing.role !== role || !active) && state.sections.some(s => s.lecturerId === id)) throw new PortalError('Cần phân công lại các lớp trước khi đổi vai trò/khóa giảng viên.');
      const password = typeof b.password === 'string' ? b.password : '';
      if ((!existing || password) && (password.length < 8 || password.length > 128)) throw new PortalError('Mật khẩu phải có từ 8 đến 128 ký tự.');
      put(state.users, { id, username, ...profile, email: mail, role, active, passwordHash: password ? hashPassword(password) : existing!.passwordHash, avatarUrl: existing?.avatarUrl || '/default-avatar.png' });
      entityId = id; break;
    }
    case 'user.password.reset': {
      requireRole(actor, ['admin']);
      const user = get(state.users, b.id, 'tài khoản');
      if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 128) throw new PortalError('Mật khẩu cần từ 8 đến 128 ký tự.');
      user.passwordHash = hashPassword(b.password);
      entityId = user.id; break;
    }
    case 'cohort.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = b.id ? get(state.cohorts, b.id, 'lớp niên khóa') : undefined;
      const id = old?.id || randomUUID(); const c = code(b.code);
      unique(state.cohorts, id, r => r.code === c, 'Mã lớp');
      const startYear = integer(b.startYear, 'Năm bắt đầu', 1990, 2100);
      const endYear = integer(b.endYear, 'Năm kết thúc', startYear + 1, 2110);
      const selection = academicSelection(state, b.faculty, b.major, b.intake || (startYear + '-' + endYear), old ? { ...old, academicYear: old.startYear + '-' + old.endYear } : undefined);
      if (selection.intake.startYear !== startYear || selection.intake.endYear !== endYear) throw new PortalError('Năm tuyển sinh và năm kết thúc không khớp danh mục khóa.');
      if (old && state.students.some(student => student.cohortId === id) && (!catalogEqual('faculty', old.faculty, selection.faculty, state.catalogs) || !catalogEqual('major', old.major, selection.major, state.catalogs) || old.startYear !== startYear || old.endYear !== endYear)) throw new PortalError('Lớp đã có sinh viên; không đổi khoa, ngành hoặc khóa. Hãy tạo lớp mới để bảo toàn hồ sơ.', 409);
      put(state.cohorts, { id, code: c, name: text(b.name, 'tên lớp'), major: selection.major, faculty: selection.faculty, startYear, endYear, active: flag(b.active, true) });
      entityId = id; break;
    }
    case 'student.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = b.id ? get(state.students, b.id, 'hồ sơ') : undefined;
      const id = old?.id || randomUUID(); const c = old?.code || code(b.code); const mail = email(b.email);
      unique(state.students, id, s => s.code === c || s.email.toLowerCase() === mail, 'Mã sinh viên/email');
      const cohortId = b.cohortId ? get(state.cohorts, b.cohortId, 'lớp niên khóa').id : null;
      if (cohortId && !state.cohorts.find(c => c.id === cohortId)?.active && cohortId !== old?.cohortId) throw new PortalError('Lớp niên khóa đã ngừng hoạt động.');
      const selection = academicSelection(state, b.faculty, b.major, b.academicYear, old);
      const selectedCohort = state.cohorts.find(row => row.id === cohortId);
      const unchangedRelation = !!old && old.cohortId === cohortId && catalogEqual('faculty', old.faculty, selection.faculty, state.catalogs) && catalogEqual('major', old.major, selection.major, state.catalogs) && catalogEqual('intake', old.academicYear, selection.academicYear, state.catalogs);
      if (selectedCohort && !unchangedRelation && !cohortMatches(selectedCohort, selection.faculty, selection.major, selection.academicYear, state.catalogs)) throw new PortalError('Lớp niên khóa không thuộc khoa, ngành và khóa tuyển sinh đã chọn.');
      const curriculumId = b.curriculumId === undefined ? old?.curriculumId || '' : String(b.curriculumId || '').trim();
      const assignedVersion = curriculumId ? state.curriculumVersions.find(row => row.id === curriculumId) : null;
      let degreeValue = b.degreeSystem === undefined ? old?.degreeSystem || '' : String(b.degreeSystem || '').trim();
      const intakeStartYear = selection.intake.startYear ?? intakeYears(selection.academicYear)?.startYear;
      // Backward-compatible API callers may explicitly submit a curriculum ID without the newer degree-system field.
      // Derive it only from that exact selected version when faculty, major, and intake already match.
      if (!degreeValue && assignedVersion && catalogEqual('faculty', assignedVersion.faculty, selection.faculty, state.catalogs)
        && catalogEqual('major', assignedVersion.major, selection.major, state.catalogs)
        && intakeStartYear !== undefined && intakeStartYear >= assignedVersion.intakeStartYear && intakeStartYear <= assignedVersion.intakeEndYear) degreeValue = assignedVersion.degreeSystem;
      const degreeSystem = degreeValue ? requireCatalog(state, 'degreeSystem', degreeValue, old?.degreeSystem).value : '';
      const curriculumProfile = { faculty: selection.faculty, major: selection.major, academicYear: selection.academicYear, degreeSystem };
      const unchangedProfile = !!old && catalogEqual('faculty', old.faculty, selection.faculty, state.catalogs) && catalogEqual('major', old.major, selection.major, state.catalogs) && catalogEqual('intake', old.academicYear, selection.academicYear, state.catalogs) && catalogEqual('degreeSystem', old.degreeSystem || '', degreeSystem, state.catalogs);
      const unresolvedLegacyAssignment = !!old && old.curriculumId === curriculumId && unchangedProfile && !assignedVersion;
      if (curriculumId && !unresolvedLegacyAssignment && (!assignedVersion || !curriculumVersionMatchesStudent(assignedVersion, curriculumProfile) || (assignedVersion.status === 'draft') || (assignedVersion.status !== 'active' && assignedVersion.id !== old?.curriculumId))) throw new PortalError('Chương trình phải được công bố và phù hợp khoa, ngành, khóa và hệ đào tạo của sinh viên.');
      const previousCurriculumId = old?.curriculumId || null;
      const nextCurriculumId = curriculumId || null;
      if (previousCurriculumId !== nextCurriculumId) {
        const hasHistory = old ? studentHasLearningHistory(state, old.id) : false;
        const reason = text(b.curriculumChangeReason, 'lý do đổi chương trình', hasHistory, 500);
        if (hasHistory && !reason) throw new PortalError('Sinh viên đã có lịch sử học tập; cần ghi lý do đổi chương trình.', 409);
        state.curriculumAssignments.push({ id: randomUUID(), studentId: id, oldVersionId: previousCurriculumId, newVersionId: nextCurriculumId, reason, actorId: actor.id, actorName: actor.name, createdAt: new Date().toISOString() });
      }
      const name = text(b.name, 'họ tên');
      const birth = date(b.dateOfBirth, false);
      if (birth && birth > new Date().toISOString().slice(0, 10)) throw new PortalError('Ngày sinh phải trước ngày hiện tại.');
      put(state.students, { id, code: c, name, email: mail, cohortId, major: selection.major, faculty: selection.faculty, academicYear: selection.academicYear, degreeSystem, curriculumId: curriculumId || null, phone: text(b.phone, 'số điện thoại', false, 25), address: text(b.address, 'địa chỉ', false, 500), dateOfBirth: birth, avatarUrl: old?.avatarUrl || '/default-avatar.png', active: flag(b.active, true), legacyGpa: old?.legacyGpa || 0, legacyCredits: old?.legacyCredits || 0, targetGpa: old?.targetGpa || 3.5, requiredCredits: integer(b.requiredCredits ?? old?.requiredCredits ?? 140, 'Tín chỉ tốt nghiệp', 1, 500) });
      // Keep login identity consistent with the academic profile; credentials/role remain Admin-only.
      const user = state.users.find(u => u.studentCode?.toLowerCase() === c.toLowerCase());
      if (user) { unique(state.users, user.id, u => u.email.toLowerCase() === mail || u.username.toLowerCase() === mail, 'Email tài khoản'); user.name = name; user.email = mail; user.faculty = selection.faculty; }
      entityId = id; break;
    }
    case 'subject.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = b.id ? get(state.subjects, b.id, 'môn học') : undefined;
      const id = old?.id || randomUUID(); const c = code(b.code);
      unique(state.subjects, id, s => s.code === c, 'Mã môn');
      const credits = integer(b.credits, 'Tín chỉ', 1, 30);
      if (old && credits !== old.credits && state.sections.some(s => s.subjectId === id && state.enrollments.some(e => e.sectionId === s.id))) throw new PortalError('Không đổi số tín chỉ của môn đã có đăng ký; hãy tạo mã môn mới.');
      put(state.subjects, { id, code: c, name: text(b.name, 'tên môn'), credits, department: requireCatalog(state, 'department', b.department, old?.department).value, active: flag(b.active, true) });
      entityId = id; break;
    }
    case 'section.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = b.id ? get(state.sections, b.id, 'lớp tín chỉ') : undefined;
      const id = old?.id || randomUUID(); const c = code(b.code);
      unique(state.sections, id, s => s.code === c, 'Mã lớp tín chỉ');
      const subject = get(state.subjects, b.subjectId, 'môn học');
      if (!subject.active && old?.subjectId !== subject.id) throw new PortalError('Môn học đã ngừng hoạt động.');
      const lecturer = b.lecturerId ? get(state.users, b.lecturerId, 'giảng viên') : null;
      const lecturerProfile = lecturer?.lecturerCode ? state.lecturers.find(profile => profile.code === lecturer.lecturerCode) : null;
      if (lecturer && (!old || old.lecturerId !== lecturer.id) && (!lecturerProfile || !lecturerProfile.active)) throw new PortalError('Chọn giảng viên có hồ sơ đang hoạt động.');
      if (lecturer && (lecturer.role !== 'lecturer' || !lecturer.active)) throw new PortalError('Phải phân công tài khoản giảng viên đang hoạt động.');
      const capacity = integer(b.capacity, 'Sĩ số tối đa', 1, 1000);
      if (capacity < state.enrollments.filter(e => e.sectionId === id && e.status === 'registered').length) throw new PortalError('Sĩ số tối đa không được thấp hơn số đã đăng ký.', 409);
      const semester = requireCatalog(state, 'semester', b.semester, old?.semester).value;
      if (old && (old.subjectId !== subject.id || old.semester !== semester) && state.enrollments.some(e => e.sectionId === id)) throw new PortalError('Không đổi môn/học kỳ của lớp đã có lịch sử đăng ký.');
      const status = text(b.status, 'trạng thái') as Section['status'];
      if (!['draft', 'open', 'closed'].includes(status)) throw new PortalError('Trạng thái lớp không hợp lệ.');
      if (status === 'open' && !lecturer) throw new PortalError('Phải phân công giảng viên trước khi mở lớp.');
      if (status === 'open' && old?.gradesLocked) throw new PortalError('Bảng điểm đã khóa. Hãy mở khóa điểm trước khi mở lại đăng ký.', 409);
      if (status === 'open' && !state.meetings.some(meeting => meeting.sectionId === id)) throw new PortalError('Lớp chưa có lịch học. Hãy lưu lớp ở trạng thái Nháp, chọn “Lập lịch học”, sau đó mở đăng ký.');
      const registrationStart = timestamp(b.registrationStart), registrationEnd = timestamp(b.registrationEnd);
      if (registrationStart && registrationEnd && registrationStart >= registrationEnd) throw new PortalError('Hạn kết thúc phải sau hạn bắt đầu.');
      const allowCrossProgram = flag(b.allowCrossProgram, old?.allowCrossProgram ?? false);
      put(state.sections, { ...old, id, code: c, subjectId: subject.id, semester, lecturerId: lecturer?.id || null, capacity, status, gradesLocked: old?.gradesLocked || false, registrationStart, registrationEnd, allowCrossProgram, gradeWorkflowEnabled: old?.gradeWorkflowEnabled ?? false,
        componentGradesPublishedAt: old?.componentGradesPublishedAt || '', componentReviewDeadline: old?.componentReviewDeadline || '',
        componentsTransferredAt: old?.componentsTransferredAt || '', componentsTransferredById: old?.componentsTransferredById || null, componentsTransferredByName: old?.componentsTransferredByName || '' });
      validateSchedule(state); entityId = id; break;
    }
    case 'meeting.save': {
      requireRole(actor, ['admin', 'academic']);
      const old = b.id ? get(state.meetings, b.id, 'buổi học') : undefined;
      const section = get(state.sections, b.sectionId, 'lớp tín chỉ');
      if (old && old.sectionId !== section.id) {
        const previous = get(state.sections, old.sectionId, 'lớp tín chỉ cũ');
        if (previous.status === 'open' && state.meetings.filter(meeting => meeting.sectionId === previous.id).length === 1) throw new PortalError('Không thể chuyển buổi học cuối cùng khỏi lớp đang mở đăng ký. Hãy lập buổi học mới cho lớp cần thêm lịch.', 409);
      }
      const startPeriod = integer(b.startPeriod, 'Tiết bắt đầu', 1, 15);
      const endPeriod = integer(b.endPeriod, 'Tiết kết thúc', startPeriod, 15);
      const startDate = date(b.startDate), endDate = date(b.endDate);
      if (startDate > endDate) throw new PortalError('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
      const row: Meeting = { id: old?.id || randomUUID(), sectionId: section.id, day: integer(b.day, 'Thứ (Thứ 2 = 1, CN = 7)', 1, 7), startPeriod, endPeriod, startDate, endDate, room: requireCatalog(state, 'room', b.room, old?.room).value };
      if (!meetingsOverlap(row, row)) throw new PortalError('Khoảng ngày không chứa thứ đã chọn.');
      put(state.meetings, row); validateSchedule(state); entityId = row.id; break;
    }
    case 'enrollment.add': {
      requireRole(actor, ['admin', 'academic', 'student']);
      const student = ownStudent(state, actor, b.studentId);
      const section = get(state.sections, b.sectionId, 'lớp tín chỉ');
      const subject = get(state.subjects, section.subjectId, 'môn học');
      const active = state.enrollments.filter(e => e.status === 'registered');
      if (!student.active || !subject.active) throw new PortalError('Hồ sơ sinh viên hoặc môn học đã ngừng hoạt động.', 409);
      if (!section.allowCrossProgram) {
        const curriculumCodes = curriculumCourseCodesForStudent(state, student);
        if (!curriculumCodes) throw new PortalError('Sinh viên chưa được gán chương trình đào tạo phù hợp; chưa thể đăng ký lớp tín chỉ.', 409);
        if (!curriculumCodes.has(subject.code.toUpperCase())) throw new PortalError('Môn học không thuộc chương trình đào tạo của sinh viên.', 403);
        const semesterCourses = plannedCourseCodesForStudentInSemester(state, student, section.semester);
        if (!semesterCourses?.has(subject.code.toUpperCase())) throw new PortalError('Môn học không thuộc học kỳ tương ứng trong chương trình đào tạo của sinh viên.', 409);
      }
      const issue = registrationIssue(section, active.filter(e => e.sectionId === section.id).length, state.meetings.some(m => m.sectionId === section.id));
      if (issue) throw new PortalError(issue, 409);
      if (active.some(e => e.studentId === student.id && state.sections.some(s => s.id === e.sectionId && s.subjectId === section.subjectId && catalogEqual('semester', s.semester, section.semester, state.catalogs)))) throw new PortalError('Đã đăng ký môn này trong cùng học kỳ.', 409);
      const old = state.enrollments.find(e => e.sectionId === section.id && e.studentId === student.id);
      const row = { id: old?.id || randomUUID(), sectionId: section.id, studentId: student.id, status: 'registered' as const, registeredAt: new Date().toISOString() };
      put(state.enrollments, row); validateSchedule(state); entityId = row.id; break;
    }
    case 'enrollment.cancel': {
      requireRole(actor, ['admin', 'academic', 'student']);
      const row = get(state.enrollments, b.id, 'đăng ký');
      ownStudent(state, actor, row.studentId);
      const section = get(state.sections, row.sectionId, 'lớp tín chỉ');
      const issue = cancellationIssue(section, state.results.find(r => r.enrollmentId === row.id), actor.role === 'student');
      if (issue) throw new PortalError(issue, 409);
      row.status = 'cancelled'; entityId = row.id; break;
    }
    case 'result.batch': {
      requireRole(actor, ['admin', 'academic']);
      if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 500) throw new PortalError('Danh sách điểm không hợp lệ.');
      for (const row of b.rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) throw new PortalError('Dòng điểm không hợp lệ.');
        mutate(state, actor, 'result.save', row as Record<string, unknown>);
      }
      entityId = 'batch'; break;
    }
    case 'result.components.batch':
    case 'section.components.publish':
    case 'grade.reconciliation.submit':
    case 'grade.reconciliation.resolve':
    case 'section.components.transfer':
    case 'result.official.publish':
      throw new PortalError('Giáo vụ quản lý việc nhập và công bố điểm.', 403);
    case 'result.save': {
      const enrollment = get(state.enrollments, b.enrollmentId, 'đăng ký');
      editableSection(state, actor, enrollment.sectionId);
      if (enrollment.status !== 'registered') throw new PortalError('Sinh viên đã hủy lớp.', 409);
      const old = state.results.find(r => r.enrollmentId === enrollment.id);
      const attendance = gradeScore(b.attendance), midterm = gradeScore(b.midterm), exam = gradeScore(b.exam);
      const published = flag(b.published, false);
      const updatedAt = new Date().toISOString();
      const row: Result = { id: old?.id || randomUUID(), enrollmentId: enrollment.id, attendance, midterm, exam, published, publishedAt: published ? updatedAt : '', updatedAt };
      if (row.published && gradeSummary(row).final === null) throw new PortalError('Phải nhập đủ ba điểm trước khi công bố.');
      put(state.results, row); entityId = row.id; break;
    }
    case 'section.lock': {
      requireRole(actor, ['admin', 'academic']);
      const section = get(state.sections, b.id, 'lớp tín chỉ');
      const locked = flag(b.locked, true);
      if (locked) {
        const enrollments = state.enrollments.filter(e => e.sectionId === section.id && e.status === 'registered');
        if (!enrollments.length || enrollments.some(e => !state.results.some(r => r.enrollmentId === e.id && r.published && gradeSummary(r).final !== null))) throw new PortalError('Chỉ khóa khi toàn bộ sinh viên đã có điểm đầy đủ và đã công bố.');
        const results = enrollments.map(enrollment => state.results.find(result => result.enrollmentId === enrollment.id)!);
        const deadline = officialAppealDeadline(results);
        if (!deadline || Date.now() <= Date.parse(deadline)) throw new PortalError(`Chỉ khóa sau khi đã hết thời hạn phúc khảo 30 ngày${deadline ? ` (${deadline.slice(0, 10)})` : ''}.`, 409);
        if (state.supportTickets.some(ticket => ticket.category === 'grade_appeal' && ticket.appealSectionId === section.id && ticket.status !== 'closed')) throw new PortalError('Chưa thể khóa khi còn yêu cầu phúc khảo đang xử lý.', 409);
      }
      section.gradesLocked = locked; entityId = section.id; break;
    }
    default: throw new PortalError('Thao tác không hợp lệ.');
  }
  state.audits.push({ id: randomUUID(), actorId: actor.id, actorName: actor.name, action, entityId, createdAt: new Date().toISOString() });
  return entityId;
}

export function view(state: PortalState, actor: Actor, storage: PortalView['storage']): PortalView {
  ensureDirectories(state);
  const staff = isStaff(actor);
  const own = state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase());
  const assigned = new Set(state.sections.filter(s => s.lecturerId === actor.id).map(s => s.id));
  const enrollments = state.enrollments.filter(e => staff || (actor.role === 'student' ? e.studentId === own?.id : assigned.has(e.sectionId) && e.status === 'registered'));
  let sections = state.sections;
  let subjects = state.subjects;
  let meetings = state.meetings;
  if (actor.role === 'lecturer') {
    sections = state.sections.filter(section => assigned.has(section.id));
    const assignedSubjectIds = new Set(sections.map(section => section.subjectId));
    subjects = state.subjects.filter(subject => assignedSubjectIds.has(subject.id));
    meetings = state.meetings.filter(meeting => assigned.has(meeting.sectionId));
  }
  if (actor.role === 'student') {
    const curriculumCodes = own ? curriculumCourseCodesForStudent(state, own) : null;
    const ownSectionIds = new Set(enrollments.filter(row => row.status === 'registered').map(row => row.sectionId));
    const isInPlannedProgram = (section: Section) => {
      const course = state.subjects.find(row => row.id === section.subjectId);
      if (!own || !curriculumCodes || !course || !curriculumCodes.has(course.code.toUpperCase())) return false;
      return !!plannedCourseCodesForStudentInSemester(state, own, section.semester)?.has(course.code.toUpperCase());
    };
    const visibleSections = state.sections.filter(section => {
      if (ownSectionIds.has(section.id)) return true;
      if (section.status !== 'open') return false;
      if (section.allowCrossProgram) return true;
      return isInPlannedProgram(section);
    }).map(section => ({
      ...section,
      outsideCurriculum: (section.allowCrossProgram || ownSectionIds.has(section.id)) && !isInPlannedProgram(section),
    }));
    const visibleSectionIds = new Set(visibleSections.map(section => section.id));
    sections = visibleSections;
    subjects = state.subjects.filter(subject => curriculumCodes?.has(subject.code.toUpperCase()) || sections.some(section => section.subjectId === subject.id));
    meetings = state.meetings.filter(meeting => visibleSectionIds.has(meeting.sectionId));
  }
  const studentIds = new Set(enrollments.map(e => e.studentId));
  const enrollmentIds = new Set(enrollments.map(e => e.id));
  const visibleStudents = state.students.filter(s => staff || (actor.role === 'student' ? s.id === own?.id : studentIds.has(s.id)));
  const exposedStudents = actor.role === 'lecturer' ? visibleStudents.map(student => ({
    ...student,
    email: '', major: '', faculty: '', academicYear: '', degreeSystem: '', curriculumId: null,
    phone: '', address: '', dateOfBirth: '', avatarUrl: '',
    legacyGpa: 0, legacyCredits: 0, targetGpa: 0, requiredCredits: 0,
  })) : visibleStudents;
  const visibleCohorts = actor.role === 'lecturer'
    ? state.cohorts.filter(cohort => visibleStudents.some(student => student.cohortId === cohort.id))
    : state.cohorts;
  const configuredSemester = configuredCurrentSemester();
  const studentAcademicCalendar = actor.role === 'student' && own ? buildStudentAcademicCalendar(state, own) : null;
  const ownCurriculum = actor.role === 'student' && own ? assignedCurriculum(state, own) : null;
  const programForStudent = ownCurriculum ? state.curriculumPrograms.find(row => row.id === ownCurriculum.programId) : null;
  return {
    me: { id: actor.id, username: actor.username, name: actor.name, role: actor.role, studentCode: actor.studentCode, lecturerCode: actor.lecturerCode }, storage,
    currentSemester: findCatalog(state, 'semester', configuredSemester)?.name || configuredSemester,
    sectionCounts: Object.fromEntries(sections.map(s => [s.id, state.enrollments.filter(e => e.sectionId === s.id && e.status === 'registered').length])),
    cohortCounts: Object.fromEntries(visibleCohorts.map(c => [c.id, (actor.role === 'lecturer' ? visibleStudents : state.students).filter(s => s.cohortId === c.id).length])),
    users: state.users.filter(u => actor.role === 'admin' || u.role === 'lecturer' && (actor.role !== 'lecturer' || u.id === actor.id)).map(({ passwordHash: _, ...u }) => u),
    students: exposedStudents,
    cohorts: visibleCohorts, subjects, sections, meetings,
    catalogs: actor.role === 'lecturer' ? state.catalogs.filter(row => row.kind === 'semester') : state.catalogs,
    lecturers: staff ? state.lecturers : actor.role === 'lecturer' ? state.lecturers.filter(row => row.code === actor.lecturerCode) : state.lecturers.filter(row => row.active),
    enrollments,
    results: state.results.flatMap(result => {
      if (!enrollmentIds.has(result.enrollmentId)) return [];
      if (actor.role === 'lecturer') return [result];
      if (actor.role === 'student') {
        if (result.published) return [result];
        return [];
      }
      return [result];
    }),
    gradeReconciliations: [],
    cancellationIssues: Object.fromEntries(enrollments.map(e => {
      const section = state.sections.find(row => row.id === e.sectionId)!;
      return [e.id, cancellationIssue(section, state.results.find(r => r.enrollmentId === e.id), actor.role === 'student') || ''];
    })),
    audits: staff ? state.audits.slice(-200).reverse() : [],
    ...(actor.role === 'student' ? { studentAcademicCalendar } : {}),
    ...(staff ? { curriculumPrograms: state.curriculumPrograms, curriculumVersions: state.curriculumVersions, curriculumAssignments: state.curriculumAssignments } : {}),
    ...(actor.role === 'student' ? { studentCurriculum: ownCurriculum && programForStudent ? { ...ownCurriculum, programCode: programForStudent.code, programName: programForStudent.name } : null } : {}),
  };
}

