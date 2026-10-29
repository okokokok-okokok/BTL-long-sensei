import ExcelJS from 'exceljs';
import { PERIOD_TIMES } from './options';
import { catalogEqual } from './directories';
import { parseSemester, sameSemester, semesterLabel } from './semester';
import { PortalError } from './errors';
import type { PortalState, PortalUser } from './types';

export type ScheduleExportScope = 'week' | 'date-range' | 'semester';
export interface ScheduleExportOptions {
  scope: ScheduleExportScope;
  startDate?: string;
  endDate?: string;
  semester?: string;
  assignmentSemester?: string;
  applyFilters?: boolean;
  filters?: { semester?: string; lecturerId?: string; sectionId?: string; room?: string; query?: string };
  targetMeetingId?: string;
  targetDate?: string;
  generatedAt?: Date;
}

interface Occurrence {
  date: string;
  sectionId: string;
  meetingId: string;
}

function dateValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function dateText(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function weekdayLabel(date: Date) {
  const weekday = date.getUTCDay();
  return weekday === 0 ? 'Chủ nhật' : `Thứ ${weekday + 1}`;
}

function timePart(period: number, side: 'start' | 'end') {
  const span = PERIOD_TIMES[period - 1];
  if (!span) return null;
  const [start, end] = span.split('–');
  const value = side === 'start' ? start : end;
  if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60 + minutes) / 1440;
}

function excelDate(value: string) {
  const parsed = dateValue(value);
  return parsed || '';
}

function excelText(value: unknown) {
  // ExcelJS writes ordinary strings into shared strings, never as formula objects.
  return value === null || value === undefined ? '' : String(value);
}

function activeLecturers(state: PortalState): Array<{ key: string; code: string; name: string; faculty: string; department: string; email: string; user?: PortalUser }> {
  const profiles = state.lecturers.filter(row => row.active);
  const profilesByCode = new Map(state.lecturers.map(row => [row.code.trim().toLocaleLowerCase(), row]));
  const output: Array<{ key: string; code: string; name: string; faculty: string; department: string; email: string; user?: PortalUser }> = [];
  const keys = new Set<string>();
  const userFor = (code: string) => state.users.find(user => user.role === 'lecturer' && user.lecturerCode?.toLocaleLowerCase() === code.toLocaleLowerCase());
  for (const profile of profiles) {
    const user = userFor(profile.code);
    const key = profile.code.trim().toLocaleLowerCase() || profile.id;
    if (keys.has(key)) continue;
    keys.add(key);
    output.push({ key, code: profile.code, name: profile.name || user?.name || '', faculty: profile.faculty || user?.faculty || '', department: profile.department || user?.department || '', email: profile.email || user?.email || '', user });
  }
  for (const user of state.users.filter(row => row.role === 'lecturer' && row.active)) {
    const code = user.lecturerCode || '';
    if (code && profilesByCode.get(code.trim().toLocaleLowerCase())?.active === false) continue;
    const key = code.trim().toLocaleLowerCase() || user.id;
    if (keys.has(key)) continue;
    keys.add(key);
    output.push({ key, code, name: user.name, faculty: user.faculty, department: user.department, email: user.email, user });
  }
  return output.sort((a, b) => a.name.localeCompare(b.name, 'vi') || a.code.localeCompare(b.code, 'vi'));
}

function allowedByFilter(state: PortalState, meeting: PortalState['meetings'][number], options: ScheduleExportOptions) {
  if (!options.applyFilters) return true;
  const filters = options.filters || {};
  const section = state.sections.find(row => row.id === meeting.sectionId);
  if (!section) return false;
  if (filters.semester && !sameSemester(section.semester, filters.semester, state.catalogs)) return false;
  if (filters.sectionId && section.id !== filters.sectionId) return false;
  if (filters.lecturerId && section.lecturerId !== filters.lecturerId) return false;
  const subject = state.subjects.find(row => row.id === section.subjectId);
  if (filters.room && !catalogEqual('room', meeting.room, filters.room, state.catalogs)) return false;
  const lecturerName = state.users.find(row => row.id === section.lecturerId)?.name || '';
  const search = filters.query?.trim().toLocaleLowerCase('vi');
  if (search && ![section.code, subject?.name, meeting.room, lecturerName].join(' ').toLocaleLowerCase('vi').includes(search)) return false;
  return true;
}

