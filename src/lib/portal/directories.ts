import type { CatalogEntry, CatalogKind, Cohort, PortalState, Student } from './types';
import { PortalError } from './errors';
import { semesterIdentity, semesterLabel, uniqueSemesterOptions } from './semester';
import { sortChoices } from './choice-order';

export const directoryKey = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function intakeYears(value: string) {
  const years = value.match(/\d{4}/g);
  return years?.length === 2 && Number(years[1]) > Number(years[0]) ? { startYear: Number(years[0]), endYear: Number(years[1]) } : null;
}
export function catalogKey(kind: CatalogKind, value: string) {
  if (kind === 'semester') return semesterIdentity(value);
  const years = kind === 'intake' ? intakeYears(value) : null;
  return years ? `${years.startYear}-${years.endYear}` : directoryKey(value);
}
export function catalogEqual(kind: CatalogKind, a: string, b: string, catalogs?: CatalogEntry[]) {
  if (catalogKey(kind, a) === catalogKey(kind, b)) return true;
  return !!catalogs?.some(row => row.kind === kind && [row.name, ...row.aliases].some(name => catalogKey(kind, name) === catalogKey(kind, a)) && [row.name, ...row.aliases].some(name => catalogKey(kind, name) === catalogKey(kind, b)));
}
function hash(value: string) { let result = 2166136261; for (const char of value) { result ^= char.charCodeAt(0); result = Math.imul(result, 16777619); } return (result >>> 0).toString(16); }
export function findCatalog(state: Pick<PortalState, 'catalogs'>, kind: CatalogKind, value: string, parentId?: string | null) {
  return state.catalogs.find(row => row.kind === kind && (parentId === undefined || row.parentId === parentId) && (row.id === value || [row.name, ...row.aliases].some(name => catalogEqual(kind, name, value))));
}
export function catalogReferenced(state: PortalState, entry: CatalogEntry) {
  const matches = (value: string) => [entry.name, ...entry.aliases].some(name => catalogEqual(entry.kind, name, value));
  if (entry.kind === 'faculty') return state.catalogs.some(row => row.parentId === entry.id) || [...state.students, ...state.cohorts, ...state.users, ...state.lecturers].some(row => matches(row.faculty));
  if (entry.kind === 'major') return [...state.students, ...state.cohorts].some(row => matches(row.major) && findCatalog(state, 'faculty', row.faculty)?.id === entry.parentId);
  if (entry.kind === 'department') return [...state.users, ...state.subjects, ...state.lecturers].some(row => matches(row.department));
  if (entry.kind === 'intake') return state.students.some(row => matches(row.academicYear)) || state.cohorts.some(row => row.startYear === entry.startYear && row.endYear === entry.endYear);
  if (entry.kind === 'semester') return state.sections.some(row => matches(row.semester));
  if (entry.kind === 'degreeSystem') return state.students.some(row => matches(row.degreeSystem || '')) || state.curriculumVersions.some(row => matches(row.degreeSystem));
  return state.meetings.some(row => matches(row.room));
}

