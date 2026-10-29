import type { CatalogKind } from './types';
export const CATALOG_KINDS: { value: CatalogKind; label: string }[] = [
  { value: 'faculty', label: 'Khoa' }, { value: 'major', label: 'Ngành' }, { value: 'department', label: 'Đơn vị công tác' },
  { value: 'intake', label: 'Khóa tuyển sinh' }, { value: 'semester', label: 'Học kỳ' }, { value: 'room', label: 'Phòng học' },
  { value: 'degreeSystem', label: 'Hệ đào tạo' },
];
export const ROLE_LABELS = { admin: 'Admin', academic: 'Giáo vụ', lecturer: 'Giảng viên', student: 'Sinh viên' };
export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
export const ACTIVE_OPTIONS = [{ value: 'true', label: 'Đang hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }];
export const SECTION_STATUS_OPTIONS = [{ value: 'draft', label: 'Nháp' }, { value: 'open', label: 'Mở đăng ký' }, { value: 'closed', label: 'Đóng đăng ký' }];
export const SUPPORT_CATEGORY_LABELS = { grade_appeal: 'Phúc khảo điểm', academic_support: 'Hỗ trợ học vụ', account_website: 'Tài khoản & Báo lỗi website', other: 'Yêu cầu khác' };
export const SUPPORT_STATUS_LABELS = { pending: 'Chờ xử lý', in_progress: 'Đang xử lý', closed: 'Đã kết thúc' };
export const SUPPORT_STATUS_OPTIONS = Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
export const DAY_OPTIONS = Array.from({ length: 7 }, (_, index) => ({ value: String(index + 1), label: index === 6 ? 'Chủ nhật' : `Thứ ${index + 2}` }));
export const PERIOD_TIMES = ['07:00–07:50', '07:55–08:45', '08:50–09:40', '09:50–10:40', '10:45–11:35', '11:40–12:30', '13:00–13:50', '13:55–14:45', '14:50–15:40', '15:50–16:40', '16:45–17:35', '17:40–18:30', '18:30–19:20', '19:25–20:15', '20:20–21:10'];
export const PERIOD_OPTIONS = PERIOD_TIMES.map((time, index) => ({ value: String(index + 1), label: `Tiết ${index + 1} · ${time}` }));
export const SECTION_FOCUS_OPTIONS = [{ value: 'unassigned', label: 'Chưa phân công giảng viên' }, { value: 'no-schedule', label: 'Chưa có lịch học' }, { value: 'registered', label: 'Có sinh viên đăng ký' }, { value: 'open', label: 'Đang mở lớp' }, { value: 'no-grades', label: 'Chưa nhập điểm' }, { value: 'grades-incomplete', label: 'Đang nhập / chưa công bố đủ' }, { value: 'ready-to-lock', label: 'Đã công bố đủ, chờ khóa' }];
