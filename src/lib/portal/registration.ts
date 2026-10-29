import type { Result, Section } from './types';

export function registrationIssue(section: Section, count: number, hasSchedule: boolean, now = Date.now()) {
  if (section.gradesLocked) return 'Bảng điểm đã khóa; cần mở khóa trước khi bổ sung sinh viên.';
  if (section.status !== 'open') return 'Lớp chưa mở đăng ký.';
  if ((section.registrationStart && !Number.isFinite(Date.parse(section.registrationStart))) || (section.registrationEnd && !Number.isFinite(Date.parse(section.registrationEnd)))) return 'Thời hạn đăng ký không hợp lệ.';
  if (!section.lecturerId) return 'Lớp chưa được phân công giảng viên.';
  if (!hasSchedule) return 'Lớp chưa có lịch học.';
  if (section.registrationStart && now < Date.parse(section.registrationStart)) return 'Chưa đến thời gian đăng ký.';
  if (section.registrationEnd && now > Date.parse(section.registrationEnd)) return 'Đã hết thời hạn đăng ký.';
  if (count >= section.capacity) return 'Lớp đã đủ sĩ số.';
  return null;
}

export function cancellationIssue(section: Section, result?: Result, isStudent = true, now = Date.now()) {
  if (section.gradesLocked) return 'Bảng điểm đã khóa.';
  if (result && (result.published || [result.attendance, result.midterm, result.exam].some(value => value !== null))) return 'Đăng ký đã có điểm; không thể hủy.';
  if (isStudent && section.status !== 'open') return 'Lớp đã đóng đăng ký/hủy.';
  if (isStudent && section.registrationStart && now < Date.parse(section.registrationStart)) return 'Chưa đến thời gian đăng ký/hủy.';
  if (isStudent && section.registrationEnd && now > Date.parse(section.registrationEnd)) return 'Đã hết thời hạn đăng ký/hủy.';
  return null;
}
