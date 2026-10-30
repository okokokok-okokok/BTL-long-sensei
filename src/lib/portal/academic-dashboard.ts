import { gradeSummary } from './analytics';
import { registrationIssue } from './registration';
import { catalogChoices, catalogEqual, findCatalog } from './directories';
import { semesterChoices } from './semester';
import type { Audit, Enrollment, Meeting, PortalState, Section } from './types';

export const DEFAULT_CURRENT_SEMESTER = 'HK1 2026-2027';
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function configuredCurrentSemester() {
  return process.env.PORTAL_CURRENT_SEMESTER?.trim() || DEFAULT_CURRENT_SEMESTER;
}

export function todayInVietnam(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function resultFor(state: PortalState, enrollmentId: string) {
  return state.results.find(result => result.enrollmentId === enrollmentId);
}

function hasAnyScore(result?: PortalState['results'][number]) {
  return !!result && [result.attendance, result.midterm, result.exam].some(value => value !== null && value !== undefined);
}

function hasCompletePublishedScore(state: PortalState, enrollment: Enrollment) {
  const result = resultFor(state, enrollment.id);
  return !!result && result.published && gradeSummary(result).final !== null;
}

function sectionProgress(state: PortalState, section: Section) {
  const enrollments = state.enrollments.filter(row => row.sectionId === section.id && row.status === 'registered');
  const completed = enrollments.filter(row => hasCompletePublishedScore(state, row)).length;
  const entered = enrollments.filter(row => hasAnyScore(resultFor(state, row.id))).length;
  const complete = enrollments.length > 0 && completed === enrollments.length;
  let status: 'no-students' | 'not-started' | 'in-progress' | 'published-unlocked' | 'locked' = 'no-students';
  if (section.gradesLocked) status = 'locked';
  else if (enrollments.length > 0 && entered === 0) status = 'not-started';
  else if (complete) status = 'published-unlocked';
  else if (enrollments.length > 0) status = 'in-progress';
  return { sectionId: section.id, enrollmentCount: enrollments.length, completedCount: completed, enteredCount: entered, complete, status };
}

function registrationInfo(section: Section, count: number, now: Date, hasSchedule: boolean, subjectActive: boolean) {
  const hasStart = Boolean(section.registrationStart);
  const hasEnd = Boolean(section.registrationEnd);
  const start = hasStart ? Date.parse(section.registrationStart) : null;
  const end = hasEnd ? Date.parse(section.registrationEnd) : null;
  const invalid = (hasStart && !Number.isFinite(start)) || (hasEnd && !Number.isFinite(end));
  const timeStatus = invalid ? 'invalid' : start !== null && now.getTime() < start ? 'not-started' : end !== null && now.getTime() > end ? 'ended' : !hasStart && !hasEnd ? 'not-configured' : 'active';
  const remainingSeats = Math.max(0, section.capacity - count);
  const isOpen = section.status === 'open';
  const hasSeats = remainingSeats > 0;
  const withinWindow = timeStatus === 'active' || timeStatus === 'not-configured';
  const blockReason = registrationIssue(section, count, hasSchedule, now.getTime()) || (!subjectActive ? 'Môn học đã ngừng hoạt động.' : null);
  const canRegister = isOpen && withinWindow && hasSeats && !blockReason;
  type RegistrationStatus = Section['status'] | 'invalid-window' | 'not-started' | 'ended' | 'full' | 'open-no-deadline' | 'accepting' | 'locked' | 'unavailable';
  let registrationStatus: RegistrationStatus = section.status;
  if (section.gradesLocked) registrationStatus = 'locked';
  else if (isOpen) {
    if (timeStatus === 'invalid') registrationStatus = 'invalid-window';
    else if (timeStatus === 'not-started') registrationStatus = 'not-started';
    else if (timeStatus === 'ended') registrationStatus = 'ended';
    else if (!hasSeats) registrationStatus = 'full';
    else if (blockReason) registrationStatus = 'unavailable';
    else if (timeStatus === 'not-configured') registrationStatus = 'open-no-deadline';
    else registrationStatus = 'accepting';
  }
  return { count, remainingSeats, isOpen, hasSeats, timeStatus, canRegister, registrationStatus, blockReason };
}

function meetingWeekday(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function auditDetails(state: PortalState, audit: Audit) {
  const actionLabels: Record<string, string> = {
    'user.save': 'Cập nhật tài khoản',
    'user.password.change': 'Đổi mật khẩu cá nhân',
    'user.password.reset': 'Đặt lại mật khẩu tài khoản',
    'student.save': 'Cập nhật hồ sơ sinh viên',
    'student.delete': 'Xóa hồ sơ sinh viên',
    'cohort.save': 'Cập nhật lớp niên khóa',
    'cohort.delete': 'Xóa lớp niên khóa',
    'subject.save': 'Cập nhật danh mục môn học',
    'subject.delete': 'Xóa môn học',
    'section.save': 'Cập nhật lớp tín chỉ / phân công',
    'section.delete': 'Xóa lớp tín chỉ nháp',
    'meeting.save': 'Cập nhật lịch học',
    'meeting.delete': 'Xóa lịch học định kỳ',
    'lecturer.delete': 'Xóa hồ sơ giảng viên',
    'catalog.delete': 'Xóa danh mục',
    'user.delete': 'Xóa tài khoản',
    'curriculum.draft.delete': 'Xóa bản nháp chương trình',
    'enrollment.add': 'Thêm đăng ký học phần',
    'enrollment.cancel': 'Hủy đăng ký học phần',
    'result.save': 'Cập nhật điểm',
    'result.batch': 'Cập nhật điểm hàng loạt',
    'result.components.batch': 'Lưu điểm thành phần',
    'section.components.publish': 'Công bố điểm thành phần',
    'section.components.transfer': 'Chuyển điểm thành phần cho Giáo vụ',
    'grade.reconciliation.submit': 'Gửi yêu cầu đối soát',
    'grade.reconciliation.resolve': 'Xử lý yêu cầu đối soát',
    'result.official.publish': 'Công bố điểm chính thức',
    'section.lock': 'Khóa / mở khóa bảng điểm',
  };
  const section = state.sections.find(row => row.id === audit.entityId);
  const student = state.students.find(row => row.id === audit.entityId);
  const cohort = state.cohorts.find(row => row.id === audit.entityId);
  const subject = state.subjects.find(row => row.id === audit.entityId);
  const user = state.users.find(row => row.id === audit.entityId);
  const meeting = state.meetings.find(row => row.id === audit.entityId);
  const enrollment = state.enrollments.find(row => row.id === audit.entityId);
  const result = state.results.find(row => row.id === audit.entityId);
  const reconciliation = state.gradeReconciliations.find(row => row.id === audit.entityId);
  const relatedEnrollment = enrollment || (result ? state.enrollments.find(row => row.id === result.enrollmentId) : undefined) || (reconciliation ? state.enrollments.find(row => row.id === reconciliation.enrollmentId) : undefined);
  const relatedSection = section || (meeting ? state.sections.find(row => row.id === meeting.sectionId) : undefined) || (reconciliation ? state.sections.find(row => row.id === reconciliation.sectionId) : undefined) || (relatedEnrollment ? state.sections.find(row => row.id === relatedEnrollment.sectionId) : undefined);
  const relatedStudent = student || (reconciliation ? state.students.find(row => row.id === reconciliation.studentId) : undefined) || (relatedEnrollment ? state.students.find(row => row.id === relatedEnrollment.studentId) : undefined);
  const entity = user ? `Tài khoản ${user.username}`
    : student ? `Sinh viên ${student.code} · ${student.name}`
      : cohort ? `Lớp niên khóa ${cohort.code}`
        : subject ? `Môn ${subject.code} · ${subject.name}`
          : relatedEnrollment && relatedStudent && relatedSection ? `${relatedStudent.code} · ${relatedSection.code}`
            : relatedSection ? `Lớp tín chỉ ${relatedSection.code}`
              : audit.action === 'result.batch' ? 'Nhiều lớp tín chỉ'
                : audit.action.endsWith('.delete') ? audit.entityId : 'Dữ liệu đào tạo';
  return { ...audit, actionLabel: actionLabels[audit.action] || 'Thay đổi dữ liệu đào tạo', entityLabel: entity };
}

export function buildAcademicDashboard(
  state: PortalState,
  options: { semester?: string; date?: string; now?: Date; currentSemester?: string } = {},
) {
  const now = options.now || new Date();
  const configuredSemester = options.currentSemester?.trim() || configuredCurrentSemester();
  const currentSemester = findCatalog(state, 'semester', configuredSemester)?.name || configuredSemester;
  const semesters = state.catalogs?.some(row => row.kind === 'semester') ? catalogChoices(state.catalogs, 'semester', { filter: true }).map(row => row.value) : state.sections.map(section => section.semester);
  const semester = options.semester && semesters.includes(options.semester) ? options.semester : currentSemester;
  const date = options.date && isCalendarDate(options.date) ? options.date : todayInVietnam(now);
  const sections = state.sections.filter(section => catalogEqual('semester', section.semester, semester, state.catalogs));
  const sectionIds = new Set(sections.map(section => section.id));
  const activeEnrollments = state.enrollments.filter(enrollment => enrollment.status === 'registered' && sectionIds.has(enrollment.sectionId));
  const activeEnrollmentBySection = new Map<string, number>();
  for (const enrollment of activeEnrollments) activeEnrollmentBySection.set(enrollment.sectionId, (activeEnrollmentBySection.get(enrollment.sectionId) || 0) + 1);
  const progress = sections.map(section => sectionProgress(state, section));
  const progressBySection = new Map(progress.map(item => [item.sectionId, item]));
  const registration = sections.map(section => {
    const subject = state.subjects.find(row => row.id === section.subjectId);
    const lecturer = state.users.find(row => row.id === section.lecturerId);
    return {
      id: section.id,
      code: section.code,
      semester: section.semester,
      subjectCode: subject?.code || '',
      subjectName: subject?.name || 'Chưa có môn học',
      lecturerName: lecturer?.name || '',
      lecturerCode: lecturer?.lecturerCode || '',
      status: section.status,
      registrationStart: section.registrationStart || null,
      registrationEnd: section.registrationEnd || null,
      capacity: section.capacity,
      gradesLocked: section.gradesLocked,
      ...registrationInfo(section, activeEnrollmentBySection.get(section.id) || 0, now, state.meetings.some(meeting => meeting.sectionId === section.id), !!subject?.active),
    };
  }).sort((a, b) => a.code.localeCompare(b.code, 'vi'));
  const registrationWindows = sections.filter(section => section.registrationStart || section.registrationEnd);
  const distinctWindows = new Set(registrationWindows.map(section => `${section.registrationStart}|${section.registrationEnd}`));
  const registrationWindow = registrationWindows.length === 0 ? { configured: false, label: 'Chưa thiết lập thời gian đăng ký theo lớp' }
    : distinctWindows.size === 1 ? { configured: true, label: 'Thời hạn đăng ký được hiển thị theo từng lớp' }
      : { configured: true, label: `Thiết lập riêng trên ${registrationWindows.length} lớp` };
  const gradeEntryStart = process.env.PORTAL_GRADE_ENTRY_START?.trim() || '';
  const gradeEntryEnd = process.env.PORTAL_GRADE_ENTRY_END?.trim() || '';
  const dateWeekday = meetingWeekday(date);
  const todaySchedule = state.meetings.filter(meeting => {
    const section = state.sections.find(row => row.id === meeting.sectionId);
    return !!section && catalogEqual('semester', section.semester, semester, state.catalogs) && meeting.day === dateWeekday && meeting.startDate <= date && meeting.endDate >= date;
  }).map(meeting => {
    const section = state.sections.find(row => row.id === meeting.sectionId)!;
    const subject = state.subjects.find(row => row.id === section.subjectId);
    const lecturer = state.users.find(row => row.id === section.lecturerId);
    return { id: meeting.id, sectionId: section.id, sectionCode: section.code, subjectCode: subject?.code || '', subjectName: subject?.name || 'Chưa có môn học', lecturerName: lecturer?.name || 'Chưa phân công', day: meeting.day, startPeriod: meeting.startPeriod, endPeriod: meeting.endPeriod, startDate: meeting.startDate, endDate: meeting.endDate, room: meeting.room };
  }).sort((a, b) => a.startPeriod - b.startPeriod || a.sectionCode.localeCompare(b.sectionCode, 'vi'));
  const publishedResults = activeEnrollments.map(enrollment => ({ enrollment, result: resultFor(state, enrollment.id) }))
    .filter(item => item.result?.published && gradeSummary(item.result).final !== null)
    .map(item => gradeSummary(item.result));
  const passCount = publishedResults.filter(result => result.passed === true).length;
  const failCount = publishedResults.filter(result => result.passed === false).length;
  const activeStudents = state.students.filter(student => student.active).length;
  const activeLecturers = state.users.filter(user => user.active && user.role === 'lecturer').length;
  const activeCohorts = state.cohorts.filter(cohort => cohort.active).length;
  const taskSections = (predicate: (section: Section, row: ReturnType<typeof sectionProgress>) => boolean) => sections.filter(section => predicate(section, progressBySection.get(section.id)!)).map(section => ({ id: section.id, code: section.code, subjectName: state.subjects.find(subject => subject.id === section.subjectId)?.name || 'Chưa có môn học' })).sort((a, b) => a.code.localeCompare(b.code, 'vi'));
  const audits = state.audits.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12).map(audit => auditDetails(state, audit));

  const yearMatch = semester.match(/(20\d{2})\s*[-–]\s*(20\d{2})/);
  return {
    semester,
    currentSemester,
    semesters: semesterChoices([...semesters, currentSemester], state.catalogs, currentSemester).map(row => row.value),
    schoolYear: yearMatch ? `${yearMatch[1]}–${yearMatch[2]}` : 'Theo cấu hình học kỳ',
    date,
    stats: {
      activeStudents,
      activeLecturers,
      activeCohorts,
      sections: sections.length,
      openSections: sections.filter(section => section.status === 'open').length,
      activeEnrollments: activeEnrollments.length,
    },
    scopes: {
      activeStudents: 'Toàn hệ thống',
      activeLecturers: 'Toàn hệ thống',
      activeCohorts: 'Toàn hệ thống',
      sections: semester,
      openSections: 'Trạng thái lớp ở học kỳ đã chọn',
      activeEnrollments: semester,
    },
    registrationWindow,
    gradeEntryWindow: {
      configured: Boolean(gradeEntryStart || gradeEntryEnd),
      label: gradeEntryStart || gradeEntryEnd ? `Từ ${gradeEntryStart || 'chưa đặt'} đến ${gradeEntryEnd || 'chưa đặt'}` : 'Chưa thiết lập thời gian nhập điểm',
    },
    tasks: {
      unassigned: taskSections(section => !section.lecturerId),
      noSchedule: taskSections(section => !state.meetings.some(meeting => meeting.sectionId === section.id)),
      noGrades: taskSections((section, row) => row.enrollmentCount > 0 && row.status === 'not-started'),
      gradeInProgress: taskSections((_section, row) => row.enrollmentCount > 0 && row.status === 'in-progress'),
      readyToLock: taskSections((section, row) => row.enrollmentCount > 0 && row.status === 'published-unlocked'),
    },
    registration,
    todaySchedule,
    gradeProgress: {
      noStudents: progress.filter(row => row.status === 'no-students').length,
      notStarted: progress.filter(row => row.status === 'not-started').length,
      inProgress: progress.filter(row => row.status === 'in-progress').length,
      publishedUnlocked: progress.filter(row => row.status === 'published-unlocked').length,
      locked: progress.filter(row => row.status === 'locked').length,
      sections: sections.map(section => {
        const row = progressBySection.get(section.id)!;
        const subject = state.subjects.find(item => item.id === section.subjectId);
        return { id: section.id, code: section.code, subjectName: subject?.name || 'Chưa có môn học', enrollmentCount: row.enrollmentCount, completedCount: row.completedCount, status: row.status, gradesLocked: section.gradesLocked };
      }).sort((a, b) => a.code.localeCompare(b.code, 'vi')),
    },
    report: {
      completedEnrollments: publishedResults.length,
      passed: passCount,
      failed: failCount,
      passRate: publishedResults.length ? Math.round(passCount / publishedResults.length * 1000) / 10 : null,
    },
    audits,
  };
}
