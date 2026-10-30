import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildScheduleExportData, createScheduleWorkbook } from '../src/lib/portal/schedule-export';
import type { PortalState } from '../src/lib/portal/types';

function fixture(): PortalState {
  return {
    users: [
      { id: 'lecturer-1', username: 'gv1', name: '=HYPERLINK("https://bad")', email: 'gv1@ptit.edu.vn', role: 'lecturer', passwordHash: 'must-not-export', active: true, studentCode: null, lecturerCode: 'GV01', department: 'Bộ môn Mạng', faculty: 'Khoa CNTT', avatarUrl: '' },
      { id: 'lecturer-2', username: 'gv2', name: 'Giảng viên không có lịch', email: 'gv2@ptit.edu.vn', role: 'lecturer', passwordHash: 'must-not-export', active: true, studentCode: null, lecturerCode: 'GV02', department: 'Bộ môn Toán', faculty: 'Khoa Cơ bản', avatarUrl: '' },
      { id: 'lecturer-3', username: 'gv3', name: 'Giảng viên ngừng hoạt động', email: 'gv3@ptit.edu.vn', role: 'lecturer', passwordHash: 'must-not-export', active: true, studentCode: null, lecturerCode: 'GV03', department: '', faculty: '', avatarUrl: '' },
    ],
    cohorts: [{ id: 'cohort-1', code: 'D24CQCN01', name: 'D24CQCN01', major: 'CNTT', faculty: 'Khoa CNTT', startYear: 2024, endYear: 2028, active: true }],
    students: [{ id: 'student-1', code: 'SV01', name: 'Sinh viên', email: 'sv@ptit.edu.vn', cohortId: 'cohort-1', major: 'CNTT', faculty: 'Khoa CNTT', academicYear: '2024-2028', phone: '', address: '', dateOfBirth: '', avatarUrl: '', active: true, legacyGpa: 0, legacyCredits: 0, targetGpa: 3.5, requiredCredits: 140 }],
    subjects: [{ id: 'subject-1', code: 'INT1001', name: '=HYPERLINK("https://bad")', credits: 3, department: 'Khoa CNTT', active: true }],
    sections: [{ id: 'section-1', code: 'INT1001-01', subjectId: 'subject-1', semester: 'HK1 2026-2027', lecturerId: 'lecturer-1', capacity: 40, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' }],
    meetings: [
      { id: 'meeting-1', sectionId: 'section-1', day: 1, startPeriod: 1, endPeriod: 2, startDate: '2026-10-26', endDate: '2026-11-02', room: 'A101' },
      { id: 'meeting-duplicate', sectionId: 'section-1', day: 1, startPeriod: 1, endPeriod: 2, startDate: '2026-10-26', endDate: '2026-11-02', room: 'A101' },
      { id: 'meeting-other-day', sectionId: 'section-1', day: 3, startPeriod: 3, endPeriod: 4, startDate: '2026-10-26', endDate: '2026-11-02', room: 'A102' },
    ],
    enrollments: [
      { id: 'enrolled', sectionId: 'section-1', studentId: 'student-1', status: 'registered', registeredAt: '2026-09-01T00:00:00.000Z' },
      { id: 'cancelled', sectionId: 'section-1', studentId: 'student-1', status: 'cancelled', registeredAt: '2026-09-01T00:00:00.000Z' },
    ],
    results: [], gradeReconciliations: [], audits: [], supportTickets: [], catalogs: [],
    lecturers: [
      { id: 'profile-1', code: 'GV01', name: '=HYPERLINK("https://bad")', email: 'gv1@ptit.edu.vn', faculty: 'Khoa CNTT', department: 'Bộ môn Mạng', active: true },
      { id: 'profile-2', code: 'GV02', name: 'Giảng viên không có lịch', email: 'gv2@ptit.edu.vn', faculty: 'Khoa Cơ bản', department: 'Bộ môn Toán', active: true },
      { id: 'profile-3', code: 'GV03', name: 'Giảng viên ngừng hoạt động', email: 'gv3@ptit.edu.vn', faculty: 'Khoa Cơ bản', department: 'Bộ môn Toán', active: false },
    ],
    curriculumPrograms: [], curriculumVersions: [], curriculumAssignments: [],
  };
}

test('schedule export expands weekly meetings once per actual date and filters cancelled registrations', () => {
  const report = buildScheduleExportData(fixture(), { scope: 'date-range', startDate: '2026-10-26', endDate: '2026-11-02' }, new Date('2026-10-01T00:00:00Z'));
  assert.deepEqual(report.scheduleRows.map(row => row.date), ['2026-10-26', '2026-10-28', '2026-11-02']);
  assert.equal(report.scheduleRows[0].enrollmentCount, 1);
  assert.deepEqual(report.scheduleRows[0].cohortCodes, ['D24CQCN01']);
  assert.equal(report.scheduleRows[0].periodStart, 7 / 24);
  assert.equal(report.scheduleRows[0].periodEnd, (8 * 60 + 45) / 1440);
  assert.equal(report.teacherRows.length, 2);
  assert.deepEqual(report.teacherRows.find(row => row.lecturer.code === 'GV02')?.assignedCourses, []);
});

test('week export defaults to all schedules within the selected seven-day range', () => {
  const report = buildScheduleExportData(fixture(), { scope: 'week', startDate: '2026-10-26', endDate: '2026-11-01' });
  assert.deepEqual(report.scheduleRows.map(row => row.date), ['2026-10-26', '2026-10-28']);
});

test('semester export includes only the selected term and a real XLSX with typed dates and times', async () => {
  const state = fixture();
  state.sections.push({ id: 'section-old', code: 'INT1001-OLD', subjectId: 'subject-1', semester: 'HK2 2025-2026', lecturerId: 'lecturer-2', capacity: 30, status: 'closed', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting-old', sectionId: 'section-old', day: 1, startPeriod: 1, endPeriod: 2, startDate: '2026-10-26', endDate: '2026-10-26', room: 'A202' });
  const { buffer, report } = await createScheduleWorkbook(state, { scope: 'semester', semester: 'HK1 2026-2027', generatedAt: new Date('2026-10-01T00:00:00Z') });
  assert.equal(report.scheduleRows.length, 3);
  assert.equal(report.teacherRows.length, 2);
  const bytes = new Uint8Array(buffer);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ['Lịch giảng dạy', 'Giảng viên']);
  const schedule = workbook.getWorksheet('Lịch giảng dạy')!;
  assert.equal((schedule.views[0] as { ySplit?: number }).ySplit, 7);
  assert.match(schedule.autoFilter as string, /^A7:/);
  assert.ok(schedule.getCell('D8').value instanceof Date);
  assert.equal(schedule.getCell('T8').numFmt, 'hh:mm');
  assert.equal(schedule.getCell('G8').value, '=HYPERLINK("https://bad")');
  assert.equal(schedule.getCell('G8').type, ExcelJS.ValueType.String);
  assert.equal(schedule.getCell('M8').value, '=HYPERLINK("https://bad")');
  assert.equal(schedule.getCell('M8').type, ExcelJS.ValueType.String);
  assert.equal(schedule.getCell('N8').value, 'Khoa CNTT');
  assert.equal(schedule.getCell('O8').value, 'Bộ môn Mạng');
  assert.equal(schedule.getCell('X8').value, 1);
  assert.equal(workbook.getWorksheet('Giảng viên')!.getRow(7).cellCount, 7);
});

test('substitution comparison checks all schedules even when the exported schedule is filtered', async () => {
  const state = fixture();
  state.sections.push({ id: 'section-busy', code: 'MATH-01', subjectId: 'subject-1', semester: 'HK1 2026-2027', lecturerId: 'lecturer-2', capacity: 30, status: 'open', gradesLocked: false, registrationStart: '', registrationEnd: '' });
  state.meetings.push({ id: 'meeting-busy', sectionId: 'section-busy', day: 1, startPeriod: 2, endPeriod: 3, startDate: '2026-10-26', endDate: '2026-11-02', room: 'B201' });
  const options = {
    scope: 'week' as const, startDate: '2026-10-26', endDate: '2026-11-01',
    applyFilters: true, filters: { lecturerId: 'lecturer-1' },
    targetMeetingId: 'meeting-1', targetDate: '2026-10-26',
  };
  const { report, buffer } = await createScheduleWorkbook(state, options);
  assert.equal(report.scheduleRows.length, 2);
  assert.equal(report.substitution?.candidates.find(row => row.lecturer.code === 'GV01')?.scheduleCheck, 'Giảng viên phụ trách buổi này');
  assert.equal(report.substitution?.candidates.find(row => row.lecturer.code === 'GV02')?.scheduleCheck, 'Có lịch trùng trên hệ thống');
  assert.match(report.substitution?.candidates.find(row => row.lecturer.code === 'GV02')?.busyClasses || '', /MATH-01/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(buffer).buffer as ArrayBuffer);
  assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ['Lịch giảng dạy', 'Giảng viên', 'Đối chiếu dạy thay']);
  const comparison = workbook.getWorksheet('Đối chiếu dạy thay')!;
  assert.match(String(comparison.getCell('A2').value), /INT1001-01/);
  const busyRow = comparison.getRows(8, 2)!.find(row => row.getCell(2).value === 'GV02')!;
  assert.equal(busyRow.getCell(7).value, 'Có lịch trùng trên hệ thống');
  assert.equal(busyRow.getCell(9).value, 'Chưa có dữ liệu chuyên môn');
  assert.equal(comparison.autoFilter as string, 'A7:J9');
});

test('substitution comparison rejects a date that is not an occurrence of the selected meeting', () => {
  assert.throws(() => buildScheduleExportData(fixture(), {
    scope: 'week', startDate: '2026-10-26', endDate: '2026-11-01', targetMeetingId: 'meeting-1', targetDate: '2026-10-27',
  }), /Buổi cần đối chiếu không tồn tại/);
});

test('current room filters apply to each meeting, and empty exports report no data', async () => {
  const report = buildScheduleExportData(fixture(), {
    scope: 'date-range', startDate: '2026-10-26', endDate: '2026-11-02', applyFilters: true,
    filters: { semester: 'HK1 2026-2027', room: 'A102' },
  });
  assert.deepEqual(report.scheduleRows.map(row => row.date), ['2026-10-28']);
  await assert.rejects(() => createScheduleWorkbook({
    users: [], cohorts: [], students: [], subjects: [], sections: [], meetings: [], enrollments: [], results: [], gradeReconciliations: [], audits: [], supportTickets: [], catalogs: [], lecturers: [], curriculumPrograms: [], curriculumVersions: [], curriculumAssignments: [],
  }, { scope: 'week', startDate: '2026-10-26', endDate: '2026-11-01' }), /Không có buổi học hoặc giảng viên/);
});