// Additive upgrade from existing records. Never rewrite historical fields or reactivate entries.
export function ensureDirectories(state: PortalState, currentSemester?: string) {
  state.catalogs ||= []; state.lecturers ||= [];
  const before = JSON.stringify([state.catalogs, state.lecturers, state.students.map(row => [row.id, row.degreeSystem || ''])]);
  const add = (kind: CatalogKind, raw: string, parentId: string | null = null) => {
    if (!raw?.trim()) return null;
    const existing = findCatalog(state, kind, raw, parentId);
    if (existing) { if (raw !== existing.name && !existing.aliases.includes(raw)) existing.aliases.push(raw); return existing; }
    const years = kind === 'intake' ? intakeYears(raw) : null;
    const name = years ? `${years.startYear}-${years.endYear}` : raw.trim();
    const id = `cat-${kind}-${hash(`${parentId || ''}|${catalogKey(kind, name)}`)}`;
    const row: CatalogEntry = { id, kind, code: id, name, aliases: raw !== name ? [raw] : [], parentId, active: kind !== 'intake' || !!years, startYear: years?.startYear ?? null, endYear: years?.endYear ?? null };
    state.catalogs.push(row); return row;
  };
  for (const row of [...state.students, ...state.cohorts, ...state.users, ...state.lecturers]) if (row.faculty) add('faculty', row.faculty);
  for (const row of [...state.students, ...state.cohorts]) { const faculty = add('faculty', row.faculty); if (row.major && faculty) add('major', row.major, faculty.id); }
  for (const row of [...state.users, ...state.subjects, ...state.lecturers]) if (row.department) add('department', row.department);
  for (const row of state.students) if (row.academicYear) add('intake', row.academicYear);
  for (const student of state.students) {
    if (student.degreeSystem || !student.curriculumId) continue;
    const exactVersion = state.curriculumVersions.find(version => version.id === student.curriculumId);
    const intake = intakeYears(student.academicYear);
    if (exactVersion && intake && catalogEqual('faculty', exactVersion.faculty, student.faculty, state.catalogs)
      && catalogEqual('major', exactVersion.major, student.major, state.catalogs)
      && intake.startYear >= exactVersion.intakeStartYear && intake.startYear <= exactVersion.intakeEndYear) student.degreeSystem = exactVersion.degreeSystem;
  }
  for (const row of state.students) if (row.degreeSystem) add('degreeSystem', row.degreeSystem);
  for (const row of state.curriculumVersions) if (row.degreeSystem) add('degreeSystem', row.degreeSystem);
  for (const row of state.cohorts) add('intake', `${row.startYear}-${row.endYear}`);
  for (const row of state.sections) add('semester', row.semester);
  if (currentSemester?.trim()) add('semester', currentSemester.trim());
  for (const row of state.meetings) add('room', row.room);
  // Suggested upcoming intakes/semesters are defined once here, never in individual screens.
  const year = new Date().getUTCFullYear();
  for (let start = year - 3; start <= year + 1; start++) add('intake', `${start}-${start + 4}`);
  for (const start of [year - 1, year, year + 1]) for (const term of [1, 2]) add('semester', `HK${term} ${start}-${start + 1}`);
  for (const user of state.users.filter(row => row.role === 'lecturer')) {
    if (!user.lecturerCode || !user.name?.trim() || !user.faculty?.trim() || !user.department?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) continue;
    if (!state.lecturers.some(row => directoryKey(row.code) === directoryKey(user.lecturerCode!))) state.lecturers.push({ id: `lecturer-${hash(directoryKey(user.lecturerCode))}`, code: user.lecturerCode, name: user.name, email: user.email, faculty: user.faculty, department: user.department, active: user.active });
  }
  return before !== JSON.stringify([state.catalogs, state.lecturers, state.students.map(row => [row.id, row.degreeSystem || ''])]);
}

export function requireCatalog(state: PortalState, kind: CatalogKind, value: unknown, previous?: string, parentId?: string | null) {
  if (typeof value !== 'string' || !value.trim()) throw new PortalError('Vui lòng chọn giá trị danh mục hợp lệ.');
  const row = findCatalog(state, kind, value, parentId);
  if (!row) throw new PortalError('Giá trị không thuộc danh mục hoặc không đúng quan hệ đã chọn.');
  const unchanged = previous !== undefined && [row.name, ...row.aliases].some(name => catalogEqual(kind, name, previous));
  if (!row.active && !unchanged) throw new PortalError('Danh mục đã ngừng hoạt động; không thể chọn cho bản ghi mới.', 409);
  return { row, value: unchanged ? previous! : row.name };
}

export function academicSelection(state: PortalState, facultyValue: unknown, majorValue: unknown, intakeValue: unknown, old?: Pick<Student, 'faculty' | 'major' | 'academicYear'>) {
  const faculty = requireCatalog(state, 'faculty', facultyValue, old?.faculty);
  const sameFaculty = !!old && catalogEqual('faculty', old.faculty, faculty.value);
  const major = requireCatalog(state, 'major', majorValue, sameFaculty ? old?.major : undefined, faculty.row.id);
  const intake = requireCatalog(state, 'intake', intakeValue, old?.academicYear);
  return { faculty: faculty.value, major: major.value, academicYear: intake.value, intake: intake.row };
}
export function cohortMatches(cohort: Cohort, faculty: string, major: string, academicYear: string, catalogs?: CatalogEntry[]) {
  const years = intakeYears(academicYear);
  return catalogEqual('faculty', cohort.faculty, faculty, catalogs) && catalogEqual('major', cohort.major, major, catalogs) && !!years && cohort.startYear === years.startYear && cohort.endYear === years.endYear;
}
export function catalogChoices(catalogs: CatalogEntry[], kind: CatalogKind, settings: { parentId?: string | null; current?: string; filter?: boolean } = {}) {
  const choices = catalogs.filter(row => row.kind === kind && (settings.parentId === undefined || row.parentId === settings.parentId) && (settings.filter ? row.active : row.active || [row.name, ...row.aliases].some(name => settings.current && catalogEqual(kind, name, settings.current)))).map(row => {
    const current = settings.current && [row.name, ...row.aliases].some(name => catalogEqual(kind, name, settings.current!));
    return { value: current ? settings.current! : row.name, label: (kind === 'intake' && row.startYear ? `Khóa ${row.startYear} · ${row.name}` : kind === 'semester' ? semesterLabel(row.name) : row.name) + (!row.active ? ' (ngừng hoạt động)' : ''), disabled: !settings.filter && !row.active && !current };
  });
  return kind === 'semester' ? uniqueSemesterOptions(choices, catalogs, settings.current) : sortChoices(choices);
}
