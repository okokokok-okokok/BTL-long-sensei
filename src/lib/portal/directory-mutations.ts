import { randomUUID } from 'node:crypto';
import type { Actor, CatalogKind, PortalState } from './types';
import { PortalError } from './errors';
import { catalogEqual, catalogReferenced, directoryKey, requireCatalog } from './directories';
import { CATALOG_KINDS } from './options';

function text(value: unknown, label: string, max = 250) { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new PortalError(`${label} không hợp lệ.`); return value.trim(); }
function active(value: unknown, fallback = true) { if (value === undefined) return fallback; if (typeof value !== 'boolean') throw new PortalError('Trạng thái không hợp lệ.'); return value; }
export function saveDirectory(state: PortalState, actor: Actor, action: string, body: Record<string, unknown>) {
  if (!['admin', 'academic'].includes(actor.role)) throw new PortalError('Không có quyền quản lý danh mục/hồ sơ.', 403);
  if (action === 'catalog.save') {
    const old = body.id ? state.catalogs.find(row => row.id === body.id) : undefined;
    if (body.id && !old) throw new PortalError('Không tìm thấy danh mục.', 404);
    const kind = body.kind as CatalogKind;
    if (!CATALOG_KINDS.some(row => row.value === kind) || (old && old.kind !== kind)) throw new PortalError('Loại danh mục không hợp lệ.');
    let name = kind === 'intake' ? '' : text(body.name, 'Tên danh mục');
    const id = old?.id || randomUUID();
    const parent = kind === 'major' ? requireCatalog(state, 'faculty', body.parentId, old?.parentId ? state.catalogs.find(row => row.id === old.parentId)?.name : undefined).row : null;
    let startYear: number | null = null, endYear: number | null = null;
    if (kind === 'intake') {
      startYear = Number(body.startYear); endYear = Number(body.endYear);
      if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || startYear < 1990 || startYear > 2100 || endYear <= startYear || endYear > 2110) throw new PortalError('Năm tuyển sinh/kết thúc không hợp lệ.');
      name = `${startYear}-${endYear}`;
    }
    if (state.catalogs.some(row => row.id !== id && row.kind === kind && row.parentId === (parent?.id || null) && [row.name, ...row.aliases].some(alias => catalogEqual(kind, alias, name)))) throw new PortalError('Danh mục này đã tồn tại.', 409);
    if (old && catalogReferenced(state, old) && (old.parentId !== (parent?.id || null) || (kind === 'intake' && (old.startYear !== startYear || old.endYear !== endYear)))) throw new PortalError('Danh mục đã có dữ liệu liên quan; không đổi quan hệ khoa/ngành hoặc niên khóa. Hãy tạo mục mới và ngừng hoạt động mục cũ.', 409);
    const aliases = old ? [...new Set([...old.aliases, old.name].filter(value => value !== name))] : [];
    const row = { id, kind, name, code: typeof body.code === 'string' && body.code.trim() ? text(body.code, 'Mã danh mục', 60) : old?.code || id, aliases, parentId: parent?.id || null, active: active(body.active, old?.active ?? true), startYear, endYear };
    if (state.catalogs.some(item => item.id !== id && item.kind === kind && directoryKey(item.code) === directoryKey(row.code))) throw new PortalError('Mã danh mục đã tồn tại.', 409);
    if (old) state.catalogs[state.catalogs.findIndex(item => item.id === id)] = row; else state.catalogs.push(row);
    return id;
  }
  if (action === 'lecturer.save') {
    const old = body.id ? state.lecturers.find(row => row.id === body.id) : undefined;
    if (body.id && !old) throw new PortalError('Không tìm thấy hồ sơ giảng viên.', 404);
    const code = old?.code || text(body.code, 'Mã giảng viên', 60).toUpperCase();
    if (!/^[A-Z0-9._-]+$/i.test(code)) throw new PortalError('Mã giảng viên không hợp lệ.');
    const email = text(body.email, 'Email', 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PortalError('Email không hợp lệ.');
    if (state.lecturers.some(row => row.id !== old?.id && (directoryKey(row.code) === directoryKey(code) || directoryKey(row.email) === directoryKey(email)))) throw new PortalError('Mã hoặc email giảng viên đã tồn tại.', 409);
    const faculty = requireCatalog(state, 'faculty', body.faculty, old?.faculty).value;
    const department = requireCatalog(state, 'department', body.department, old?.department).value;
    const row = { id: old?.id || randomUUID(), code, name: text(body.name, 'Họ tên'), email, faculty, department, active: active(body.active, old?.active ?? true) };
    const linked = state.users.find(user => user.lecturerCode && directoryKey(user.lecturerCode) === directoryKey(code));
    if (linked) {
      if (state.users.some(user => user.id !== linked.id && (directoryKey(user.email) === directoryKey(email) || directoryKey(user.username) === directoryKey(email)))) throw new PortalError('Email đã thuộc tài khoản khác.', 409);
      linked.name = row.name; linked.email = row.email; linked.faculty = row.faculty; linked.department = row.department;
    }
    if (old) state.lecturers[state.lecturers.findIndex(item => item.id === old.id)] = row; else state.lecturers.push(row);
    return row.id;
  }
  throw new PortalError('Thao tác danh mục không hợp lệ.');
}