function occurrencesFor(state: PortalState, options: ScheduleExportOptions): Occurrence[] {
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (options.scope === 'week' || options.scope === 'date-range') {
    rangeStart = dateValue(options.startDate || '');
    rangeEnd = dateValue(options.endDate || '');
    if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) throw new PortalError('Khoảng ngày xuất không hợp lệ.', 400);
    if (options.scope === 'week' && (rangeEnd.getTime() - rangeStart.getTime()) / 86400000 !== 6) throw new PortalError('Phạm vi tuần phải gồm đúng 7 ngày.', 400);
    if (options.scope === 'date-range' && (rangeEnd.getTime() - rangeStart.getTime()) / 86400000 > 365) throw new PortalError('Khoảng ngày xuất tối đa là 366 ngày.', 400);
  } else if (!options.semester?.trim()) {
    throw new PortalError('Vui lòng chọn học kỳ cần xuất.', 400);
  }

  const selectedSemester = options.scope === 'semester' ? options.semester : options.applyFilters ? options.filters?.semester : '';
  const sectionById = new Map(state.sections.map(section => [section.id, section]));
  const found: Occurrence[] = [];
  const seen = new Set<string>();
  for (const meeting of state.meetings) {
    const section = sectionById.get(meeting.sectionId);
    if (!section || !allowedByFilter(state, meeting, options)) continue;
    if (selectedSemester && !sameSemester(section.semester, selectedSemester, state.catalogs)) continue;
    const start = dateValue(meeting.startDate), end = dateValue(meeting.endDate);
    if (!start || !end || start > end || meeting.day < 1 || meeting.day > 7) throw new PortalError(`Lịch ${meeting.id} có ngày hoặc thứ không hợp lệ; cần sửa dữ liệu lịch trước khi xuất.`, 409);
    if (!rangeStart && (end.getTime() - start.getTime()) / 86400000 > 365) throw new PortalError(`Lịch ${meeting.id} có thời hạn hiệu lực dài hơn một năm; hãy rà soát dữ liệu lịch trước khi xuất.`, 409);
    const first = rangeStart && start < rangeStart ? rangeStart : start;
    const last = rangeEnd && end > rangeEnd ? rangeEnd : end;
    for (let day = first; day <= last; day = shiftDate(day, 1)) {
      const weekday = day.getUTCDay() === 0 ? 7 : day.getUTCDay();
      if (weekday !== meeting.day) continue;
      const date = dateText(day);
      const key = [section.id, date, meeting.startPeriod, meeting.endPeriod, meeting.room.trim().toLocaleLowerCase('vi')].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ date, sectionId: section.id, meetingId: meeting.id });
      if (found.length > 50000) throw new PortalError('Phạm vi này tạo ra quá 50.000 buổi học. Hãy thu hẹp khoảng xuất.', 413);
    }
  }
  return found;
}

function scopeLabel(options: ScheduleExportOptions) {
  if (options.scope === 'week') return `Tuần ${options.startDate} – ${options.endDate}`;
  if (options.scope === 'date-range') return `${options.startDate} – ${options.endDate}`;
  const label = semesterLabel(options.semester || '');
  return `${label} · theo khoảng ngày hiệu lực đã lưu cho lịch của các lớp`;
}

function filterLabel(state: PortalState, options: ScheduleExportOptions) {
  if (!options.applyFilters) return 'Toàn bộ lịch trong phạm vi đã chọn';
  const filters = options.filters || {};
  const lecturerName = state.users.find(row => row.id === filters.lecturerId)?.name || '';
  const sectionCode = state.sections.find(row => row.id === filters.sectionId)?.code || '';
  const items = [
    filters.semester ? semesterLabel(filters.semester) : '',
    lecturerName ? `Giảng viên: ${lecturerName}` : '',
    sectionCode ? `Lớp: ${sectionCode}` : '',
    filters.room ? `Phòng: ${filters.room}` : '',
    filters.query ? `Tìm kiếm: ${filters.query}` : '',
  ].filter(Boolean);
  return items.length ? `Theo bộ lọc hiện tại: ${items.join(' · ')}` : 'Theo bộ lọc hiện tại (chưa đặt điều kiện lọc)';
}

