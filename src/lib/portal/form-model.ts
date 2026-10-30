import type { PortalView, CatalogKind } from './types';
import { catalogChoices, catalogEqual, cohortMatches, findCatalog, intakeYears } from './directories';
import { ACTIVE_OPTIONS, CATALOG_KINDS, CROSS_PROGRAM_OPTIONS, DAY_OPTIONS, PERIOD_OPTIONS, ROLE_OPTIONS, SECTION_STATUS_OPTIONS } from './options';
import { curriculumOptionsForStudent, curriculumVersionLabel, curriculumVersionMatchesStudent } from './curricula';
import { sortChoices } from './choice-order';

export type Option = { value: string; label: string; disabled?: boolean };
export type Field = { key: string; label: string; type?: string; options?: Option[]; required?: boolean; min?: number; max?: number; disabled?: boolean; placeholder?: string };
export type FormState = { title: string; action: string; fields: Field[]; values: Record<string, unknown> };
const field = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, required: true, ...extra });
const active = field('active', 'Trạng thái', { type: 'select', options: ACTIVE_OPTIONS, placeholder: 'Chọn trạng thái…' });
const value = (form: FormState, key: string) => String(form.values[key] ?? '');
function entityOptions(rows: { id: string; code?: string; name?: string; active?: boolean }[], current: string) {
  return sortChoices(rows.filter(row => row.active !== false || row.id === current).map(row => ({ value: row.id, label: [row.code, row.name].filter(Boolean).join(' · ') + (row.active === false ? ' (ngừng hoạt động)' : '') })));
}
export function getFormFields(data: PortalView, form: FormState): Field[] {
  const v = (key: string) => value(form, key);
  const old = (form.action === 'student.save' ? data.students : form.action === 'cohort.save' ? data.cohorts : form.action === 'lecturer.save' ? data.lecturers : form.action === 'subject.save' ? data.subjects : form.action === 'section.save' ? data.sections : form.action === 'meeting.save' ? data.meetings : []).find(row => row.id === v('id')) as unknown as Record<string, unknown> | undefined;
  const choices = (kind: CatalogKind, key: string = kind, parentId?: string | null) => catalogChoices(data.catalogs, kind, { parentId, current: old && String(old[key] ?? '') === v(key) || kind === 'semester' && findCatalog(data, kind, v(key))?.active ? v(key) : undefined });
  const faculty = findCatalog(data, 'faculty', v('faculty'));
  const academicFields = [field('faculty', 'Khoa', { type: 'select', options: choices('faculty'), placeholder: 'Chọn khoa…' }), field('major', 'Ngành', { type: 'select', options: faculty ? choices('major', 'major', faculty.id) : [], disabled: !faculty, placeholder: 'Chọn ngành…' })];
  if (form.action === 'user.save') {
    const role = v('role'), account = data.users.find(row => row.id === v('id'));
    const fields = [field('username', 'Tên đăng nhập'), field('role', 'Vai trò', { type: 'select', options: ROLE_OPTIONS, placeholder: 'Chọn vai trò…' })];
    if (role === 'student') {
      const current = account?.role === role ? data.students.find(row => row.code.toLowerCase() === account.studentCode?.toLowerCase())?.id || '' : '';
      const rows = data.students.filter(row => !data.users.some(user => user.id !== account?.id && user.studentCode?.toLowerCase() === row.code.toLowerCase()));
      fields.push(field('studentProfileId', 'Hồ sơ sinh viên', { type: 'select', options: entityOptions(rows, current), placeholder: 'Chọn hồ sơ sinh viên…' }), field('studentCode', 'Mã sinh viên', { disabled: true }), field('name', 'Họ tên từ hồ sơ', { disabled: true }), field('email', 'Email từ hồ sơ', { disabled: true }), field('faculty', 'Khoa từ hồ sơ', { disabled: true }), field('classDisplay', 'Lớp niên khóa từ hồ sơ', { disabled: true, required: false }));
    } else if (role === 'lecturer') {
      const current = account?.role === role ? data.lecturers.find(row => row.code.toLowerCase() === account.lecturerCode?.toLowerCase())?.id || '' : '';
      const rows = data.lecturers.filter(row => !data.users.some(user => user.id !== account?.id && user.lecturerCode?.toLowerCase() === row.code.toLowerCase()));
      fields.push(field('lecturerProfileId', 'Hồ sơ giảng viên', { type: 'select', options: entityOptions(rows, current), placeholder: 'Chọn hồ sơ giảng viên…' }), field('lecturerCode', 'Mã giảng viên', { disabled: true }), field('name', 'Họ tên từ hồ sơ', { disabled: true }), field('email', 'Email từ hồ sơ', { disabled: true }), field('department', 'Đơn vị công tác từ hồ sơ', { disabled: true }));
    } else {
      fields.push(field('name', 'Họ và tên'), field('email', 'Email', { type: 'email' }), field('department', 'Đơn vị công tác', { type: 'select', required: false, options: catalogChoices(data.catalogs, 'department', { current: account?.department }), placeholder: 'Chọn đơn vị công tác…' }));
    }
    return [...fields, field('password', account ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu', { type: 'password', required: !account, min: 8, max: 128 }), active];
  }
  if (form.action === 'student.save') {
    const complete = !!faculty && !!v('major') && !!v('academicYear');
    const current = old && v('faculty') === old.faculty && v('major') === old.major && v('academicYear') === old.academicYear ? String(old.cohortId || '') : '';
    const cohorts = data.cohorts.filter(row => cohortMatches(row, v('faculty'), v('major'), v('academicYear'), data.catalogs) || row.id === current);
    const profile = { faculty: v('faculty'), major: v('major'), academicYear: v('academicYear'), degreeSystem: v('degreeSystem') };
    const matching = complete && v('degreeSystem') ? curriculumOptionsForStudent({ curriculumVersions: data.curriculumVersions || [] }, profile) : [];
    const degreeChoices = choices('degreeSystem');
    const assigned = data.curriculumVersions?.find(row => row.id === v('curriculumId'));
    const curricula = assigned && curriculumVersionMatchesStudent(assigned, profile) && !matching.some(row => row.id === assigned.id) ? [...matching, assigned] : matching;
    const curriculumChoices = curricula.map(row => ({ value: row.id, label: `${curriculumVersionLabel(row, data.curriculumPrograms || [])}${row.status !== 'active' ? ' (đã ngừng áp dụng)' : ''}` }));
    if (old && v('curriculumId') && !data.curriculumVersions?.some(row => row.id === v('curriculumId'))) curriculumChoices.push({ value: v('curriculumId'), label: 'Chương trình lịch sử chưa có dữ liệu quản lý (giữ nguyên)' });
    return [field('code', 'Mã sinh viên', { disabled: !!old }), field('name', 'Họ và tên'), field('email', 'Email', { type: 'email' }), ...academicFields, field('academicYear', 'Khóa tuyển sinh', { type: 'select', options: choices('intake', 'academicYear'), placeholder: 'Chọn khóa tuyển sinh…' }), field('degreeSystem', 'Hệ đào tạo', { type: 'select', required: degreeChoices.length > 0, options: degreeChoices, placeholder: 'Chọn hệ đào tạo…' }), field('curriculumId', 'Chương trình đào tạo', { type: 'select', required: false, disabled: !curriculumChoices.length, options: curriculumChoices, placeholder: curriculumChoices.length ? 'Chọn chương trình…' : 'Chưa có chương trình phù hợp' }), field('cohortId', 'Lớp niên khóa', { type: 'select', required: false, disabled: !complete && !current, options: entityOptions(cohorts, current), placeholder: 'Chọn lớp niên khóa…' }), field('dateOfBirth', 'Ngày sinh', { type: 'date', required: false }), field('phone', 'Số điện thoại', { required: false }), field('address', 'Địa chỉ', { required: false }), field('requiredCredits', 'Tín chỉ tốt nghiệp', { type: 'number', min: 1, max: 500 }), active];
  }
  if (form.action === 'cohort.save') return [field('code', 'Mã lớp'), field('name', 'Tên lớp'), ...academicFields, field('intake', 'Khóa tuyển sinh', { type: 'select', options: catalogChoices(data.catalogs, 'intake', { current: old ? `${old.startYear}-${old.endYear}` : undefined }), placeholder: 'Chọn khóa tuyển sinh…' }), active];
  if (form.action === 'lecturer.save') return [field('code', 'Mã giảng viên', { disabled: !!old }), field('name', 'Họ và tên'), field('email', 'Email', { type: 'email' }), academicFields[0], field('department', 'Đơn vị công tác', { type: 'select', options: choices('department'), placeholder: 'Chọn đơn vị công tác…' }), active];
  if (form.action === 'catalog.save') {
    const kind = v('kind') as CatalogKind, entry = data.catalogs.find(row => row.id === v('id'));
    const fields = [field('kind', 'Loại danh mục', { type: 'select', options: CATALOG_KINDS, disabled: !!entry, placeholder: 'Chọn loại danh mục…' }), field('code', 'Mã danh mục', { required: false }), field('name', kind === 'intake' ? 'Niên khóa (tự điền theo năm)' : 'Tên danh mục', { disabled: kind === 'intake' })];
    if (kind === 'major') fields.push(field('parentId', 'Khoa quản lý ngành', { type: 'select', options: data.catalogs.filter(row => row.kind === 'faculty' && (row.active || row.id === entry?.parentId)).map(row => ({ value: row.id, label: row.name + (!row.active ? ' (ngừng hoạt động)' : '') })), placeholder: 'Chọn khoa…' }));
    if (kind === 'intake') fields.push(field('startYear', 'Năm tuyển sinh', { type: 'number', min: 1990, max: 2100 }), field('endYear', 'Năm kết thúc', { type: 'number', min: 1991, max: 2110 }));
    return [...fields, active];
  }
  return form.fields.map(item => {
    if (item.key === 'active') return active;
    if (item.key === 'department') return { ...item, type: 'select', options: choices('department'), placeholder: 'Chọn đơn vị…' };
    if (item.key === 'semester') return { ...item, type: 'select', options: choices('semester'), placeholder: 'Chọn học kỳ…' };
    if (item.key === 'room') return { ...item, type: 'select', options: choices('room'), placeholder: 'Chọn phòng học…' };
    if (item.key === 'day') return { ...item, options: DAY_OPTIONS };
    if (['startPeriod', 'endPeriod'].includes(item.key)) return { ...item, type: 'select', options: PERIOD_OPTIONS.filter(option => item.key !== 'endPeriod' || Number(option.value) >= Number(v('startPeriod') || 1)), placeholder: 'Chọn tiết học…' };
    if (item.key === 'status' && form.action === 'section.save') return { ...item, options: SECTION_STATUS_OPTIONS.map(option => ({ ...option, disabled: option.value === 'open' && (!v('id') || !data.meetings.some(row => row.sectionId === v('id'))) })) };
    if (item.key === 'allowCrossProgram') return { ...item, options: CROSS_PROGRAM_OPTIONS };
    if (item.key === 'subjectId') return { ...item, options: entityOptions(data.subjects, v('subjectId')), placeholder: 'Chọn môn học…' };
    if (item.key === 'lecturerId') return { ...item, options: data.users.filter(user => user.role === 'lecturer' && ((user.active && data.lecturers.some(profile => profile.code === user.lecturerCode && profile.active)) || user.id === (old?.lecturerId || ''))).map(user => ({ value: user.id, label: `${user.lecturerCode} · ${user.name}` + (!user.active || !data.lecturers.find(profile => profile.code === user.lecturerCode)?.active ? ' (ngừng hoạt động)' : '') })), placeholder: 'Chọn giảng viên…' };
    if (item.key === 'studentId') return { ...item, options: entityOptions(data.students, ''), placeholder: 'Chọn sinh viên…' };
    return item;
  });
}

export function updateFormValue(data: PortalView, form: FormState, key: string, next: string): FormState {
  const values = { ...form.values, [key]: next };
  if (key === 'role') Object.assign(values, { studentProfileId: '', lecturerProfileId: '', studentCode: '', lecturerCode: '', faculty: '', department: '', classDisplay: '', name: '', email: '' });
  if (key === 'studentProfileId' || key === 'lecturerProfileId') {
    const profile = key === 'studentProfileId' ? data.students.find(row => row.id === next) : data.lecturers.find(row => row.id === next);
    Object.assign(values, { name: profile?.name || '', email: profile?.email || '', faculty: profile?.faculty || '', studentCode: '', lecturerCode: '', classDisplay: '', department: '' });
    if (profile) {
      if (key === 'studentProfileId') { values.studentCode = profile.code; values.classDisplay = data.cohorts.find(row => row.id === ('cohortId' in profile ? profile.cohortId : ''))?.code || 'Chưa xếp lớp'; }
      else { values.lecturerCode = profile.code; values.department = 'department' in profile ? profile.department : ''; }
      if (!values.username || values._autoUsername) { values.username = profile.code; values._autoUsername = true; }
    }
  }
  if (key === 'username') values._autoUsername = false;
  if (['faculty', 'major', 'academicYear', 'intake'].includes(key) && ['student.save', 'cohort.save'].includes(form.action)) {
    const faculty = findCatalog(data, 'faculty', String(values.faculty || ''));
    if (!faculty || !findCatalog(data, 'major', String(values.major || ''), faculty.id)) values.major = '';
    const cohort = data.cohorts.find(row => row.id === values.cohortId);
    if (cohort && !cohortMatches(cohort, String(values.faculty || ''), String(values.major || ''), String(values.academicYear || ''), data.catalogs)) values.cohortId = '';
    if (form.action === 'student.save' && values.curriculumId) {
      const version = data.curriculumVersions?.find(row => row.id === values.curriculumId);
      if (!version || !curriculumVersionMatchesStudent(version, { faculty: String(values.faculty || ''), major: String(values.major || ''), academicYear: String(values.academicYear || ''), degreeSystem: String(values.degreeSystem || '') })) values.curriculumId = '';
    }
  }
  if (key === 'degreeSystem' && form.action === 'student.save' && values.curriculumId) {
    const version = data.curriculumVersions?.find(row => row.id === values.curriculumId);
    if (!version || !curriculumVersionMatchesStudent(version, { faculty: String(values.faculty || ''), major: String(values.major || ''), academicYear: String(values.academicYear || ''), degreeSystem: next })) values.curriculumId = '';
  }
  if (key === 'intake') { const years = intakeYears(next); values.startYear = years?.startYear ?? ''; values.endYear = years?.endYear ?? ''; }
  if (key === 'kind') { values.parentId = ''; values.startYear = ''; values.endYear = ''; }
  if (key === 'startPeriod' && Number(values.endPeriod || 0) < Number(next)) values.endPeriod = '';
  if (values.kind === 'intake' && ['startYear', 'endYear'].includes(key)) values.name = `${values.startYear || ''}-${values.endYear || ''}`;
  return { ...form, values };
}

export function accountFormValues(data: PortalView, account?: PortalView['users'][number]) {
  const base: Record<string, unknown> = account ? { ...account, _autoUsername: false } : { role: 'student', active: true, _autoUsername: true };
  const student = data.students.find(row => row.code.toLowerCase() === account?.studentCode?.toLowerCase()), lecturer = data.lecturers.find(row => row.code.toLowerCase() === account?.lecturerCode?.toLowerCase());
  const identity = account?.role === 'student' && student ? { name: student.name, email: student.email, faculty: student.faculty, studentCode: student.code } : account?.role === 'lecturer' && lecturer ? { name: lecturer.name, email: lecturer.email, department: lecturer.department, lecturerCode: lecturer.code } : {};
  return { ...base, ...identity, studentProfileId: student?.id || '', lecturerProfileId: lecturer?.id || '', classDisplay: data.cohorts.find(row => row.id === student?.cohortId)?.code || 'Chưa xếp lớp' };
}