export function accountProfile(state: PortalState, role: string, body: Record<string, unknown>, old?: PortalState['users'][number]) {
  if (role === 'student') {
    const profile = state.students.find(row => body.studentProfileId ? row.id === body.studentProfileId : typeof body.studentCode === 'string' && directoryKey(row.code) === directoryKey(body.studentCode));
    if (!profile || !profile.name || !profile.email || !profile.faculty || !profile.major || !profile.academicYear) throw new PortalError('Chọn hồ sơ sinh viên có sẵn và đầy đủ thông tin. Hãy tạo/hoàn thiện hồ sơ trước khi cấp tài khoản.', 409);
    if (!profile.active && directoryKey(old?.studentCode || '') !== directoryKey(profile.code)) throw new PortalError('Hồ sơ sinh viên đã ngừng hoạt động.', 409);
    if (state.users.some(user => user.id !== old?.id && user.studentCode && directoryKey(user.studentCode) === directoryKey(profile.code))) throw new PortalError('Hồ sơ sinh viên đã được liên kết với tài khoản khác.', 409);
    return { studentCode: profile.code, lecturerCode: null, name: profile.name, email: profile.email, faculty: profile.faculty, department: '' };
  }
  if (role === 'lecturer') {
    const profile = state.lecturers.find(row => body.lecturerProfileId ? row.id === body.lecturerProfileId : typeof body.lecturerCode === 'string' && directoryKey(row.code) === directoryKey(body.lecturerCode));
    if (!profile || !profile.name || !profile.email || !profile.department) throw new PortalError('Chọn hồ sơ giảng viên có sẵn và đầy đủ thông tin. Hãy tạo/hoàn thiện hồ sơ trước khi cấp tài khoản.', 409);
    if (!profile.active && directoryKey(old?.lecturerCode || '') !== directoryKey(profile.code)) throw new PortalError('Hồ sơ giảng viên đã ngừng hoạt động.', 409);
    if (state.users.some(user => user.id !== old?.id && user.lecturerCode && directoryKey(user.lecturerCode) === directoryKey(profile.code))) throw new PortalError('Hồ sơ giảng viên đã được liên kết với tài khoản khác.', 409);
    if (old && directoryKey(old.lecturerCode || '') !== directoryKey(profile.code) && state.sections.some(section => section.lecturerId === old.id)) throw new PortalError('Cần phân công lại lớp trước khi đổi hồ sơ liên kết giảng viên.', 409);
    return { studentCode: null, lecturerCode: profile.code, name: profile.name, email: profile.email, faculty: profile.faculty, department: profile.department };
  }
  const selectedDepartment = body.department === undefined ? old?.department : body.department;
  const department = selectedDepartment ? requireCatalog(state, 'department', selectedDepartment, old?.department).value : '';
  return { studentCode: null, lecturerCode: null, name: text(body.name, 'Họ tên'), email: text(body.email, 'Email', 200).toLowerCase(), faculty: old?.role === role ? old.faculty : '', department };
}