export function buildScheduleExportData(state: PortalState, options: ScheduleExportOptions, generatedAt = new Date()) {
  const occurrences = occurrencesFor(state, options);
  const lecturers = activeLecturers(state);
  const sectionById = new Map(state.sections.map(section => [section.id, section]));
  const subjectById = new Map(state.subjects.map(subject => [subject.id, subject]));
  const meetingById = new Map(state.meetings.map(meeting => [meeting.id, meeting]));
  const cohortById = new Map(state.cohorts.map(cohort => [cohort.id, cohort]));
  const studentById = new Map(state.students.map(student => [student.id, student]));
  const enrollmentSummary = new Map<string, { count: number; cohortCodes: Set<string> }>();
  for (const enrollment of state.enrollments) {
    if (enrollment.status !== 'registered') continue;
    const summary = enrollmentSummary.get(enrollment.sectionId) || { count: 0, cohortCodes: new Set<string>() };
    summary.count++;
    const student = studentById.get(enrollment.studentId);
    const cohort = student?.cohortId ? cohortById.get(student.cohortId) : undefined;
    if (cohort) summary.cohortCodes.add(cohort.code);
    enrollmentSummary.set(enrollment.sectionId, summary);
  }
  const parsedFilters = options.filters || {};
  const scheduleRows = occurrences.map(occurrence => {
    const section = sectionById.get(occurrence.sectionId)!;
    const subject = subjectById.get(section.subjectId);
    const meeting = meetingById.get(occurrence.meetingId)!;
    const assignedUser = section.lecturerId ? state.users.find(row => row.id === section.lecturerId) : undefined;
    const assignedProfile = assignedUser?.lecturerCode ? state.lecturers.find(row => row.code.toLocaleLowerCase() === assignedUser.lecturerCode!.toLocaleLowerCase()) : undefined;
    const teacher = assignedUser || assignedProfile ? {
      code: assignedProfile?.code || assignedUser?.lecturerCode || '',
      name: assignedProfile?.name || assignedUser?.name || '',
      email: assignedProfile?.email || assignedUser?.email || '',
      faculty: assignedProfile?.faculty || assignedUser?.faculty || '',
      department: assignedProfile?.department || assignedUser?.department || '',
    } : undefined;
    const registrationSummary = enrollmentSummary.get(section.id);
    const cohortCodes = [...(registrationSummary?.cohortCodes || [])].sort((a, b) => a.localeCompare(b, 'vi'));
    const parsed = parseSemester(section.semester);
    const periodStart = timePart(meeting.startPeriod, 'start');
    const periodEnd = timePart(meeting.endPeriod, 'end');
    return {
      date: occurrence.date,
      section,
      subject,
      meeting,
      teacher,
      cohortCodes,
      parsed,
      periodStart,
      periodEnd,
      enrollmentCount: registrationSummary?.count || 0,
    };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.meeting.startPeriod - b.meeting.startPeriod || (a.teacher?.name || '').localeCompare(b.teacher?.name || '', 'vi') || a.section.code.localeCompare(b.section.code, 'vi'));

  const assignmentSemesters = options.scope === 'semester' ? [options.semester!] : options.assignmentSemester ? [options.assignmentSemester] : options.applyFilters && parsedFilters.semester ? [parsedFilters.semester] : [...new Set(scheduleRows.map(row => row.section.semester))];
  const teacherRows = lecturers.map(lecturer => {
    const assigned = state.sections.filter(section => section.lecturerId === lecturer.user?.id && assignmentSemesters.some(term => sameSemester(section.semester, term, state.catalogs)));
    const courseLabels = [...new Set(assigned.map(section => {
      const subject = subjectById.get(section.subjectId);
      return subject ? `${subject.code} · ${subject.name}` : '';
    }).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
    return { lecturer, assignedCourses: courseLabels };
  });

  let substitution: null | {
    date: string;
    meeting: PortalState['meetings'][number];
    section: PortalState['sections'][number];
    subject: PortalState['subjects'][number] | undefined;
    candidates: Array<{ lecturer: (typeof lecturers)[number]; assignedCourses: string[]; scheduleCheck: string; busyClasses: string }>;
  } = null;
  if (options.targetMeetingId || options.targetDate) {
    const targetDate = dateValue(options.targetDate || '');
    const meeting = meetingById.get(options.targetMeetingId || '');
    const section = meeting ? sectionById.get(meeting.sectionId) : undefined;
    if (!targetDate || !meeting || !section || dateText(targetDate) < meeting.startDate || dateText(targetDate) > meeting.endDate || (targetDate.getUTCDay() || 7) !== meeting.day) {
      throw new PortalError('Buổi cần đối chiếu không tồn tại hoặc không diễn ra vào ngày đã chọn.', 400);
    }
    if (options.scope === 'semester') {
      if (!sameSemester(section.semester, options.semester || '', state.catalogs)) throw new PortalError('Buổi cần đối chiếu không thuộc học kỳ xuất.', 400);
    } else if (dateText(targetDate) < (options.startDate || '') || dateText(targetDate) > (options.endDate || '')) {
      throw new PortalError('Buổi cần đối chiếu nằm ngoài khoảng ngày xuất.', 400);
    }
    const conflicts = new Map<string, Set<string>>();
    for (const other of state.meetings) {
      const otherSection = sectionById.get(other.sectionId);
      if (!otherSection?.lecturerId || other.id === meeting.id ||
        dateText(targetDate) < other.startDate || dateText(targetDate) > other.endDate ||
        other.day !== meeting.day || other.startPeriod > meeting.endPeriod || other.endPeriod < meeting.startPeriod) continue;
      const classes = conflicts.get(otherSection.lecturerId) || new Set<string>();
      classes.add(`${otherSection.code} · tiết ${other.startPeriod}–${other.endPeriod} · ${other.room}`);
      conflicts.set(otherSection.lecturerId, classes);
    }
    substitution = {
      date: dateText(targetDate), meeting, section, subject: subjectById.get(section.subjectId),
      candidates: teacherRows.map(({ lecturer, assignedCourses }) => {
        const busyClasses = [...(conflicts.get(lecturer.user?.id || '') || [])].sort((a, b) => a.localeCompare(b, 'vi'));
        const scheduleCheck = lecturer.user?.id === section.lecturerId ? 'Giảng viên phụ trách buổi này'
          : !lecturer.user ? 'Chưa có tài khoản để đối chiếu'
          : busyClasses.length ? 'Có lịch trùng trên hệ thống' : 'Không thấy lịch trùng trên hệ thống';
        return { lecturer, assignedCourses, scheduleCheck, busyClasses: busyClasses.join('; ') };
      }),
    };
  }

  const dateRange = scheduleRows.length ? `${scheduleRows[0].date} – ${scheduleRows[scheduleRows.length - 1].date}` : scopeLabel(options);
  return { scheduleRows, teacherRows, substitution, scope: scopeLabel(options), dateRange, filters: filterLabel(state, options), generatedAt };
}

function setTextCell(cell: ExcelJS.Cell, value: unknown) {
  cell.value = excelText(value);
  cell.numFmt = '@';
  cell.alignment = { vertical: 'top', wrapText: true };
}

export async function createScheduleWorkbook(state: PortalState, options: ScheduleExportOptions) {
  const report = buildScheduleExportData(state, options, options.generatedAt || new Date());
  if (!report.scheduleRows.length && !report.teacherRows.length) throw new PortalError('Không có buổi học hoặc giảng viên đang hoạt động để xuất trong phạm vi này.', 404);
  const assignmentContext = options.scope === 'semester' ? semesterLabel(options.semester || '') : options.assignmentSemester ? semesterLabel(options.assignmentSemester) : 'các học kỳ có lịch trong phạm vi xuất';
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PTIT · Không gian Giáo vụ';
  workbook.created = report.generatedAt;
  workbook.modified = report.generatedAt;
  workbook.subject = 'Tra cứu thời khóa biểu và giảng viên';
  workbook.title = 'Thời khóa biểu chung';
  workbook.company = 'PTIT';

  const schedule = workbook.addWorksheet('Lịch giảng dạy', { views: [{ state: 'frozen', ySplit: 7 }] });
  const scheduleHeaders = [
    'STT', 'Năm học', 'Học kỳ', 'Ngày học', 'Thứ', 'Mã môn', 'Tên môn', 'Số tín chỉ', 'Mã lớp tín chỉ',
    'Lớp niên khóa có sinh viên đăng ký', 'Khoa/đơn vị phụ trách môn', 'Mã giảng viên phụ trách', 'Giảng viên phụ trách',
    'Khoa giảng viên', 'Đơn vị công tác giảng viên', 'Giảng viên thực tế dạy (dạy thay)', 'Email công việc', 'Tiết bắt đầu', 'Tiết kết thúc', 'Giờ bắt đầu', 'Giờ kết thúc',
    'Phòng', 'Cơ sở/tòa nhà', 'Số sinh viên đăng ký còn hiệu lực', 'Sĩ số tối đa', 'Ngày bắt đầu lịch định kỳ',
    'Ngày kết thúc lịch định kỳ', 'Trạng thái buổi', 'Trạng thái lớp', 'Ghi chú',
  ];
  schedule.mergeCells(1, 1, 1, scheduleHeaders.length);
  schedule.getCell(1, 1).value = 'THỜI KHÓA BIỂU CHUNG · LỊCH GIẢNG DẠY';
  schedule.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  schedule.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B1C31' } };
  schedule.getCell(1, 1).alignment = { vertical: 'middle' };
  schedule.getRow(1).height = 28;
  schedule.mergeCells(2, 1, 2, scheduleHeaders.length);
  schedule.mergeCells(3, 1, 3, scheduleHeaders.length);
  schedule.mergeCells(4, 1, 4, scheduleHeaders.length);
  schedule.mergeCells(6, 1, 6, scheduleHeaders.length);
  setTextCell(schedule.getCell(2, 1), `Phạm vi: ${report.scope}`);
  setTextCell(schedule.getCell(3, 1), `Bộ lọc: ${report.filters}`);
  setTextCell(schedule.getCell(4, 1), `Thời điểm xuất: ${report.generatedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam)`);
  setTextCell(schedule.getCell(6, 1), `Số buổi học thực tế trong phạm vi: ${report.scheduleRows.length}${report.scheduleRows.length ? '' : ' · Không có buổi học trong phạm vi này.'}`);
  setTextCell(schedule.getCell(5, 1), 'Lưu ý: Không có lịch trên hệ thống chưa đồng nghĩa đã xác nhận giảng viên rảnh; cần kiểm tra chuyên môn và xác nhận trước khi phân công. Hệ thống hiện chưa lưu trạng thái nghỉ, học bù hoặc dạy thay theo từng buổi; cột tương ứng được để trống khi chưa có dữ liệu.');
  schedule.mergeCells(5, 1, 5, scheduleHeaders.length);
  schedule.getCell(5, 1).alignment = { wrapText: true, vertical: 'top' };
  schedule.getRow(5).height = 44;
  const headerRow = schedule.getRow(7);
  scheduleHeaders.forEach((header, index) => setTextCell(headerRow.getCell(index + 1), header));
  headerRow.height = 34;
  headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; });

  report.scheduleRows.forEach((item, index) => {
    const row = schedule.addRow([]);
    const parsed = item.parsed;
    const values: unknown[] = [
      index + 1, parsed ? `${parsed.startYear}-${parsed.endYear}` : 'Chưa có thông tin',
      parsed ? semesterLabel(item.section.semester) : item.section.semester, excelDate(item.date), weekdayLabel(dateValue(item.date)!),
      item.subject?.code || '', item.subject?.name || '', item.subject?.credits ?? '', item.section.code,
      item.cohortCodes.join(', '), item.subject?.department || '', item.teacher?.code || '', item.teacher?.name || '',
      item.teacher?.faculty || '', item.teacher?.department || '', '', item.teacher?.email || '', item.meeting.startPeriod, item.meeting.endPeriod, item.periodStart ?? '', item.periodEnd ?? '',
      item.meeting.room, '', item.enrollmentCount, item.section.capacity, excelDate(item.meeting.startDate), excelDate(item.meeting.endDate),
      'Theo lịch định kỳ', item.section.status === 'open' ? 'Mở đăng ký' : item.section.status === 'closed' ? 'Đã đóng' : 'Nháp',
      'Hệ thống chưa quản lý nghỉ/học bù/dạy thay theo từng buổi.',
    ];
    values.forEach((value, column) => {
      const cell = row.getCell(column + 1);
      if ([1, 8, 18, 19, 24, 25].includes(column + 1) && typeof value === 'number') {
        cell.value = value;
        cell.alignment = { vertical: 'top', wrapText: true };
      } else if ([4, 26, 27].includes(column + 1) && value instanceof Date) {
        cell.value = value;
        cell.numFmt = 'dd/mm/yyyy';
      } else if ([20, 21].includes(column + 1) && typeof value === 'number') {
        cell.value = value;
        cell.numFmt = 'hh:mm';
      } else setTextCell(cell, value);
    });
  });
  schedule.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, schedule.rowCount), column: scheduleHeaders.length } };
  schedule.columns = [8, 14, 13, 13, 11, 12, 30, 12, 19, 32, 26, 20, 24, 25, 28, 26, 28, 13, 13, 13, 13, 18, 18, 19, 14, 18, 18, 24, 16, 42].map(width => ({ width }));

  const teachers = workbook.addWorksheet('Giảng viên', { views: [{ state: 'frozen', ySplit: 6 }] });
  const teacherHeaders = ['Mã giảng viên', 'Họ tên', 'Khoa', 'Đơn vị công tác', 'Email công việc', 'Môn có thể giảng dạy (theo dữ liệu chuyên môn)', 'Môn đã được phân công trong học kỳ'];
  teachers.mergeCells(1, 1, 1, teacherHeaders.length);
  teachers.getCell(1, 1).value = 'DANH MỤC GIẢNG VIÊN ĐANG HOẠT ĐỘNG';
  teachers.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  teachers.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B1C31' } };
  teachers.getRow(1).height = 28;
  teachers.mergeCells(2, 1, 2, teacherHeaders.length);
  teachers.mergeCells(3, 1, 3, teacherHeaders.length);
  teachers.mergeCells(5, 1, 5, teacherHeaders.length);
  setTextCell(teachers.getCell(2, 1), `Phạm vi lịch: ${report.scope}`);
  setTextCell(teachers.getCell(3, 1), `Thời điểm xuất: ${report.generatedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam)`);
  setTextCell(teachers.getCell(4, 1), `Năng lực giảng dạy chưa được quản lý thành danh mục trong hệ thống; cột chuyên môn được để trống hoặc ghi “Chưa có thông tin”. Danh sách môn phân công lấy từ lớp tín chỉ có giảng viên được phân công trong ${assignmentContext}.`);
  teachers.mergeCells(4, 1, 4, teacherHeaders.length);
  teachers.getCell(4, 1).alignment = { wrapText: true, vertical: 'top' };
  teachers.getRow(4).height = 42;
  setTextCell(teachers.getCell(5, 1), `Số giảng viên đang hoạt động: ${report.teacherRows.length}${report.teacherRows.length ? '' : ' · Chưa có giảng viên hoạt động.'}`);
  const teacherHeader = teachers.getRow(6);
  teacherHeaders.forEach((header, index) => setTextCell(teacherHeader.getCell(index + 1), header));
  teacherHeader.height = 34;
  teacherHeader.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; });
  report.teacherRows.forEach(({ lecturer, assignedCourses }) => {
    const row = teachers.addRow([]);
    [lecturer.code, lecturer.name, lecturer.faculty || 'Chưa có thông tin', lecturer.department || 'Chưa có thông tin', lecturer.email || 'Chưa có thông tin', 'Chưa có thông tin', assignedCourses.join(', ') || 'Chưa có phân công trong học kỳ phù hợp'].forEach((value, index) => setTextCell(row.getCell(index + 1), value));
  });
  teachers.autoFilter = { from: { row: 6, column: 1 }, to: { row: Math.max(6, teachers.rowCount), column: teacherHeaders.length } };
  teachers.columns = [20, 28, 28, 30, 34, 48, 60].map(width => ({ width }));

  if (report.substitution) {
    const { date, meeting, section, subject, candidates } = report.substitution;
    const comparison = workbook.addWorksheet('Đối chiếu dạy thay', { views: [{ state: 'frozen', ySplit: 7 }] });
    const headers = ['STT', 'Mã giảng viên', 'Họ tên', 'Khoa', 'Đơn vị công tác', 'Email công việc', 'Đối chiếu lịch', 'Lớp trùng giờ', 'Chuyên môn dạy môn này', 'Môn đã được phân công trong học kỳ'];
    comparison.mergeCells(1, 1, 1, headers.length);
    comparison.getCell(1, 1).value = 'ĐỐI CHIẾU GIẢNG VIÊN DẠY THAY';
    comparison.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    comparison.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B1C31' } };
    comparison.getRow(1).height = 28;
    for (let row = 2; row <= 6; row++) comparison.mergeCells(row, 1, row, headers.length);
    const start = PERIOD_TIMES[meeting.startPeriod - 1]?.split('–')[0] || '';
    const end = PERIOD_TIMES[meeting.endPeriod - 1]?.split('–')[1] || '';
    setTextCell(comparison.getCell(2, 1), `Buổi cần dạy thay: ${date} · ${section.code} · ${subject?.code || ''} ${subject?.name || ''} · tiết ${meeting.startPeriod}–${meeting.endPeriod} (${start}–${end}) · phòng ${meeting.room}`);
    const assignedTeacher = report.teacherRows.find(row => row.lecturer.user?.id === section.lecturerId)?.lecturer.name || state.users.find(row => row.id === section.lecturerId)?.name || 'Chưa phân công';
    setTextCell(comparison.getCell(3, 1), `Khoa/đơn vị phụ trách môn: ${subject?.department || 'Chưa có thông tin'} · Giảng viên phụ trách: ${assignedTeacher}`);
    setTextCell(comparison.getCell(4, 1), 'Không thấy lịch trùng trên hệ thống chưa đồng nghĩa giảng viên đã xác nhận rảnh. Khoa hoặc môn từng được phân công không chứng minh đủ chuyên môn dạy thay; cần xác minh và liên hệ trước khi phân công.');
    comparison.getCell(4, 1).alignment = { vertical: 'top', wrapText: true };
    comparison.getRow(4).height = 42;
    setTextCell(comparison.getCell(5, 1), `Phạm vi file: ${report.scope} · ${report.filters}`);
    setTextCell(comparison.getCell(6, 1), `Số giảng viên đang hoạt động: ${candidates.length} · Xuất lúc ${report.generatedAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam)`);
    const header = comparison.getRow(7);
    headers.forEach((label, index) => setTextCell(header.getCell(index + 1), label));
    header.height = 34;
    header.eachCell(cell => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; });
    candidates.forEach(({ lecturer, assignedCourses, scheduleCheck, busyClasses }, index) => {
      const row = comparison.addRow([]);
      [index + 1, lecturer.code, lecturer.name, lecturer.faculty || 'Chưa có thông tin', lecturer.department || 'Chưa có thông tin', lecturer.email || 'Chưa có thông tin', scheduleCheck, busyClasses, 'Chưa có dữ liệu chuyên môn', assignedCourses.join(', ') || 'Chưa có phân công trong học kỳ phù hợp'].forEach((value, column) => {
        if (column === 0) row.getCell(1).value = value;
        else setTextCell(row.getCell(column + 1), value);
      });
    });
    comparison.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, comparison.rowCount), column: headers.length } };
    comparison.columns = [8, 20, 29, 28, 28, 34, 36, 48, 30, 60].map(width => ({ width }));
  }

  return { report, buffer: await workbook.xlsx.writeBuffer() };
}
