'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { registrationIssue } from '@/lib/portal/registration';
import { notifyPortalChanged, PORTAL_CHANGED_KEY } from '@/lib/portal-client-events';
import { gradeSummary, studentSummary } from '@/lib/portal/analytics';
import { mondayInVietnam as monday, plusDays } from '@/lib/portal/calendar';
import { ChoiceSelect } from '@/components/ChoiceSelect';
import { catalogChoices, catalogEqual, cohortMatches, findCatalog, intakeYears } from '@/lib/portal/directories';
import { sameSemester, semesterLabel, semesterValue, semesterChoices } from '@/lib/portal/semester';
import { compareVietnamese, sortChoices } from '@/lib/portal/choice-order';
import { ACTIVE_OPTIONS, CATALOG_KINDS, ROLE_LABELS, ROLE_OPTIONS, DAY_OPTIONS, SECTION_STATUS_OPTIONS, SECTION_FOCUS_OPTIONS, PERIOD_TIMES } from '@/lib/portal/options';
import { accountFormValues, getFormFields, updateFormValue, type Field, type FormState } from '@/lib/portal/form-model';
import { CurriculumManagement } from '@/components/CurriculumManagement';
import { AdminAccounts } from '@/components/AdminAccounts';
import { AdminAccountForm } from '@/components/AdminAccountForm';
import { PortalAuditLog } from '@/components/PortalAuditLog';
import type { CatalogKind } from '@/lib/portal/types';
import type { PortalView, Enrollment } from '@/lib/portal/types';

export type Tab = 'overview' | 'users' | 'lecturers' | 'students' | 'cohorts' | 'subjects' | 'curricula' | 'sections' | 'schedule' | 'results' | 'audit' | 'catalogs';
type WorkspaceFilters = { query?: string; faculty?: string; major?: string; intake?: string; cohort?: string; active?: string };
const labels: Record<Tab, string> = { overview: 'Tổng quan', users: 'Tài khoản & phân quyền', lecturers: 'Danh sách giảng viên', students: 'Hồ sơ sinh viên', cohorts: 'Lớp niên khóa', subjects: 'Danh mục môn học', curricula: 'Chương trình đào tạo', sections: 'Lớp tín chỉ', schedule: 'Thời khóa biểu', results: 'Kết quả học tập', audit: 'Nhật ký thay đổi', catalogs: 'Danh mục dùng chung' };
const actionLabels: Record<string, string> = {"user.save":"Cập nhật tài khoản","user.password.reset":"Đặt lại mật khẩu","user.password.change":"Đổi mật khẩu cá nhân","student.save":"Cập nhật hồ sơ sinh viên","student.delete":"Xóa hồ sơ sinh viên","cohort.save":"Cập nhật lớp niên khóa","cohort.delete":"Xóa lớp niên khóa","subject.save":"Cập nhật môn học","subject.delete":"Xóa môn học","section.save":"Cập nhật lớp tín chỉ / phân công","section.delete":"Xóa lớp tín chỉ nháp","meeting.save":"Cập nhật lịch học","meeting.delete":"Xóa lịch học định kỳ","lecturer.delete":"Xóa hồ sơ giảng viên","catalog.delete":"Xóa danh mục","enrollment.add":"Thêm đăng ký","enrollment.cancel":"Hủy đăng ký","result.save":"Lưu điểm","result.batch":"Lưu điểm nhiều dòng","section.lock":"Khóa / mở khóa điểm","curriculum.create":"Tạo bản nháp chương trình","curriculum.version.create":"Tạo phiên bản chương trình","curriculum.draft.save":"Sửa bản nháp chương trình","curriculum.draft.delete":"Xóa bản nháp chương trình","curriculum.publish":"Công bố chương trình","curriculum.retire":"Ngừng áp dụng chương trình"};
actionLabels['user.delete'] = 'Xóa tài khoản';
actionLabels['lecturer.save'] = 'Cập nhật hồ sơ giảng viên';
actionLabels['catalog.save'] = 'Cập nhật danh mục dùng chung';
const deleteActions: Record<string, string> = { 'user.save': 'user.delete', 'student.save': 'student.delete', 'cohort.save': 'cohort.delete', 'subject.save': 'subject.delete', 'section.save': 'section.delete', 'meeting.save': 'meeting.delete', 'lecturer.save': 'lecturer.delete', 'catalog.save': 'catalog.delete' };
const roleLabels = ROLE_LABELS;
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const primary = `${button} bg-primary text-white hover:bg-red-800`;
const secondary = `${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700`;
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-200 dark:bg-slate-950 dark:text-white dark:border-slate-700';
const field = (key: string, label: string, extra: Partial<Field> = {}): Field => ({ key, label, required: true, ...extra });
const activeField = field('active', 'Trạng thái', { type: 'select', options: ACTIVE_OPTIONS });
function Badge({ children, good = true }: { children: React.ReactNode; good?: boolean }) { return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${good ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{children}</span>; }
function Empty({ children = 'Chưa có dữ liệu phù hợp.' }: { children?: React.ReactNode }) { return <div className="py-12 text-center text-slate-500 text-sm">{children}</div>; }
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto"><table className="w-full text-left text-sm portal-table"><thead><tr>{headers.map(h => <th key={h} className="px-4 py-3 bg-slate-50 text-slate-500 font-semibold text-xs whitespace-nowrap dark:bg-slate-800">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody></table></div>; }
const Cell = ({ children }: { children?: React.ReactNode }) => <td className="px-4 py-3 align-top">{children}</td>;
function csv(name: string, rows: unknown[][]) {
  const content = '\uFEFF' + rows.map(row => row.map(value => { const s = String(value ?? ''); return '"' + (/^[=+@-]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function localDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const periodTimes = PERIOD_TIMES;

export function AcademicWorkspace({ initialTab = 'overview', onlyTab, initialSemester = '', initialSection = '', initialFocus = '', initialAction = '', initialReport, initialWeek = '', initialFilters = {} }: { initialTab?: Tab; onlyTab?: Tab; initialSemester?: string; initialSection?: string; initialFocus?: string; initialAction?: string; initialReport?: 'individual' | 'section' | 'system'; initialWeek?: string; initialFilters?: WorkspaceFilters }) {
  const { user, role, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<PortalView | null>(null);
  const [tab, setTab] = useState<Tab>(onlyTab || initialTab);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [query, setQuery] = useState(initialFilters.query || '');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(20);
  const [advancedFilters, setAdvancedFilters] = useState(!!(initialFilters.major || initialFilters.intake || initialFilters.active));
  const [semester, setSemester] = useState(initialSemester);
  const [cohortFilter, setCohortFilter] = useState(initialFilters.cohort || '');
  const [facultyFilter, setFacultyFilter] = useState(initialFilters.faculty || '');
  const [majorFilter, setMajorFilter] = useState(initialFilters.major || '');
  const [intakeFilter, setIntakeFilter] = useState(initialFilters.intake || '');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilters.active || '');
  const [catalogKind, setCatalogKind] = useState<CatalogKind>('faculty');
  const [sectionFilter, setSectionFilter] = useState(initialSection);
  const [studentFilter, setStudentFilter] = useState('');
  const [reportMode, setReportMode] = useState<'individual' | 'section' | 'system'>(role === 'student' ? 'individual' : initialReport || 'section');
  const [week, setWeek] = useState(initialWeek ? monday(initialWeek) : monday());
  const [sectionFocus, setSectionFocus] = useState(initialFocus);
  const [form, setForm] = useState<FormState | null>(null);
  const [roster, setRoster] = useState<{ title: string; rows: { code: string; name: string; cohort: string }[] } | null>(null);
  const [pending, setPending] = useState<Record<string, { attendance: string; midterm: string; exam: string; published: boolean }>>({});
  const [publishSelection, setPublishSelection] = useState<Record<string, boolean>>({});
  const [setupSectionId, setSetupSectionId] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const saving = useRef(false);
  const loadVersion = useRef(0);
  const semesterInitializedFor = useRef('');
  const scheduleSemesterHandled = useRef('');
  const dirty = useRef(false);
  dirty.current = Object.keys(pending).length > 0;
  function changeView(action: () => void) {
    if (dirty.current && !window.confirm('Có điểm chưa lưu. Bỏ các thay đổi và tiếp tục?')) return;
    dirty.current = false; setPending({}); action();
  }
  function clearAcademicFilters() { setQuery(''); setFacultyFilter(''); setMajorFilter(''); setIntakeFilter(''); setCohortFilter(''); setActiveFilter(''); setAdvancedFilters(false); setNotice(null); }
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } };
    const leave = (event: Event) => {
      if (dirty.current && !window.confirm('Có điểm chưa lưu. Bỏ các thay đổi và rời trang?')) { event.preventDefault(); event.stopImmediatePropagation(); }
      else { dirty.current = false; setPending({}); }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element)?.closest?.('a');
      if (anchor && !anchor.hasAttribute('download') && anchor.target !== '_blank' && anchor.href !== window.location.href && !anchor.getAttribute('href')?.startsWith('#')) leave(event);
    };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    const navigate = (event: Event) => { if (!(event as Event & { hashChange?: boolean }).hashChange) leave(event); };
    navigation?.addEventListener('navigate', navigate);
    window.addEventListener('beforeunload', unload); window.addEventListener('ptit:before-navigation', leave); document.addEventListener('click', click, true);
    return () => { navigation?.removeEventListener('navigate', navigate); window.removeEventListener('beforeunload', unload); window.removeEventListener('ptit:before-navigation', leave); document.removeEventListener('click', click, true); };
  }, []);
  const staff = role === 'admin' || role === 'academic';
  const tabs: Tab[] = role === 'admin' ? ['users', 'lecturers', 'students', 'cohorts', 'subjects', 'curricula', 'sections', 'results'] : role === 'academic' ? ['lecturers', 'students', 'cohorts', 'subjects', 'curricula', 'sections', 'results'] : role === 'lecturer' ? ['overview', 'cohorts', 'sections', 'schedule', 'results'] : ['overview', 'students', 'cohorts', 'sections', 'schedule', 'results'];
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      const res = await apiFetch('/api/portal', { cache: 'no-store' }); const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      if (version !== loadVersion.current) return;
      setData(json.data); setNeedsRefresh(false); setNow(Date.now());
    } catch (e) { if (version === loadVersion.current) setNotice({ error: true, text: e instanceof Error ? e.message : 'Không tải được dữ liệu.' }); }
    finally { if (version === loadVersion.current) setLoading(false); }
  }, []);
  useEffect(() => { if (user && !authLoading) { setData(null); setPending({}); load(); } }, [user?.id, authLoading, load]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setReportMode(role === 'student' ? 'individual' : initialReport || 'section'); }, [role, initialReport]);
  useEffect(() => {
    if (role !== 'student' || !user?.id || !data?.studentAcademicCalendar || semesterInitializedFor.current === user.id) return;
    semesterInitializedFor.current = user.id;
    const choices = data.studentAcademicCalendar.actualSemesters;
    const requested = initialSemester ? choices.find(row => sameSemester(row.value, initialSemester, data.catalogs))?.value : '';
    const stored = window.sessionStorage.getItem('ptit:student-semester') || '';
    const preferred = requested || choices.find(row => sameSemester(row.value, stored, data.catalogs))?.value || data.studentAcademicCalendar.defaultSemester;
    if (preferred && preferred !== semester) setSemester(preferred);
    if (!preferred && semester) setSemester('');
  }, [role, user?.id, data, initialSemester, semester]);
  useEffect(() => {
    if (role !== 'lecturer' || !user?.id || !data || semesterInitializedFor.current === user.id) return;
    const choices = semesterChoices(data.sections.map(section => section.semester), data.catalogs);
    const requested = choices.find(row => sameSemester(row.value, initialSemester, data.catalogs))?.value;
    const stored = window.sessionStorage.getItem('ptit:lecturer-semester') || '';
    const preferred = requested
      || choices.find(row => sameSemester(row.value, stored, data.catalogs))?.value
      || choices.find(row => sameSemester(row.value, data.currentSemester || '', data.catalogs))?.value
      || choices.at(-1)?.value
      || '';
    semesterInitializedFor.current = user.id;
    setSemester(preferred);
    const requestedSection = data.sections.find(section => section.id === initialSection && sameSemester(section.semester, preferred, data.catalogs))?.id || '';
    setSectionFilter(current => data.sections.some(section => section.id === current && sameSemester(section.semester, preferred, data.catalogs)) ? current : requestedSection);
  }, [role, user?.id, data, initialSemester, initialSection]);
  useEffect(() => {
    if (role === 'student' && semester) window.sessionStorage.setItem('ptit:student-semester', semesterValue(semester));
  }, [role, semester]);
  useEffect(() => {
    if (role === 'lecturer' && semester) window.sessionStorage.setItem('ptit:lecturer-semester', semesterValue(semester));
  }, [role, semester]);
  useEffect(() => {
    if (!staff || !user?.id || !data || semesterInitializedFor.current === user.id) return;
    const choices = catalogChoices(data.catalogs, 'semester', { filter: true });
    const stored = window.sessionStorage.getItem('ptit:academic-semester') || '';
    const preferred = [initialSemester, stored, data.currentSemester || ''].map(value => choices.find(row => sameSemester(row.value, value, data.catalogs))?.value).find(Boolean) || '';
    semesterInitializedFor.current = user.id;
    setSemester(preferred);
  }, [staff, user?.id, data, initialSemester]);
  useEffect(() => {
    if (!staff || !user?.id || semesterInitializedFor.current !== user.id) return;
    if (semester) window.sessionStorage.setItem('ptit:academic-semester', semester); else window.sessionStorage.removeItem('ptit:academic-semester');
    if (window.location.pathname === '/academic' || window.location.pathname === '/schedule') {
      const url = new URL(window.location.href);
      if (semester) url.searchParams.set('semester', semester); else url.searchParams.delete('semester');
      window.history.replaceState(window.history.state, '', url);
    }
  }, [staff, semester, user?.id]);
  useEffect(() => {
    const restore = () => {
      if (window.location.pathname !== '/academic') return;
      const params = new URLSearchParams(window.location.search);
      const next = params.get('tab') as Tab;
      if (next && [...tabs, 'overview', 'schedule', 'audit', 'catalogs'].includes(next)) setTab(next);
      setSemester(params.get('semester') || '');
      setQuery(params.get('q') || ''); setFacultyFilter(params.get('faculty') || ''); setMajorFilter(params.get('major') || ''); setIntakeFilter(params.get('intake') || ''); setCohortFilter(params.get('cohort') || ''); setActiveFilter(params.get('active') || '');
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (role !== 'lecturer' || tab !== 'schedule' || !data || !semester) return;
    const key = `${user?.id || ''}:${semester}`;
    if (scheduleSemesterHandled.current === key) return;
    scheduleSemesterHandled.current = key;
    const sectionIds = new Set(data.sections.filter(section => catalogEqual('semester', section.semester, semester, data.catalogs)).map(section => section.id));
    const meetings = data.meetings.filter(meeting => sectionIds.has(meeting.sectionId)).sort((a, b) => a.startDate.localeCompare(b.startDate));
    const weekEnd = plusDays(week, 6);
    const weekMatchesSemester = meetings.some(meeting => meeting.startDate <= weekEnd && meeting.endDate >= week);
    if (!weekMatchesSemester) setWeek(meetings[0] ? monday(meetings[0].startDate) : monday());
  }, [role, tab, data, semester, week, user?.id]);
  useEffect(() => {
    if (!staff || window.location.pathname !== '/academic' || !['students', 'results'].includes(tab)) return;
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({ q: query, faculty: facultyFilter, major: majorFilter, intake: intakeFilter, cohort: cohortFilter, active: activeFilter })) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    window.history.replaceState(window.history.state, '', url);
  }, [staff, tab, query, facultyFilter, majorFilter, intakeFilter, cohortFilter, activeFilter]);
  useEffect(() => {
    if (!staff || tab !== 'results' || window.location.pathname !== '/academic') return;
    const url = new URL(window.location.href);
    if (sectionFilter) url.searchParams.set('section', sectionFilter); else url.searchParams.delete('section');
    url.searchParams.set('report', reportMode);
    window.history.replaceState(window.history.state, '', url);
  }, [staff, tab, sectionFilter, reportMode]);
  useEffect(() => { setStudentPage(1); }, [query, facultyFilter, majorFilter, intakeFilter, cohortFilter, activeFilter, studentPageSize]);
  useEffect(() => { setPublishSelection({}); }, [tab, semester, sectionFilter, reportMode]);
  useEffect(() => {
    if (!user || authLoading) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (dirty.current || saving.current) { setNeedsRefresh(true); return; }
      void load();
    };
    const storage = (event: StorageEvent) => { if (event.key === PORTAL_CHANGED_KEY) refresh(); };
    window.addEventListener('focus', refresh); window.addEventListener('storage', storage); document.addEventListener('visibilitychange', refresh);
    const poll = window.setInterval(refresh, 30000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('storage', storage); document.removeEventListener('visibilitychange', refresh); clearInterval(poll); clearInterval(clock); };
  }, [user?.id, authLoading, load]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!form && !roster) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { setForm(null); setRoster(null); } };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [form, roster, busy]);
  async function save(action: string, body: Record<string, unknown>, close = true) {
    if (action === 'student.save' && body.id) {
      const previous = data?.students.find(student => student.id === body.id);
      const nextCurriculumId = String(body.curriculumId || '');
      if (previous && nextCurriculumId !== String(previous.curriculumId || '')) {
        const enrollmentIds = new Set(data?.enrollments.filter(enrollment => enrollment.studentId === previous.id).map(enrollment => enrollment.id) || []);
        const hasHistory = enrollmentIds.size > 0 || !!data?.results.some(result => enrollmentIds.has(result.enrollmentId));
        if (hasHistory) {
          if (!window.confirm('Sinh viên đã có lịch sử đăng ký hoặc điểm. Xác nhận đổi chương trình? Lịch sử điểm và đăng ký sẽ được giữ nguyên.')) return false;
          const reason = window.prompt('Nhập lý do đổi chương trình (bắt buộc):');
          if (!reason?.trim()) { setNotice({ error: true, text: 'Cần nhập lý do để ghi nhật ký đổi chương trình.' }); return false; }
          body = { ...body, curriculumChangeReason: reason.trim() };
        }
      }
    }
    saving.current = true; ++loadVersion.current;
    setBusy(true); setNotice(null);
    try {
      const response = await apiFetch('/api/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, action }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không lưu được dữ liệu.');
      setData(json.data); setLoading(false); setNeedsRefresh(false); setNow(Date.now()); setNotice({ error: false, text: json.message || 'Đã lưu thay đổi.' });
      if (action === 'section.save') setSetupSectionId(json.data.entityId);
      if (action === 'meeting.save') setSetupSectionId(String(body.sectionId));
      notifyPortalChanged();
      if (close) setForm(null);
      return true;
    } catch (e) { setNotice({ error: true, text: e instanceof Error ? e.message : 'Lưu thất bại.' }); if (action.startsWith('enrollment.')) await load(); return false; }
    finally { saving.current = false; setBusy(false); setLoading(false); }
  }
  async function showRoster(kind: 'roster' | 'cohort', id: string, title: string) {
    setBusy(true);
    try {
      const response = await apiFetch(`/api/portal?${kind}=${encodeURIComponent(id)}`); const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      setRoster({ title, rows: json.data.roster });
    } catch (e) { setNotice({ error: true, text: e instanceof Error ? e.message : 'Không tải được danh sách.' }); }
    finally { setBusy(false); }
  }
  const semesters = useMemo(() => role === 'student'
    ? (data?.studentAcademicCalendar?.actualSemesters || []).map(row => ({ value: row.value, label: row.label }))
    : role === 'lecturer'
      ? semesterChoices((data?.sections || []).map(section => section.semester), data?.catalogs, semester)
      : catalogChoices(data?.catalogs || [], 'semester', { filter: true, current: semester }), [data, role, semester]);
  if (!user || authLoading) return null;
  if (loading && !data) return <div className="py-16 text-center text-slate-500">Đang tải dữ liệu đào tạo…</div>;
  if (!data) return <div className="rounded-2xl border bg-white p-8"><p role="alert" className="text-red-700 mb-4">{notice?.text || 'Không tải được dữ liệu.'}</p><button onClick={load} className={primary}>Thử lại</button></div>;
  const search = (values: unknown[]) => values.join(' ').toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
  const subject = (id: string) => data.subjects.find(s => s.id === id);
  const section = (id: string) => data.sections.find(s => s.id === id);
  const cohort = (id: string | null) => data.cohorts.find(c => c.id === id);
  const teacher = (id: string | null) => data.users.find(u => u.id === id);
  const own = data.students.find(s => s.code.toLowerCase() === user.studentCode?.toLowerCase());
  const ownEnrollments = data.enrollments.filter(e => e.studentId === own?.id && e.status === 'registered');
  const selectOptions = (rows: { id: string; name?: string; code?: string }[]) => sortChoices(rows.map(r => ({ value: r.id, label: [r.code, r.name].filter(Boolean).join(' · ') })));
  const subjectOptions = selectOptions(data.subjects);
  const sectionOptions = sortChoices(data.sections.map(s => ({ value: s.id, label: `${s.code} · ${subject(s.subjectId)?.name} · ${semesterLabel(s.semester)}` })));
  const studentOptions = sortChoices(data.students.map(s => ({ value: s.id, label: `${s.code} · ${s.name}` })));
  const ownSummary = own ? studentSummary(data, own.id, semester) : null;
  const visibleSections = data.sections.filter(s => {
    if ((semester && !(role === 'student' ? sameSemester(s.semester, semester, data.catalogs) : catalogEqual('semester', s.semester, semester, data.catalogs))) || !search([s.code, semesterLabel(s.semester), subject(s.subjectId)?.code, subject(s.subjectId)?.name, teacher(s.lecturerId)?.name])) return false;
    const active = data.enrollments.filter(enrollment => enrollment.sectionId === s.id && enrollment.status === 'registered');
    const results = active.map(enrollment => data.results.find(result => result.enrollmentId === enrollment.id));
    const hasAnyGrade = results.some(result => result && [result.attendance, result.midterm, result.exam].some(value => value !== null && value !== undefined));
    const completePublished = active.length > 0 && results.every(result => !!result && result.published && gradeSummary(result).final !== null);
    if (sectionFocus === 'unassigned') return !s.lecturerId;
    if (sectionFocus === 'no-schedule') return !data.meetings.some(meeting => meeting.sectionId === s.id);
    if (sectionFocus === 'registered') return active.length > 0;
    if (sectionFocus === 'open') return s.status === 'open';
    if (sectionFocus === 'no-grades') return active.length > 0 && !hasAnyGrade;
    if (sectionFocus === 'grades-incomplete') return active.length > 0 && hasAnyGrade && !completePublished;
    if (sectionFocus === 'ready-to-lock') return active.length > 0 && completePublished && !s.gradesLocked;
    return true;
  });
  const resultSections = data.sections.filter(s => (staff || (role === 'lecturer' ? s.lecturerId === user.id : ownEnrollments.some(e => e.sectionId === s.id))) && (!semester || (role === 'student' ? sameSemester(s.semester, semester, data.catalogs) : catalogEqual('semester', s.semester, semester, data.catalogs)))).sort((a, b) => compareVietnamese(a.code, b.code));
  const selectedResultSection = resultSections.find(s => s.id === sectionFilter) || resultSections[0];
  const matchesActive = (row: { active: boolean }) => !activeFilter || String(row.active) === activeFilter;
  const matchesAcademic = (row: { faculty: string; major: string; academicYear: string }) => (!facultyFilter || catalogEqual('faculty', row.faculty, facultyFilter, data.catalogs)) && (!majorFilter || catalogEqual('major', row.major, majorFilter, data.catalogs)) && (!intakeFilter || catalogEqual('intake', row.academicYear, intakeFilter, data.catalogs));
  const matchesCohort = (row: PortalView['cohorts'][number]) => matchesAcademic({ ...row, academicYear: row.startYear + '-' + row.endYear });
  const filterFaculty = findCatalog(data, 'faculty', facultyFilter);
  const changeAcademicFilter = (key: 'faculty' | 'major' | 'intake', next: string) => changeView(() => {
    const faculty = key === 'faculty' ? next : facultyFilter;
    let major = key === 'major' ? next : majorFilter;
    const intake = key === 'intake' ? next : intakeFilter;
    const parent = findCatalog(data, 'faculty', faculty);
    if (!parent || !findCatalog(data, 'major', major, parent.id)) major = '';
    setFacultyFilter(faculty); setMajorFilter(major); setIntakeFilter(intake);
    const current = data.cohorts.find(row => row.id === cohortFilter);
    if (current && ((faculty && !catalogEqual('faculty', current.faculty, faculty, data.catalogs)) || (major && !catalogEqual('major', current.major, major, data.catalogs)) || (intake && !catalogEqual('intake', current.startYear + '-' + current.endYear, intake, data.catalogs)))) setCohortFilter('');
  });
  const candidateStudents = data.students.filter(s => matchesAcademic(s) && (!cohortFilter || s.cohortId === cohortFilter));
  const filteredStudents = data.students.filter(s => matchesActive(s) && matchesAcademic(s) && (!cohortFilter || s.cohortId === cohortFilter) && search([s.code, s.name, s.email, cohort(s.cohortId)?.code]));
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const currentStudentPage = Math.min(studentPage, studentPages);
  const selectedStudentId = role === 'student' ? own?.id : candidateStudents.find(s => s.id === studentFilter)?.id || candidateStudents[0]?.id;
  const resultEnrollments = data.enrollments.filter(e => e.status === 'registered' && (!semester || (role === 'student' ? sameSemester(section(e.sectionId)?.semester || '', semester, data.catalogs) : catalogEqual('semester', section(e.sectionId)?.semester || '', semester, data.catalogs))) && (role === 'student' || reportMode === 'individual' ? e.studentId === selectedStudentId : reportMode === 'section' ? e.sectionId === selectedResultSection?.id : true));
  const filteredResultEnrollments = resultEnrollments.filter(e => { const student = data.students.find(s => s.id === e.studentId); return (!student || matchesAcademic(student)) && (!cohortFilter || student?.cohortId === cohortFilter) && search([student?.code, student?.name, section(e.sectionId)?.code, subject(section(e.sectionId)?.subjectId || '')?.name]); });
  const selectedSummary = selectedStudentId ? studentSummary(data, selectedStudentId, semester) : null;
  const completedSource = reportMode === 'section' ? resultEnrollments : filteredResultEnrollments;
  const completed = completedSource.map(e => gradeSummary(data.results.find(r => r.enrollmentId === e.id && r.published))).filter(g => g.final !== null);
  const resultFor = (e: Enrollment) => data.results.find(r => r.enrollmentId === e.id);
  const valuesFor = (e: Enrollment) => { const r = resultFor(e); return pending[e.id] || { attendance: r?.attendance == null ? '' : String(r.attendance), midterm: r?.midterm == null ? '' : String(r.midterm), exam: r?.exam == null ? '' : String(r.exam), published: r?.published || false }; };
  const changeGrade = (e: Enrollment, key: string, value: string | boolean) => setPending(old => ({ ...old, [e.id]: { ...valuesFor(e), [key]: value } }));
  const saveGrades = async (ids: string[], publish = false) => {
    if (!ids.length) return;
    const enrollments = ids.map(id => data.enrollments.find(row => row.id === id)).filter((row): row is Enrollment => !!row);
    if (!publish && enrollments.some(row => resultFor(row)?.published)) { setNotice({ error: true, text: 'Điểm đã công bố cần được cập nhật bằng nút Công bố điểm.' }); return; }
    const rows = enrollments.map(row => ({ enrollmentId: row.id, ...valuesFor(row), published: publish }));
    if (rows.length > 500) { setNotice({ error: true, text: 'Mỗi lần lưu hoặc công bố tối đa 500 dòng. Hãy chọn ít dòng hơn.' }); return; }
    if (publish && rows.some(row => [row.attendance, row.midterm, row.exam].some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 10))) { setNotice({ error: true, text: 'Tất cả sinh viên trong phạm vi công bố phải có đủ điểm hợp lệ từ 0 đến 10.' }); return; }
    if (publish && !window.confirm(`Công bố điểm cho ${rows.length} sinh viên của lớp ${selectedResultSection?.code || ''}?`)) return;
    const ok = await save('result.batch', { rows }, false);
    if (ok) { setPending(old => Object.fromEntries(Object.entries(old).filter(([key]) => !ids.includes(key)))); if (publish) setPublishSelection({}); }
  };
  const withdrawGrades = async () => {
    const ids = Object.keys(publishSelection).filter(id => publishSelection[id]);
    const rows = ids.map(id => data.results.find(row => row.enrollmentId === id));
    if (!ids.length || rows.some((row, index) => !row?.published || !!pending[ids[index]])) { setNotice({ error: true, text: 'Chỉ chọn điểm đã công bố và không có thay đổi chưa lưu để thu hồi.' }); return; }
    if (ids.length > 500) { setNotice({ error: true, text: 'Mỗi lần thu hồi tối đa 500 dòng.' }); return; }
    if (!window.confirm(`Thu hồi công bố điểm của ${ids.length} sinh viên trong lớp ${selectedResultSection?.code || ''}?`)) return;
    const ok = await save('result.batch', { rows: rows.map(row => ({ enrollmentId: row!.enrollmentId, attendance: row!.attendance, midterm: row!.midterm, exam: row!.exam, published: false })) }, false);
    if (ok) setPublishSelection({});
  };
  const toggleLock = (row: PortalView['sections'][number]) => {
    if (dirty.current) { setNotice({ error: true, text: 'Hãy lưu các điểm đang sửa trước khi khóa hoặc mở khóa bảng điểm.' }); return; }
    const count = data.enrollments.filter(e => e.sectionId === row.id && e.status === 'registered').length;
    if (window.confirm((row.gradesLocked ? 'Mở khóa' : 'Khóa') + ' bảng điểm lớp ' + row.code + ' (' + count + ' sinh viên)? ' + (row.gradesLocked ? 'Sau khi mở khóa, Giáo vụ có thể chỉnh sửa điểm.' : 'Sau khi khóa, hệ thống chặn sửa điểm, đăng ký thêm và hủy đăng ký.'))) void save('section.lock', { id: row.id, locked: !row.gradesLocked }, false);
  };
  const registrationReason = (row: PortalView['sections'][number]) => registrationIssue(row, data.sectionCounts[row.id] || 0, data.meetings.some(m => m.sectionId === row.id), now) || (!subject(row.subjectId)?.active ? 'Môn học đã ngừng hoạt động.' : role === 'student' && !own?.active ? 'Hồ sơ sinh viên đã ngừng hoạt động.' : role === 'student' && ownEnrollments.some(e => { const registered = section(e.sectionId); return registered?.subjectId === row.subjectId && sameSemester(registered.semester, row.semester, data.catalogs); }) ? 'Bạn đã đăng ký môn này trong cùng học kỳ.' : null);
  const openForm = (title: string, action: string, fields: Field[], values: object = {}) => { setNotice(null); setForm({ title, action, fields, values: values as Record<string, unknown> }); };
  const openUser = (row?: PortalView['users'][number]) => openForm(row ? 'Cập nhật tài khoản' : 'Tạo tài khoản', 'user.save', [], accountFormValues(data, row));
  const openStudent = (row?: PortalView['students'][number]) => openForm(row ? 'Cập nhật hồ sơ sinh viên' : 'Thêm hồ sơ sinh viên', 'student.save', [], row || { active: true, requiredCredits: 140 });
  const openCohort = (row?: PortalView['cohorts'][number]) => openForm(row ? 'Cập nhật lớp niên khóa' : 'Tạo lớp niên khóa', 'cohort.save', [], row ? { ...row, intake: row.startYear + '-' + row.endYear } : { active: true });
  const openSubject = (row?: PortalView['subjects'][number]) => openForm(row ? 'Cập nhật môn học' : 'Thêm môn học', 'subject.save', [field('code', 'Mã môn'), field('name', 'Tên môn'), field('credits', 'Số tín chỉ', { type: 'number', min: 1, max: 30 }), field('department', 'Khoa/Bộ môn'), activeField], row || { active: true, credits: 3 });
  const openSection = (row?: PortalView['sections'][number]) => openForm(row ? 'Cập nhật lớp & phân công giảng viên' : 'Tạo lớp tín chỉ · Bước 1', 'section.save', [field('code', 'Mã lớp tín chỉ'), field('subjectId', 'Môn học', { type: 'select', options: subjectOptions }), field('semester', 'Học kỳ'), field('lecturerId', 'Giảng viên phụ trách', { type: 'select', required: false, options: data.users.filter(u => u.role === 'lecturer' && u.active).map(u => ({ value: u.id, label: `${u.lecturerCode} · ${u.name}` })) }), field('capacity', 'Sĩ số tối đa', { type: 'number', min: 1, max: 1000 }), field('status', 'Trạng thái đăng ký', { type: 'select', options: SECTION_STATUS_OPTIONS }), field('registrationStart', 'Bắt đầu đăng ký (giờ máy tính)', { type: 'datetime-local', required: false }), field('registrationEnd', 'Hết hạn đăng ký (giờ máy tính)', { type: 'datetime-local', required: false })], row ? { ...row, registrationStart: row.registrationStart ? toLocalTime(row.registrationStart) : '', registrationEnd: row.registrationEnd ? toLocalTime(row.registrationEnd) : '' } : { capacity: 50, status: 'draft', semester: semester || '' });
  const openMeeting = (row?: PortalView['meetings'][number], targetSectionId = sectionFilter) => openForm(row ? 'Điều chỉnh lịch học' : 'Lập lịch học', 'meeting.save', [field('sectionId', 'Lớp tín chỉ', { type: 'select', options: sectionOptions }), field('day', 'Ngày trong tuần', { type: 'select', options: DAY_OPTIONS }), field('startPeriod', 'Tiết bắt đầu', { type: 'number', min: 1, max: 15 }), field('endPeriod', 'Tiết kết thúc', { type: 'number', min: 1, max: 15 }), field('startDate', 'Từ ngày', { type: 'date' }), field('endDate', 'Đến ngày', { type: 'date' }), field('room', 'Phòng học')], row || { sectionId: targetSectionId, day: 1, startPeriod: 1, endPeriod: 3, startDate: '', endDate: '' });
  const openLecturer = (row?: PortalView['lecturers'][number]) => openForm(row ? 'Cập nhật hồ sơ giảng viên' : 'Tạo hồ sơ giảng viên', 'lecturer.save', [], row || { active: true });
  const openCatalog = (row?: PortalView['catalogs'][number]) => openForm(row ? 'Cập nhật danh mục' : 'Thêm danh mục', 'catalog.save', [], row || { kind: catalogKind, active: true });
  const setupSection = section(setupSectionId);
  const readyToOpen = (row: PortalView['sections'][number]) => !!row.lecturerId && data.meetings.some(m => m.sectionId === row.id) && !!subject(row.subjectId)?.active && !row.gradesLocked;
  const openRegistration = (row: PortalView['sections'][number]) => { if (window.confirm('Mở đăng ký lớp ' + row.code + '? Sinh viên được đăng ký khi trong thời hạn và còn chỗ.')) void save('section.save', { ...row, status: 'open' }, false); };
  const register = (id: string) => { if (role === 'student') save('enrollment.add', { sectionId: id }, false); else openForm('Thêm sinh viên vào lớp', 'enrollment.add', [field('studentId', 'Sinh viên', { type: 'select', options: studentOptions })], { sectionId: id }); };
  const openInitialAction = () => {
    if (!staff) return;
    if (initialAction === 'create-student') openStudent();
    else if (initialAction === 'create-cohort') openCohort();
    else if (initialAction === 'create-section') openSection();
    else if (initialAction === 'create-meeting') openMeeting(undefined, initialSection);
    else if (initialAction === 'assign-lecturer') {
      const current = data.sections.filter(row => !semester || catalogEqual('semester', row.semester, semester, data.catalogs));
      openSection(current.find(row => row.id === initialSection) || current.find(row => !row.lecturerId) || current[0]);
    }
  };
  function exportResults() { if (dirty.current) { setNotice({ error: true, text: 'Hãy lưu điểm đang sửa trước khi xuất bảng điểm.' }); return; } csv('ket-qua-hoc-tap.csv', [['Mã sinh viên', 'Họ tên', 'Lớp tín chỉ', 'Môn học', 'Học kỳ', 'Tín chỉ', 'Chuyên cần', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Điểm chữ', 'Công bố'], ...filteredResultEnrollments.map(e => { const st = data!.students.find(s => s.id === e.studentId); const se = section(e.sectionId); const sub = subject(se?.subjectId || ''); const r = resultFor(e); const g = gradeSummary(r); return [st?.code, st?.name, se?.code, sub?.name, se?.semester, sub?.credits, r?.attendance, r?.midterm, r?.exam, g.final, g.letter, r?.published ? 'Đã công bố' : 'Chưa công bố']; })]); }
  const lecturerPageTitle = role === 'lecturer' ? onlyTab === 'sections' ? 'Lớp giảng dạy' : onlyTab === 'schedule' ? 'Lịch giảng dạy' : onlyTab === 'results' ? 'Kết quả lớp' : 'Trang chủ' : onlyTab === 'audit' && role === 'admin' ? 'Nhật ký hệ thống' : onlyTab ? labels[onlyTab] : 'Quản lý đào tạo';
  const pageDescription = role === 'lecturer'
    ? onlyTab === 'sections' ? 'Các lớp học phần được phân công cho bạn.' : onlyTab === 'schedule' ? 'Lịch dạy theo các lớp được phân công.' : onlyTab === 'results' ? 'Xem kết quả của sinh viên trong các lớp được phân công.' : 'Thông tin giảng dạy của bạn.'
    : onlyTab === 'users' ? 'Quản lý tài khoản đăng nhập, liên kết hồ sơ và quyền truy cập.' : onlyTab === 'audit' ? 'Theo dõi các thay đổi đã được hệ thống ghi nhận.' : 'Hồ sơ, lớp học, lịch học và kết quả học tập.';
  return (
    <div className="space-y-6 academic-workspace">
      <WorkspaceAction action={initialAction} onOpen={openInitialAction} />
      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div><p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">PTIT · {roleLabels[role || 'student']}</p><h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{lecturerPageTitle}</h1><p className="mt-2 text-sm text-slate-500">{pageDescription}</p></div>
        <button className={secondary} onClick={() => changeView(() => void load())} disabled={busy || loading}>{loading ? 'Đang tải…' : '↻ Làm mới'}</button>
      </section>
      {role === 'student' && data.studentAcademicCalendar && !data.studentAcademicCalendar.programAssigned && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Hồ sơ của bạn chưa được gán chương trình đào tạo phù hợp. Không chọn chương trình theo ngành hoặc khóa khác; các học kỳ trong bộ lọc lấy từ đăng ký và kết quả thực tế của bạn. Liên hệ Giáo vụ để cập nhật hồ sơ.</div>}
      {notice && <div role={notice.error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.text}</div>}
      {needsRefresh && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">Tự động làm mới đang tạm dừng khi có điểm chưa lưu hoặc đang lưu dữ liệu. Hãy lưu xong rồi bấm Làm mới nếu cần.</div>}
      {staff && setupSection && <section aria-label="Các bước mở đăng ký" className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">Hoàn tất lớp {setupSection.code}</h2><p className="mt-1 text-sm">Tạo lớp → Phân công giảng viên → Lập lịch học → Mở đăng ký.</p></div><button type="button" className="text-sm underline" onClick={() => setSetupSectionId('')}>Ẩn hướng dẫn</button></div><ul className="flex flex-wrap gap-4 text-sm"><li>{setupSection.lecturerId ? '✓ Đã phân công giảng viên' : '○ Chưa phân công giảng viên'}</li><li>{data.meetings.some(m => m.sectionId === setupSection.id) ? '✓ Đã có lịch học' : '○ Chưa có lịch học'}</li><li>{setupSection.status === 'open' ? '✓ Trạng thái mở đăng ký' : '○ Chưa mở đăng ký'}</li></ul><p className="text-sm font-semibold">{registrationIssue(setupSection, data.sectionCounts[setupSection.id] || 0, data.meetings.some(m => m.sectionId === setupSection.id), now) || 'Lớp đủ điều kiện tiếp nhận đăng ký.'}</p><div className="flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => openSection(setupSection)} disabled={busy}>Sửa / Phân công</button><button type="button" className={primary} onClick={() => openMeeting(undefined, setupSection.id)} disabled={busy}>Lập lịch học</button>{setupSection.status !== 'open' && <button type="button" className={primary} onClick={() => openRegistration(setupSection)} disabled={busy || !readyToOpen(setupSection)}>Mở đăng ký</button>}</div></section>}
      {!onlyTab && <nav aria-label="Nghiệp vụ đào tạo" className="flex flex-wrap gap-2 print:hidden">{tabs.map(t => <button key={t} onClick={() => changeView(() => { const params = new URLSearchParams({ tab: t }); if (semester) params.set('semester', semester); window.history.pushState(null, '', `/academic?${params}`); clearAcademicFilters(); setTab(t); setSectionFilter(''); setSectionFocus(''); })} className={`${button} ${tab === t ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'}`}>{t === 'results' && staff ? 'Điểm & kết quả' : labels[t]}</button>)}{staff && <details className="relative"><summary className={`${secondary} cursor-pointer`}>Khác</summary><div className="absolute z-20 w-52 rounded-xl border bg-white p-2 shadow-lg dark:bg-slate-900">{(['audit', 'catalogs'] as Tab[]).map(t => <button key={t} className={`${secondary} w-full`} onClick={() => changeView(() => { const params = new URLSearchParams({ tab: t }); if (semester) params.set('semester', semester); window.history.pushState(null, '', `/academic?${params}`); clearAcademicFilters(); setTab(t); })}>{labels[t]}</button>)}</div></details>}</nav>}
      {tab === 'overview' ? <>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{(staff ? [['Hồ sơ sinh viên', data.students.length], ['Lớp niên khóa', data.cohorts.length], ['Lớp tín chỉ', data.sections.length], ['Kết quả đã công bố', data.results.filter(r => r.published).length]] : role === 'lecturer' ? [['Lớp phụ trách', data.sections.filter(s => s.lecturerId === user.id).length], ['Sinh viên trong lớp', data.students.length], ['Bảng điểm đã công bố', data.results.filter(r => r.published).length], ['Buổi học/tuần', data.meetings.filter(m => section(m.sectionId)?.lecturerId === user.id).length]] : [['Lớp đã đăng ký', ownEnrollments.length], ['GPA từ điểm công bố', ownSummary?.gpa ?? '—'], ['Tín chỉ đạt', ownSummary?.earnedCredits || 0], ['Môn đã có kết quả', ownSummary?.subjects || 0]]).map(([title, value]) => <div key={String(title)} className="rounded-2xl border border-slate-200 bg-white p-5 dark:bg-slate-900 dark:border-slate-800"><div className="text-xs text-slate-500">{title}</div><div className="text-3xl font-bold mt-3">{value}</div></div>)}</div>
        <div className="rounded-2xl bg-white border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800"><h2 className="font-bold text-lg">{staff ? 'Quy trình tổ chức đào tạo' : 'Không gian học tập'}</h2><p className="text-sm text-slate-500 mt-2">{staff ? 'Tạo hồ sơ và lớp niên khóa → tạo môn, lớp tín chỉ → phân công giảng viên → lập lịch → mở đăng ký → nhập, công bố và khóa điểm.' : role === 'lecturer' ? 'Chọn lớp được phân công để xem danh sách, nhập và công bố điểm. Thời khóa biểu cá nhân lấy từ phân công giảng dạy.' : 'Đăng ký các lớp đang mở, theo dõi lịch học cá nhân và xem điểm đã công bố.'}</p><div className="flex flex-wrap gap-3 mt-5">{(staff ? ['students', 'sections', 'schedule', 'results'] : ['sections', 'schedule', 'results']).map(t => <button key={t} className={secondary} onClick={() => changeView(() => setTab(t as Tab))}>{labels[t as Tab]} →</button>)}</div></div>
      </> : tab === 'users' && role === 'admin' ? <AdminAccounts data={data} busy={busy} onCreate={() => openUser()} onEdit={openUser}
        onReset={u => openForm('Đặt lại mật khẩu · ' + u.username, 'user.password.reset', [field('password', 'Mật khẩu mới', { type: 'password', min: 8, max: 128 })], { id: u.id })}
        onToggle={u => { if (window.confirm(`${u.active ? 'Khóa' : 'Mở khóa'} tài khoản ${u.username}? Chỉ thay đổi quyền đăng nhập, không đổi hồ sơ học tập hoặc công tác.`)) void save('user.save', { ...accountFormValues(data, u), active: !u.active }, false); }}
        onDelete={u => { if (window.confirm(`Xóa tài khoản ${u.username}? Chỉ xóa được tài khoản chưa có lịch sử liên quan. Hồ sơ sinh viên/giảng viên được giữ nguyên. Thao tác được ghi nhật ký.`)) void save('user.delete', { id: u.id }, false); }} />
      : tab === 'audit' && staff ? <PortalAuditLog rows={data.audits} labels={actionLabels} />
      : tab === 'curricula' ? (staff ? <CurriculumManagement data={data} onReload={() => void load()} /> : <Empty>Chỉ Giáo vụ và Admin được quản lý chương trình đào tạo.</Empty>) : <>
        <div className="flex flex-wrap gap-3 items-center print:hidden">
          {role === 'lecturer' && ['sections', 'schedule', 'results'].includes(tab) && <label className="text-xs font-medium">Học kỳ<select aria-label="Lọc học kỳ" value={semester} onChange={e => changeView(() => { setSemester(e.target.value); setSectionFilter(''); })} className={`${input} mt-1 block w-64` }><option value="">Tất cả học kỳ</option>{semesters.map(term => <option key={term.value} value={term.value}>{term.label}</option>)}</select></label>}
          {role === 'lecturer' && tab === 'results' && <label className="text-xs font-medium">Lớp giảng dạy<select aria-label="Chọn lớp giảng dạy" value={selectedResultSection?.id || ''} onChange={e => changeView(() => setSectionFilter(e.target.value))} className={`${input} mt-1 block w-72`}><option value="">Chọn lớp…</option>{resultSections.map(section => <option key={section.id} value={section.id}>{section.code} · {subject(section.subjectId)?.name}</option>)}</select></label>}
          <input aria-label="Tìm kiếm" placeholder="Tìm theo mã, tên, lớp…" value={query} onChange={e => setQuery(e.target.value)} className={`${input} max-w-xs`} />
          {role !== 'lecturer' && ['sections', 'schedule', 'results'].includes(tab) && <ChoiceSelect label="Học kỳ" aria-label="Lọc học kỳ" value={semester} onChange={e => changeView(() => { setSemester(e.target.value); setSectionFilter(''); })} className={input} containerClassName="w-64" options={semesters} emptyLabel={role === 'student' && tab === 'sections' ? 'Chọn học kỳ…' : 'Tất cả học kỳ'} />}
          {(['students', 'cohorts', 'lecturers'].includes(tab) || (tab === 'results' && staff && reportMode !== 'section')) && <ChoiceSelect label="Khoa" value={facultyFilter} onChange={e => changeAcademicFilter('faculty', e.target.value)} className={input} containerClassName="w-60" options={catalogChoices(data.catalogs, 'faculty', { filter: true })} emptyLabel="Tất cả khoa" />}
          {((tab === 'cohorts' || (tab === 'students' && advancedFilters)) || (tab === 'results' && staff && reportMode !== 'section')) && <><ChoiceSelect label="Ngành" value={majorFilter} onChange={e => changeAcademicFilter('major', e.target.value)} disabled={!filterFaculty} className={input} containerClassName="w-60" options={filterFaculty ? catalogChoices(data.catalogs, 'major', { filter: true, parentId: filterFaculty.id }) : []} emptyLabel="Tất cả ngành" /><ChoiceSelect label="Khóa tuyển sinh" value={intakeFilter} onChange={e => changeAcademicFilter('intake', e.target.value)} className={input} containerClassName="w-60" options={catalogChoices(data.catalogs, 'intake', { filter: true })} emptyLabel="Tất cả khóa tuyển sinh" /></>}
          {['users', 'lecturers', 'subjects'].includes(tab) && <ChoiceSelect label="Đơn vị công tác" value={departmentFilter} onChange={e => changeView(() => setDepartmentFilter(e.target.value))} className={input} containerClassName="w-60" options={catalogChoices(data.catalogs, 'department', { filter: true })} emptyLabel="Tất cả đơn vị" />}
          {tab === 'users' && <ChoiceSelect label="Vai trò" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={input} options={ROLE_OPTIONS} emptyLabel="Tất cả vai trò" />}
          {['users', 'cohorts', 'lecturers', 'subjects', 'catalogs'].includes(tab) || (tab === 'students' && advancedFilters) ? <ChoiceSelect label="Trạng thái" value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className={input} options={ACTIVE_OPTIONS} emptyLabel="Tất cả trạng thái" /> : null}
          {tab === 'catalogs' && <ChoiceSelect label="Loại danh mục" value={catalogKind} onChange={e => setCatalogKind(e.target.value as CatalogKind)} className={input} options={CATALOG_KINDS} emptyLabel="Tất cả loại danh mục" />}
          {tab === 'sections' && staff && <select aria-label="Lọc tình trạng lớp tín chỉ" value={sectionFocus} onChange={e => setSectionFocus(e.target.value)} className={`${input} max-w-xs`}><option value="">Tất cả tình trạng</option>{SECTION_FOCUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
          {(tab === 'students' || (tab === 'results' && reportMode !== 'section')) && staff && <ChoiceSelect label="Lớp niên khóa" order="label" aria-label="Lọc lớp niên khóa" value={cohortFilter} onChange={e => changeView(() => setCohortFilter(e.target.value))} className={input} containerClassName="w-60" options={data.cohorts.filter(matchesCohort).map(c => ({ value: c.id, label: c.code + (!c.active ? ' (ngừng hoạt động)' : '') }))} emptyLabel="Tất cả lớp niên khóa" />}
          {tab === 'students' && staff && <><button type="button" className={secondary} onClick={() => setAdvancedFilters(!advancedFilters)}>{advancedFilters ? 'Thu bộ lọc' : 'Lọc nâng cao'}</button><button type="button" className={secondary} onClick={() => { setQuery(''); setFacultyFilter(''); setMajorFilter(''); setIntakeFilter(''); setCohortFilter(''); setActiveFilter(''); }}>Xóa bộ lọc</button></>}
          <div className="ml-auto flex gap-2">{tab === 'catalogs' && staff && <button className={primary} onClick={() => openCatalog()}>+ Thêm danh mục</button>}{tab === 'lecturers' && staff && <button className={primary} onClick={() => openLecturer()}>+ Tạo hồ sơ giảng viên</button>}{tab === 'users' && role === 'admin' && <button className={primary} onClick={() => openUser()}>+ Tạo tài khoản</button>}{tab === 'students' && staff && <button className={primary} onClick={() => openStudent()}>+ Thêm hồ sơ</button>}{tab === 'cohorts' && staff && <button className={primary} onClick={() => openCohort()}>+ Tạo lớp niên khóa</button>}{tab === 'subjects' && staff && <button className={primary} onClick={() => openSubject()}>+ Thêm môn học</button>}{tab === 'sections' && staff && <button className={primary} onClick={() => openSection()}>+ Tạo lớp tín chỉ</button>}{tab === 'schedule' && staff && <button className={primary} onClick={() => openMeeting()}>+ Lập lịch</button>}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          {tab === 'users' && (role !== 'admin' ? <Empty>Bạn không có quyền quản lý tài khoản.</Empty> : <Table headers={['Tài khoản', 'Họ tên / Email', 'Vai trò', 'Mã liên kết', 'Trạng thái', 'Thao tác']}>{data.users.filter(u => matchesActive(u) && (!roleFilter || u.role === roleFilter) && (!departmentFilter || catalogEqual('department', u.department, departmentFilter, data.catalogs)) && search([u.username, u.name, u.email, roleLabels[u.role]])).map(u => <tr key={u.id}><Cell><strong>{u.username}</strong></Cell><Cell>{u.name}<div className="text-xs text-slate-500 mt-1">{u.email}</div></Cell><Cell><Badge>{roleLabels[u.role]}</Badge></Cell><Cell>{u.studentCode || u.lecturerCode || '—'}</Cell><Cell><Badge good={u.active}>{u.active ? 'Hoạt động' : 'Đã khóa'}</Badge></Cell><Cell><button className={secondary} onClick={() => openUser(u)}>Sửa / Phân quyền</button><button className={secondary + " mt-2"} onClick={() => openForm("Đặt lại mật khẩu · " + u.username, "user.password.reset", [field("password", "Mật khẩu mới", { type: "password", min: 8, max: 128 })], { id: u.id })}>Đặt lại mật khẩu</button></Cell></tr>)}</Table>)}
          {tab === 'lecturers' && <><Table headers={['Mã giảng viên', 'Họ tên / Email', 'Khoa / Đơn vị', 'Lớp phụ trách', 'Trạng thái', 'Thao tác']}>{data.lecturers.filter(profile => matchesActive(profile) && (!facultyFilter || catalogEqual('faculty', profile.faculty, facultyFilter, data.catalogs)) && (!departmentFilter || catalogEqual('department', profile.department, departmentFilter, data.catalogs)) && search([profile.code, profile.name, profile.email, profile.faculty, profile.department])).map(profile => { const account = data.users.find(user => user.lecturerCode === profile.code); return <tr key={profile.id}><Cell><strong>{profile.code}</strong></Cell><Cell>{profile.name}<div className="mt-1 text-xs text-slate-500">{profile.email}</div></Cell><Cell>{profile.faculty}<div className="mt-1 text-xs text-slate-500">{profile.department}</div></Cell><Cell>{account ? data.sections.filter(section => section.lecturerId === account.id && (!semester || catalogEqual('semester', section.semester, semester, data.catalogs))).length : 'Chưa cấp tài khoản'}</Cell><Cell><Badge good={profile.active}>{profile.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Badge></Cell><Cell>{staff && <button className={secondary} onClick={() => openLecturer(profile)}>Sửa hồ sơ</button>}</Cell></tr>; })}</Table>{!data.lecturers.length && <Empty>Chưa có hồ sơ giảng viên. Tạo hồ sơ trước khi cấp tài khoản.</Empty>}</>}
          {tab === 'catalogs' && staff && <><p className="mb-3 text-sm text-slate-500">Các biểu mẫu và bộ lọc dùng chung danh mục này. Ngừng hoạt động để chặn lựa chọn mới; dữ liệu lịch sử vẫn giữ nguyên.</p><Table headers={['Loại', 'Tên danh mục', 'Quan hệ / Khóa', 'Trạng thái', 'Thao tác']}>{data.catalogs.filter(row => (!catalogKind || row.kind === catalogKind) && matchesActive(row) && search([row.name, row.code, ...row.aliases])).map(row => <tr key={row.id}><Cell>{CATALOG_KINDS.find(kind => kind.value === row.kind)?.label}</Cell><Cell><strong>{row.name}</strong></Cell><Cell>{row.parentId ? data.catalogs.find(parent => parent.id === row.parentId)?.name : row.kind === 'intake' ? row.startYear + '–' + row.endYear : '—'}</Cell><Cell><Badge good={row.active}>{row.active ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Badge></Cell><Cell><button className={secondary} onClick={() => openCatalog(row)}>Sửa danh mục</button></Cell></tr>)}</Table></>}
          {tab === 'students' && <><Table headers={['Mã sinh viên', 'Họ và tên', 'Lớp / Ngành', 'Liên hệ', 'Niên khóa', 'Trạng thái', 'Thao tác']}>{filteredStudents.slice((currentStudentPage - 1) * studentPageSize, currentStudentPage * studentPageSize).map(s => <tr key={s.id}><Cell><strong>{s.code}</strong></Cell><Cell>{s.name}<div className="text-xs text-slate-500 mt-1">{s.dateOfBirth || 'Chưa có ngày sinh'}</div></Cell><Cell>{cohort(s.cohortId)?.code || 'Chưa xếp lớp'}<div className="text-xs text-slate-500 mt-1">{s.major}</div></Cell><Cell>{s.email}<div className="text-xs text-slate-500 mt-1">{s.phone || 'Chưa có số điện thoại'}</div><div className="text-xs text-slate-500 mt-1">{s.address}</div></Cell><Cell>{s.academicYear}</Cell><Cell><Badge good={s.active}>{s.active ? 'Đang học' : 'Ngừng hoạt động'}</Badge></Cell><Cell>{staff ? <button onClick={() => openStudent(s)} className={secondary}>Sửa hồ sơ / Xếp lớp</button> : 'Chỉ xem'}</Cell></tr>)}</Table>{!filteredStudents.length && <Empty />}<div className="flex flex-wrap items-center gap-3 p-4 text-sm"><span>{filteredStudents.length} sinh viên · Trang {currentStudentPage}/{studentPages}</span><label>Số dòng <select value={studentPageSize} onChange={event => setStudentPageSize(Number(event.target.value))} className={input}><option value={20}>20</option><option value={50}>50</option></select></label><button className={secondary} disabled={currentStudentPage <= 1} onClick={() => setStudentPage(currentStudentPage - 1)}>Trước</button><button className={secondary} disabled={currentStudentPage >= studentPages} onClick={() => setStudentPage(currentStudentPage + 1)}>Sau</button></div></>}
          {tab === 'cohorts' && <><Table headers={['Mã lớp', 'Tên / Ngành', 'Khoa', 'Niên khóa', 'Số hồ sơ', 'Trạng thái', 'Thao tác']}>{data.cohorts.filter(c => matchesActive(c) && matchesCohort(c) && search([c.code, c.name, c.major, c.faculty])).map(c => <tr key={c.id}><Cell><strong>{c.code}</strong></Cell><Cell>{c.name}<div className="text-xs text-slate-500 mt-1">{c.major}</div></Cell><Cell>{c.faculty}</Cell><Cell>{c.startYear}–{c.endYear}</Cell><Cell>{data.cohortCounts[c.id] || 0}</Cell><Cell><Badge good={c.active}>{c.active ? 'Hoạt động' : 'Lưu trữ'}</Badge></Cell><Cell><div className="flex flex-wrap gap-2"><button onClick={() => showRoster('cohort', c.id, `Danh sách ${c.code}`)} className={secondary} disabled={busy}>Danh sách</button>{staff && <button onClick={() => openCohort(c)} className={secondary}>Sửa</button>}</div></Cell></tr>)}</Table>{!data.cohorts.length && <Empty />}</>}
          {tab === 'subjects' && <><Table headers={['Mã môn', 'Tên môn', 'Tín chỉ', 'Đơn vị', 'Trạng thái', 'Thao tác']}>{data.subjects.filter(s => matchesActive(s) && (!departmentFilter || catalogEqual('department', s.department, departmentFilter, data.catalogs)) && search([s.code, s.name, s.department])).map(s => <tr key={s.id}><Cell><strong>{s.code}</strong></Cell><Cell>{s.name}</Cell><Cell>{s.credits}</Cell><Cell>{s.department}</Cell><Cell><Badge good={s.active}>{s.active ? 'Hoạt động' : 'Lưu trữ'}</Badge></Cell><Cell>{staff && <button onClick={() => openSubject(s)} className={secondary}>Sửa môn</button>}</Cell></tr>)}</Table>{!data.subjects.length && <Empty />}</>}
          {tab === 'sections' && <>
            <Table headers={role === 'lecturer' ? ['Lớp / Học kỳ', 'Môn học', 'Lịch học', 'Sĩ số', 'Trạng thái lớp', 'Thao tác'] : ['Lớp tín chỉ / Học kỳ', 'Môn học', 'Giảng viên', 'Lịch học', 'Sĩ số', 'Trạng thái', 'Thao tác']}>
              {visibleSections.map(s => {
                const sub = subject(s.subjectId);
                const enrollment = ownEnrollments.find(e => e.sectionId === s.id);
                const meetings = data.meetings.filter(m => m.sectionId === s.id);
                const classReason = registrationIssue(s, data.sectionCounts[s.id] || 0, meetings.length > 0, now);
                const lecturerStatus = s.status === 'draft' ? 'Chuẩn bị' : s.status === 'closed' ? 'Đã đóng đăng ký' : 'Đang nhận đăng ký';
                return <tr key={s.id}>
                  <Cell><strong>{s.code}</strong><div className="mt-1 text-xs text-slate-500">{semesterLabel(s.semester)}</div></Cell>
                  <Cell>{sub?.name}<div className="mt-1 text-xs text-slate-500">{sub?.code} · {sub?.credits} tín chỉ</div></Cell>
                  {role !== 'lecturer' && <Cell>{teacher(s.lecturerId)?.name || 'Chưa phân công'}</Cell>}
                  <Cell>{meetings.length ? meetings.map(m => <div key={m.id} className="mb-2 text-xs">{m.day === 7 ? 'CN' : `Thứ ${m.day + 1}`} · Tiết {m.startPeriod}–{m.endPeriod} · {m.room}<div className="text-slate-500">{m.startDate} → {m.endDate}</div></div>) : <span className="text-amber-700 text-xs">Chưa lập lịch</span>}</Cell>
                  <Cell><strong>{data.sectionCounts[s.id] || 0}/{s.capacity}</strong></Cell>
                  <Cell><Badge good={role === 'lecturer' ? s.status === 'open' : !classReason}>{role === 'lecturer' ? lecturerStatus : s.status === 'draft' ? 'Nháp' : s.status === 'closed' ? 'Đã đóng đăng ký' : classReason ? 'Chưa thể đăng ký' : 'Đang nhận đăng ký'}</Badge>{role !== 'lecturer' && s.gradesLocked && <div className="mt-1 text-xs">🔒 Điểm đã khóa</div>}{role !== 'lecturer' && s.registrationStart && <div className="mt-2 text-xs text-slate-500">Từ: {new Date(s.registrationStart).toLocaleString('vi-VN')}</div>}{role !== 'lecturer' && s.registrationEnd && <div className="mt-2 text-xs text-slate-500">Đến: {new Date(s.registrationEnd).toLocaleString('vi-VN')}</div>}</Cell>
                  <Cell><div className="flex min-w-[150px] flex-wrap gap-2"><button onClick={() => showRoster('roster', s.id, `${role === 'lecturer' ? 'Danh sách sinh viên' : 'Danh sách'} ${s.code}`)} className={secondary} disabled={busy}>{role === 'lecturer' ? 'Danh sách sinh viên' : 'Danh sách lớp'}</button>{role === 'lecturer' && <Link className={`${secondary} text-center`} href={`/lecturer/results?section=${encodeURIComponent(s.id)}&semester=${encodeURIComponent(s.semester)}`}>Kết quả lớp</Link>}{staff && <><Link className={secondary} href={`/academic?${new URLSearchParams({ tab: 'results', section: s.id, semester: s.semester })}`}>Bảng điểm</Link><details className="relative"><summary className={`${secondary} cursor-pointer`}>Thao tác</summary><div className="grid w-48 gap-1 rounded-xl border bg-white p-2 shadow-lg dark:bg-slate-900"><button onClick={() => openSection(s)} className={secondary}>Sửa / Phân công</button><button onClick={() => meetings.length ? openMeeting(meetings[0]) : openMeeting(undefined, s.id)} className={secondary} disabled={busy}>{meetings.length ? 'Sửa lịch học' : 'Lập lịch học'}</button>{s.status !== 'open' && <button onClick={() => openRegistration(s)} className={secondary} disabled={busy || !readyToOpen(s)}>Mở đăng ký</button>}<button onClick={() => register(s.id)} disabled={busy || !!registrationReason(s)} title={registrationReason(s) || undefined} className={secondary}>Thêm sinh viên</button></div></details></>}{role === 'student' && (enrollment ? <button onClick={() => { if (window.confirm('Hủy đăng ký lớp ' + s.code + '?')) void save('enrollment.cancel', { id: enrollment.id }, false); }} disabled={busy || !!data.cancellationIssues[enrollment.id]} title={data.cancellationIssues[enrollment.id] || undefined} className={secondary}>Đã đăng ký · Hủy</button> : <button onClick={() => register(s.id)} disabled={busy || !!registrationReason(s)} title={registrationReason(s) || undefined} className={primary}>{registrationReason(s) ? 'Chưa thể đăng ký' : 'Đăng ký lớp'}</button>)}{role === 'student' && <p className="max-w-[240px] text-xs font-medium text-amber-800 dark:text-amber-300">{enrollment ? data.cancellationIssues[enrollment.id] : registrationReason(s)}</p>}</div></Cell>
                </tr>;
              })}
            </Table>
            {!visibleSections.length && <Empty />}
          </>}
          {tab === 'schedule' && <ScheduleView data={data} staff={staff} userId={user.id} role={role || 'student'} ownSectionIds={ownEnrollments.map(e => e.sectionId)} week={week} setWeek={setWeek} semester={semester} query={query} initialSectionId={initialSection} openMeeting={openMeeting} />}
          {tab === 'results' && <div>
            <div className="p-4 border-b border-slate-100 space-y-4 dark:border-slate-800">
              {(role === 'lecturer' || (staff && reportMode === 'section')) && selectedResultSection && <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800"><div className="flex flex-wrap items-baseline gap-x-4 gap-y-1"><strong className="text-base">{selectedResultSection.code}</strong><span>{subject(selectedResultSection.subjectId)?.code} · {subject(selectedResultSection.subjectId)?.name}</span><span>{subject(selectedResultSection.subjectId)?.credits} tín chỉ</span><span>{semesterLabel(selectedResultSection.semester)}</span><span>Sĩ số: {data.sectionCounts[selectedResultSection.id] || 0}</span></div></div>}
              <div className="flex flex-wrap gap-3 items-center print:hidden">
                {staff && <select className={`${input} max-w-xs`} aria-label="Phạm vi báo cáo" value={reportMode} onChange={e => changeView(() => { setReportMode(e.target.value as typeof reportMode); setFacultyFilter(''); setMajorFilter(''); setIntakeFilter(''); setCohortFilter(''); })}><option value="section">Nhập điểm theo lớp</option><option value="individual">Tra cứu sinh viên</option><option value="system">Báo cáo toàn hệ thống</option></select>}
                {staff && reportMode === 'section' && <ChoiceSelect label="Lớp học phần" order="label" aria-label="Chọn lớp học phần" value={selectedResultSection?.id || ''} onChange={e => changeView(() => setSectionFilter(e.target.value))} className={input} containerClassName="w-96" options={resultSections.map(section => ({ value: section.id, label: section.code + ' · ' + subject(section.subjectId)?.name }))} emptyLabel="Chọn lớp học phần…" required />}
                {reportMode === 'individual' && role !== 'student' && <ChoiceSelect label="Sinh viên" order="label" aria-label="Chọn sinh viên" value={selectedStudentId || ''} onChange={e => changeView(() => setStudentFilter(e.target.value))} className={input} containerClassName="w-96" options={candidateStudents.map(student => ({ value: student.id, label: student.code + ' · ' + student.name }))} emptyLabel="Chọn sinh viên…" />}
                {staff && reportMode === 'section' && selectedResultSection && <button type="button" disabled={busy} className={secondary} onClick={() => toggleLock(selectedResultSection)}>{selectedResultSection.gradesLocked ? 'Mở khóa bảng điểm' : 'Khóa bảng điểm'}</button>}<button onClick={exportResults} className={secondary}>Xuất CSV</button><button onClick={() => window.print()} className={secondary}>In bảng điểm</button>
                {staff && reportMode === 'section' && selectedResultSection && !selectedResultSection.gradesLocked && <><button disabled={busy || !Object.keys(pending).length} className={secondary} onClick={() => saveGrades(Object.keys(pending))}>Lưu nháp ({Object.keys(pending).length})</button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={resultEnrollments.length > 0 && resultEnrollments.every(row => publishSelection[row.id])} onChange={event => setPublishSelection(event.target.checked ? Object.fromEntries(resultEnrollments.map(row => [row.id, true])) : {})} />Chọn cả lớp</label><button disabled={busy || !Object.values(publishSelection).some(Boolean)} className={primary} onClick={() => saveGrades(Object.keys(publishSelection).filter(id => publishSelection[id]), true)}>Công bố điểm ({Object.values(publishSelection).filter(Boolean).length})</button><button disabled={busy || !Object.values(publishSelection).some(Boolean)} className={secondary} onClick={() => void withdrawGrades()}>Thu hồi công bố</button></>}
              </div>
              <p className="text-xs text-slate-500">Trọng số: chuyên cần 10% · giữa kỳ 30% · cuối kỳ 60%. Làm tròn tổng kết 1 chữ số. GPA theo tín chỉ, chọn lần học có điểm cao nhất của mỗi môn trong phạm vi đang xem.</p>
              {staff && reportMode === 'section' && <p className="text-xs text-slate-500">Lưu nháp áp dụng cho điểm chưa công bố. Để cập nhật điểm đã công bố, chọn sinh viên và xác nhận công bố lại.</p>}
              {(role === 'student' || reportMode === 'individual') && <div className="flex flex-wrap gap-3">{[['GPA (thang 4)', selectedSummary?.gpa ?? '—'], ['Tín chỉ đạt', selectedSummary?.earnedCredits || 0], ['Môn có điểm công bố', selectedSummary?.subjects || 0]].map(([name, value]) => <div key={String(name)} className="rounded-xl bg-slate-50 px-5 py-3 dark:bg-slate-800"><div className="text-xs text-slate-500">{name}</div><strong className="text-xl">{value}</strong></div>)}</div>}
              {role !== 'student' && reportMode !== 'individual' && <div className="flex flex-wrap gap-3 text-sm"><Badge>{reportMode === 'section' ? 'Sĩ số lớp' : 'Lượt đăng ký'}: {reportMode === 'section' ? resultEnrollments.length : filteredResultEnrollments.length}</Badge><Badge>Đã công bố đủ điểm: {completed.length}/{reportMode === 'section' ? resultEnrollments.length : filteredResultEnrollments.length}</Badge><Badge>Đạt: {completed.filter(g => g.passed).length}/{completed.length} đã công bố</Badge><Badge good={false}>Chưa đạt: {completed.filter(g => g.passed === false).length}/{completed.length}</Badge><Badge>Tỷ lệ đạt: {completed.length ? `${(completed.filter(g => g.passed).length / completed.length * 100).toFixed(1)}% trên kết quả đã công bố` : 'Chưa có dữ liệu'}</Badge></div>}
              {role === 'student' && own && <p className="text-xs text-slate-500">Chỉ hiển thị điểm đã công bố. Số liệu tổng hợp cũ được giữ riêng: GPA {own.legacyGpa.toFixed(2)}, {own.legacyCredits} tín chỉ; không cộng vào kết quả mới để tránh tính trùng khi thiếu lịch sử học phần.</p>}
              {selectedResultSection?.gradesLocked && reportMode === 'section' && <p className="text-sm font-semibold text-amber-700">🔒 Bảng điểm đã khóa. {staff ? 'Có thể mở khóa bằng nút phía trên.' : 'Liên hệ Giáo vụ nếu cần xử lý.'}</p>}
            </div>
            <Table headers={role === 'lecturer' ? ['STT', 'Mã sinh viên', 'Họ tên', 'Lớp niên khóa', 'Chuyên cần', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Điểm chữ', 'Trạng thái'] : staff && reportMode === 'section' ? ['Sinh viên', 'Chuyên cần', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Điểm chữ', 'Chọn công bố', 'Trạng thái', 'Thao tác'] : ['Sinh viên', 'Lớp / Môn / Học kỳ', 'Chuyên cần', 'Giữa kỳ', 'Cuối kỳ', 'Tổng kết', 'Điểm chữ', 'Công bố', 'Thao tác']}>
              {filteredResultEnrollments.map((e, index) => {
                const st = data.students.find(s => s.id === e.studentId); const se = section(e.sectionId)!; const sub = subject(se.subjectId); const r = resultFor(e); const g = gradeSummary(r); const values = valuesFor(e);
                const editable = staff && reportMode === 'section' && !se.gradesLocked;
                return <tr key={e.id} className={pending[e.id] ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}>
                  {role === 'lecturer' && <Cell>{index + 1}</Cell>}
                  <Cell><strong>{st?.code}</strong>{role !== 'lecturer' && <><div className="mt-1 text-xs">{st?.name}</div><div className="mt-1 text-xs text-slate-500">{cohort(st?.cohortId || '')?.code}</div></>}</Cell>
                  {role === 'lecturer' && <Cell>{st?.name}</Cell>}
                  {role === 'lecturer' && <Cell>{cohort(st?.cohortId || '')?.code || '—'}</Cell>}
                  {role !== 'lecturer' && !(staff && reportMode === 'section') && <Cell>{se.code}<div className="mt-1 text-xs text-slate-500">{sub?.name} · {sub?.credits} TC</div><div className="mt-1 text-xs text-slate-500">{semesterLabel(se.semester)}</div></Cell>}
                  {(['attendance', 'midterm', 'exam'] as const).map(k => <Cell key={k}>{editable ? <input type="number" min="0" max="10" step="0.01" aria-label={`${st?.code} ${k}`} className={`${input} min-w-[72px] max-w-[90px]`} value={values[k]} onChange={ev => changeGrade(e, k, ev.target.value)} disabled={busy} /> : r?.[k] ?? '—'}</Cell>)}
                  <Cell><strong>{g.final ?? '—'}</strong>{g.passed === false && <div className="mt-1 text-xs text-red-600">Chưa đạt</div>}</Cell>
                  <Cell><Badge good={g.passed !== false}>{g.letter}</Badge></Cell>
                  {staff && reportMode === 'section' && <Cell><input type="checkbox" aria-label={`Chọn công bố ${st?.code}`} disabled={!editable || busy} checked={!!publishSelection[e.id]} onChange={event => setPublishSelection(old => ({ ...old, [e.id]: event.target.checked }))} /></Cell>}
                  {role === 'lecturer' ? <Cell><Badge good={!!r?.published}>{r?.published ? 'Đã công bố' : 'Chưa công bố'}</Badge></Cell> : <Cell>{r?.published ? 'Đã công bố' : 'Chưa công bố'}</Cell>}
                  {role !== 'lecturer' && <Cell>{editable ? <button className={secondary} disabled={busy || !pending[e.id] || !!r?.published} onClick={() => saveGrades([e.id])}>Lưu nháp dòng</button> : se.gradesLocked ? 'Đã khóa' : 'Chỉ xem'}{staff && (!r || (!r.published && r.attendance === null && r.midterm === null && r.exam === null)) && <button className="mt-2 block text-xs text-red-700" disabled={busy} onClick={() => save('enrollment.cancel', { id: e.id }, false)}>Hủy đăng ký</button>}</Cell>}
                </tr>;
              })}
            </Table>
            {!filteredResultEnrollments.length && <Empty>Chưa có đăng ký/kết quả trong phạm vi đang xem.</Empty>}
          </div>}
          {tab === 'audit' && <><Table headers={['Thời gian', 'Người thao tác', 'Hành động', 'Mã bản ghi']}>{data.audits.filter(a => search([a.actorName, a.action, a.entityId])).map(a => <tr key={a.id}><Cell>{new Date(a.createdAt).toLocaleString('vi-VN')}</Cell><Cell>{a.actorName}</Cell><Cell>{actionLabels[a.action] || 'Cập nhật dữ liệu'}</Cell><Cell><span className="font-mono text-xs">{a.entityId}</span></Cell></tr>)}</Table>{!data.audits.length && <Empty>Chưa có thay đổi. Hiển thị tối đa 200 thay đổi gần nhất.</Empty>}</>}
        </div>
      </>}
      {form?.action === 'user.save' && <AdminAccountForm data={data} form={form} busy={busy} error={notice?.error ? notice.text : undefined} onChange={setForm} onClose={() => setForm(null)} onSubmit={values => { void save('user.save', values); }} onCreateProfile={() => form.values.role === 'student' ? openStudent() : openLecturer()} />}
      {form && form.action !== 'user.save' && <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex justify-end print:hidden" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setForm(null); }}><section role="dialog" aria-modal="true" aria-labelledby="portal-form-title" className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-slate-900 p-6 shadow-2xl" onKeyDown={trapFocus}><div className="flex justify-between items-center mb-2"><h2 id="portal-form-title" className="text-xl font-bold">{form.title}</h2><button className={secondary} onClick={() => setForm(null)} disabled={busy} aria-label="Đóng">✕</button></div><p className="text-sm text-slate-500 mb-6">Các trường có dấu * là bắt buộc.</p>{notice?.error && <div role="alert" className="rounded-lg bg-red-50 p-3 mb-4 text-red-800 text-sm">{notice.text}</div>}
        {form.action === 'student.save' && <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">Chỉ gán phiên bản đã công bố đúng khoa, ngành, khóa và hệ đào tạo. Nếu sinh viên đã có lịch sử học tập, đổi hoặc bỏ gán chương trình cần xác nhận và ghi lý do; điểm, đăng ký cũ vẫn giữ nguyên.</div>}
        {form.action === 'user.save' && ['student', 'lecturer'].includes(String(form.values.role)) && <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200"><p>Chọn hồ sơ có sẵn. Mã và danh tính được lấy từ hồ sơ, mỗi hồ sơ chỉ liên kết với một tài khoản. Hồ sơ đã liên kết tài khoản khác không xuất hiện trong danh sách.</p><button type="button" className="mt-2 font-semibold underline" onClick={() => form.values.role === 'student' ? openStudent() : openLecturer()}>{form.values.role === 'student' ? 'Tạo hồ sơ sinh viên trước' : 'Tạo hồ sơ giảng viên trước'}</button></div>}
        {form.action === 'section.save' && <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">Tạo lớp chỉ tạo hồ sơ lớp. Hãy lưu ở trạng thái Nháp, chọn Lập lịch học để nhập thứ, tiết, phòng và ngày học; sau đó bấm Mở đăng ký. Thời hạn đăng ký không phải là lịch học.</p>}
        {form.action === 'meeting.save' && <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-200">Buổi học thuộc lớp đã chọn bên dưới. Sau khi lưu, kiểm tra giảng viên và trạng thái Mở đăng ký để sinh viên đăng ký được.</p>}
        <form onSubmit={async e => { e.preventDefault(); const values = { ...form.values }; for (const f of getFormFields(data, form)) { if (f.type === 'datetime-local' && values[f.key]) values[f.key] = new Date(String(values[f.key])).toISOString(); if (f.key === 'active') values[f.key] = String(values[f.key]) === 'true'; } await save(form.action, values); }} className="space-y-4">
          {getFormFields(data, form).map((f, index) => <label key={form.action + ":" + String(form.values.id || "new") + ":" + f.key} className="block text-sm"><span className="block font-semibold mb-1.5">{f.label}{f.required ? ' *' : ''}</span>{f.type === 'select' ? <ChoiceSelect name={f.key} autoFocus={index === 0} className={input} required={f.required} disabled={f.disabled || busy} value={String(form.values[f.key] ?? '')} onChange={e => setForm(updateFormValue(data, form, f.key, e.target.value))} label={f.label} order={['sectionId', 'subjectId', 'lecturerId', 'studentId', 'parentId', 'curriculumId'].includes(f.key) ? 'label' : 'preserve'} emptyLabel={f.placeholder || ('Chọn ' + f.label.toLocaleLowerCase('vi') + '…')} options={f.options || []} /> : <input name={f.key} autoFocus={index === 0} className={input} type={f.type || 'text'} required={f.required} disabled={f.disabled || busy} min={f.type === 'number' ? f.min : undefined} max={f.type === 'number' ? f.max : undefined} minLength={f.type === 'password' ? f.min : undefined} maxLength={f.type === 'password' ? f.max : f.key === 'address' ? 500 : 250} step={f.type === 'number' ? '1' : undefined} autoComplete={f.type === 'password' ? 'new-password' : 'off'} value={String(form.values[f.key] ?? '')} onChange={e => setForm(updateFormValue(data, form, f.key, e.target.value))} />}</label>)}
          <div className="flex flex-wrap gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4"><button type="submit" disabled={busy} className={primary}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button type="button" className={secondary} onClick={() => setForm(null)} disabled={busy}>Hủy</button>{staff && !!form.values.id && !!deleteActions[form.action] && !(form.action === 'catalog.save' && ['intake', 'semester'].includes(String(form.values.kind))) && <button type="button" disabled={busy} className="ml-auto rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300" onClick={() => { const action = deleteActions[form.action]; const label = action === 'meeting.delete' ? `lịch học định kỳ ${form.values.startDate}–${form.values.endDate} (thứ ${form.values.day}, tiết ${form.values.startPeriod}–${form.values.endPeriod})` : `${form.values.code || form.values.name || form.values.id}`; if (window.confirm(`Xóa ${label}? Thao tác này sẽ được ghi vào nhật ký.`)) void save(action, { id: form.values.id }); }}>Xóa</button>}</div>
        </form>
      </section></div>}
      {roster && <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4 print:hidden"><section role="dialog" aria-modal="true" aria-labelledby="portal-roster-title" className="w-full max-w-3xl max-h-[85vh] overflow-auto bg-white dark:bg-slate-900 rounded-2xl p-6" onKeyDown={trapFocus}><div className="flex justify-between gap-3 items-center mb-5"><h2 id="portal-roster-title" className="font-bold text-xl">{roster.title} ({roster.rows.length})</h2><button autoFocus className={secondary} onClick={() => setRoster(null)}>Đóng</button></div><button className={`${secondary} mb-4`} onClick={() => csv('danh-sach-lop.csv', [['Mã sinh viên', 'Họ tên', 'Lớp niên khóa'], ...roster.rows.map(r => [r.code, r.name, r.cohort])])}>Xuất danh sách CSV</button><Table headers={['Mã sinh viên', 'Họ tên', 'Lớp niên khóa']}>{roster.rows.map(r => <tr key={r.code}><Cell>{r.code}</Cell><Cell>{r.name}</Cell><Cell>{r.cohort}</Cell></tr>)}</Table>{!roster.rows.length && <Empty>Lớp chưa có sinh viên.</Empty>}</section></div>}
    </div>
  );
}
function WorkspaceAction({ action, onOpen }: { action: string; onOpen: () => void }) {
  const opened = useRef(false);
  useEffect(() => { if (action && !opened.current) { opened.current = true; onOpen(); } }, [action, onOpen]);
  return null;
}
function toLocalTime(iso: string) { const d = new Date(iso); return `${localDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function trapFocus(e: React.KeyboardEvent<HTMLElement>) { if (e.key !== 'Tab') return; const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')); const first = nodes[0], last = nodes[nodes.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }

function ScheduleView({ data, staff, userId, role, ownSectionIds, week, setWeek, semester, query, initialSectionId, openMeeting }: { data: PortalView; staff: boolean; userId: string; role: string; ownSectionIds: string[]; week: string; setWeek: (s: string) => void; semester: string; query: string; initialSectionId: string; openMeeting: (m?: PortalView['meetings'][number]) => void }) {
  const [teacherId, setTeacherId] = useState('');
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [room, setRoom] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'week' | 'date-range' | 'semester'>('week');
  const [exportUseFilters, setExportUseFilters] = useState(false);
  const [exportStart, setExportStart] = useState(week);
  const [exportEnd, setExportEnd] = useState(plusDays(week, 6));
  const [exportSemester, setExportSemester] = useState(semester || data.currentSemester || '');
  const [exportTarget, setExportTarget] = useState<{ meetingId: string; date: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const section = (id: string) => data.sections.find(s => s.id === id);
  const subject = (id: string) => data.subjects.find(s => s.id === id);
  const teacher = (id: string | null) => data.users.find(u => u.id === id);
  const exportSemesterOptions = semesterChoices([...data.sections.map(row => row.semester), ...data.catalogs.filter(row => row.kind === 'semester').map(row => row.name)], data.catalogs, exportSemester);
  const allowed = data.meetings.filter(m => {
    const s = section(m.sectionId); if (!s) return false;
    if (!staff && (role === 'lecturer' ? s.lecturerId !== userId : !ownSectionIds.includes(s.id))) return false;
    return (!semester || (role === 'student' ? sameSemester(s.semester, semester, data.catalogs) : catalogEqual('semester', s.semester, semester, data.catalogs))) && (!teacherId || s.lecturerId === teacherId) && (!sectionId || s.id === sectionId) && (!room || catalogEqual('room', m.room, room, data.catalogs)) && [s.code, subject(s.subjectId)?.name, m.room, teacher(s.lecturerId)?.name].join(' ').toLowerCase().includes(query.toLowerCase());
  });
  const meetings = allowed.filter(m => { const dayDate = plusDays(week, m.day - 1); return m.startDate <= dayDate && m.endDate >= dayDate; });
  const currentFilterSummary = [semester ? semesterLabel(semester) : '', teacherId ? `Giảng viên: ${teacher(teacherId)?.name || 'đã chọn'}` : '', sectionId ? `Lớp: ${section(sectionId)?.code || 'đã chọn'}` : '', room ? `Phòng: ${room}` : '', query.trim() ? `Tìm kiếm: ${query.trim()}` : ''].filter(Boolean).join(' · ') || 'Chưa đặt điều kiện lọc';
  const exportRangeSummary = exportScope === 'week' ? `Tuần ${week} – ${plusDays(week, 6)}` : exportScope === 'date-range' ? `${exportStart || '…'} – ${exportEnd || '…'}` : `${semesterLabel(exportSemester || semester || data.currentSemester || '')} · theo khoảng ngày hiệu lực đã lưu cho lịch của các lớp`;
  const exportTargetMeeting = exportTarget ? data.meetings.find(row => row.id === exportTarget.meetingId) : undefined;
  function openSubstitutionExport(meeting: PortalView['meetings'][number], date: string) {
    setExportScope('week'); setExportUseFilters(false); setExportStart(week); setExportEnd(plusDays(week, 6));
    setExportSemester(semester || data.currentSemester || ''); setExportTarget({ meetingId: meeting.id, date });
    setExportError(''); setExportOpen(true);
  }
  async function downloadSchedule() {
    if (exporting) return;
    setExportError('');
    if (exportScope === 'date-range' && (!exportStart || !exportEnd || exportStart > exportEnd)) { setExportError('Vui lòng chọn khoảng ngày hợp lệ.'); return; }
    if (exportScope === 'semester' && !exportSemester) { setExportError('Vui lòng chọn học kỳ cần xuất.'); return; }
    if (exportTarget && exportScope === 'week' && (exportTarget.date < week || exportTarget.date > plusDays(week, 6))) { setExportError('Buổi cần đối chiếu nằm ngoài tuần đang xuất. Hãy chọn lại buổi học.'); return; }
    if (exportTarget && exportScope === 'date-range' && (exportTarget.date < exportStart || exportTarget.date > exportEnd)) { setExportError('Buổi cần đối chiếu nằm ngoài khoảng ngày xuất.'); return; }
    const params = new URLSearchParams({ scope: exportScope, applyFilters: String(exportUseFilters) });
    if (exportScope === 'week') { params.set('startDate', week); params.set('endDate', plusDays(week, 6)); }
    if (exportScope === 'date-range') { params.set('startDate', exportStart); params.set('endDate', exportEnd); }
    if (exportScope === 'semester') params.set('semester', exportSemester);
    if (semester) params.set('assignmentSemester', semester);
    if (exportTarget) { params.set('targetMeetingId', exportTarget.meetingId); params.set('targetDate', exportTarget.date); }
    if (exportUseFilters) {
      if (semester) params.set('filterSemester', semester);
      if (teacherId) params.set('lecturerId', teacherId);
      if (sectionId) params.set('sectionId', sectionId);
      if (room) params.set('room', room);
      if (query.trim()) params.set('query', query.trim());
    }
    setExporting(true);
    try {
      const response = await apiFetch(`/api/portal/schedule-export?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || 'Không thể xuất tệp Excel.'); }
      const blob = await response.blob();
      if (!blob.size) throw new Error('Tệp xuất không có dữ liệu.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `thoi-khoa-bieu-${exportScope}-${localDate(new Date())}.xlsx`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportOpen(false);
    } catch (error) { setExportError(error instanceof Error ? error.message : 'Không thể xuất tệp Excel. Vui lòng thử lại.'); }
    finally { setExporting(false); }
  }
  return <div className="p-4 space-y-5">
    <div className="flex flex-wrap items-center gap-3 print:hidden"><button className={secondary} onClick={() => { setWeek(plusDays(week, -7)); setExportTarget(null); }}>← Tuần trước</button><label className="text-xs">Tuần bắt đầu<input type="date" className={input} value={week} onChange={e => { if (e.target.value) { setWeek(monday(e.target.value)); setExportTarget(null); } }} /></label><button className={secondary} onClick={() => { setWeek(monday()); setExportTarget(null); }}>Tuần hiện tại</button><button className={secondary} onClick={() => { setWeek(plusDays(week, 7)); setExportTarget(null); }}>Tuần sau →</button><button className={secondary} onClick={() => window.print()}>In thời khóa biểu</button>{staff && <button className={primary} onClick={() => { setExportStart(week); setExportEnd(plusDays(week, 6)); setExportSemester(semester || data.currentSemester || exportSemesterOptions[0]?.value || ''); setExportTarget(null); setExportError(''); setExportOpen(value => !value); }}>Xuất Excel</button>}</div>
    {staff && exportOpen && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 print:hidden" aria-label="Tùy chọn xuất Excel">
      <div className="flex items-start justify-between gap-4"><div><h3 className="font-bold">Xuất lịch và danh sách giảng viên</h3><p className="mt-1 text-sm text-slate-500">Phạm vi xuất: <strong className="text-slate-700 dark:text-slate-200">{exportRangeSummary}</strong></p></div><button type="button" className="text-sm text-slate-500 hover:text-slate-900" onClick={() => setExportOpen(false)}>Đóng</button></div>
      {exportTarget && exportTargetMeeting && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30"><strong>Buổi cần đối chiếu:</strong> {exportTarget.date} · {section(exportTargetMeeting.sectionId)?.code} · tiết {exportTargetMeeting.startPeriod}–{exportTargetMeeting.endPeriod}<button className="ml-3 text-primary underline" onClick={() => setExportTarget(null)}>Bỏ lựa chọn</button></div>}
      <div className="mt-4 grid grid-cols-3 gap-3"><label className="text-xs font-medium">Phạm vi<select className={`${input} mt-1`} value={exportScope} onChange={event => { setExportScope(event.target.value as typeof exportScope); setExportTarget(null); }}><option value="week">Tuần đang xem</option><option value="date-range">Khoảng ngày</option><option value="semester">Toàn học kỳ</option></select></label>{exportScope === 'date-range' && <><label className="text-xs font-medium">Từ ngày<input aria-label="Ngày bắt đầu xuất" type="date" className={`${input} mt-1`} value={exportStart} onChange={event => setExportStart(event.target.value)} /></label><label className="text-xs font-medium">Đến ngày<input aria-label="Ngày kết thúc xuất" type="date" className={`${input} mt-1`} value={exportEnd} onChange={event => setExportEnd(event.target.value)} /></label></>}{exportScope === 'semester' && <label className="text-xs font-medium">Học kỳ<select aria-label="Học kỳ xuất Excel" className={`${input} mt-1`} value={exportSemester} onChange={event => setExportSemester(event.target.value)}><option value="">Chọn học kỳ…</option>{exportSemesterOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</div>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-sm font-semibold">{exportUseFilters ? 'Theo bộ lọc hiện tại' : 'Toàn bộ lịch trong phạm vi đã chọn'}</p><p className="mt-1 text-xs text-slate-500">{exportUseFilters ? currentFilterSummary : 'Bỏ lọc giảng viên, lớp, phòng, học kỳ và tìm kiếm của bảng; giữ nguyên phạm vi ngày hoặc học kỳ đang xuất.'}</p><div className="mt-3 flex gap-5"><label className="flex items-center gap-2 text-sm"><input type="radio" name="export-filters" checked={!exportUseFilters} onChange={() => setExportUseFilters(false)} />Toàn bộ lịch trong phạm vi</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="export-filters" checked={exportUseFilters} onChange={() => setExportUseFilters(true)} />Theo bộ lọc hiện tại</label></div></div>
      <p className="mt-3 text-xs text-slate-500">Tệp gồm lịch buổi học và toàn bộ giảng viên đang hoạt động{exportTarget ? ', kèm bảng đối chiếu dạy thay cho buổi đã chọn' : ''}. Lịch trùng được kiểm tra với mọi lớp trong ngày, kể cả khi xuất theo bộ lọc. Hệ thống hiện chưa quản lý chuyên môn hoặc trạng thái nghỉ, học bù, dạy thay theo từng buổi.</p>
      {exportError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{exportError}</p>}<div className="mt-4 flex justify-end"><button type="button" disabled={exporting} className={primary} onClick={downloadSchedule}>{exporting ? 'Đang xuất…' : 'Tải tệp Excel'}</button></div>
    </section>}
    {staff && <div className="flex flex-wrap gap-3 print:hidden"><ChoiceSelect label="Giảng viên" order="label" aria-label="Lọc giảng viên" className={input} containerClassName="w-64" value={teacherId} onChange={event => setTeacherId(event.target.value)} options={data.users.filter(user => user.role === 'lecturer').map(user => ({ value: user.id, label: user.name + (!user.active ? ' (ngừng hoạt động)' : '') }))} emptyLabel="Tất cả giảng viên" /><ChoiceSelect label="Lớp tín chỉ" order="label" aria-label="Lọc lớp tín chỉ" className={input} containerClassName="w-64" value={sectionId} onChange={event => setSectionId(event.target.value)} options={data.sections.map(section => ({ value: section.id, label: section.code }))} emptyLabel="Tất cả lớp tín chỉ" /><ChoiceSelect label="Phòng học" aria-label="Lọc phòng học" className={input} containerClassName="w-60" value={room} onChange={event => setRoom(event.target.value)} options={catalogChoices(data.catalogs, 'room', { filter: true })} emptyLabel="Tất cả phòng học" /></div>}
    <div><h2 className="font-bold text-lg">{staff ? 'Thời khóa biểu chung' : role === 'lecturer' ? 'Lịch giảng dạy' : 'Thời khóa biểu cá nhân'}</h2><p className="mt-1 text-sm text-slate-500">{week} → {plusDays(week, 6)} · {meetings.length} buổi học · {staff ? 'Theo kế hoạch đào tạo' : role === 'lecturer' ? 'Theo phân công giảng dạy' : 'Theo các lớp đã đăng ký'}</p></div>
    <div className="overflow-x-auto"><div className="grid grid-cols-7 min-w-[1050px] gap-2 portal-week">{Array.from({ length: 7 }, (_, day) => <div key={day} className="rounded-xl border border-slate-200 min-h-[230px] bg-slate-50/70 dark:bg-slate-950 dark:border-slate-800"><div className="border-b border-slate-200 px-3 py-3 text-center dark:border-slate-800"><strong className="text-sm">{day === 6 ? 'Chủ nhật' : `Thứ ${day + 2}`}</strong><div className="text-xs text-slate-500 mt-1">{plusDays(week, day).slice(5)}</div></div><div className="p-2 space-y-2">{meetings.filter(m => m.day === day + 1).sort((a, b) => a.startPeriod - b.startPeriod).map(m => { const s = section(m.sectionId)!; return <div key={m.id} className="rounded-lg border-l-4 border-red-700 bg-white p-3 shadow-sm dark:bg-slate-900"><p className="text-xs text-primary font-bold">Tiết {m.startPeriod}–{m.endPeriod}</p><p className="text-[10px] text-slate-500 mt-1">{periodTimes[m.startPeriod - 1]?.split('–')[0]}–{periodTimes[m.endPeriod - 1]?.split('–')[1]}</p><h3 className="text-sm font-semibold mt-2">{subject(s.subjectId)?.name}</h3><p className="text-[11px] mt-2">{s.code}</p>{role !== 'lecturer' && <p className="mt-1 text-[11px] text-slate-500">{teacher(s.lecturerId)?.name || 'Chưa phân công'}</p>}<Badge>{m.room}</Badge>{staff && <><button className="block text-xs text-primary mt-2 font-semibold print:hidden" onClick={() => openMeeting(m)}>Điều chỉnh</button><button className="block text-xs text-primary mt-2 font-semibold print:hidden" onClick={() => openSubstitutionExport(m, plusDays(week, day))}>Đối chiếu dạy thay</button></>}</div>; })}{!meetings.some(m => m.day === day + 1) && <p className="text-center text-xs text-slate-400 py-8">Không có lịch</p>}</div></div>)}</div></div>
    {staff && <div><h3 className="font-semibold text-sm mb-3">Các buổi học theo bộ lọc (mọi tuần)</h3><Table headers={['Mã lớp', 'Môn học', 'Giảng viên', 'Thứ', 'Tiết', 'Giờ học', 'Từ ngày', 'Đến ngày', 'Phòng', 'Thao tác']}>{allowed.map(m => { const currentSection = section(m.sectionId); const periodStart = periodTimes[m.startPeriod - 1]?.split('–')[0] || ''; const periodEnd = periodTimes[m.endPeriod - 1]?.split('–')[1] || ''; return <tr key={m.id}><Cell>{currentSection?.code}</Cell><Cell>{subject(currentSection?.subjectId || '')?.name || 'Chưa có thông tin'}</Cell><Cell>{teacher(currentSection?.lecturerId || null)?.name || 'Chưa phân công'}</Cell><Cell>{m.day === 7 ? 'Chủ nhật' : `Thứ ${m.day + 1}`}</Cell><Cell>{m.startPeriod}–{m.endPeriod}</Cell><Cell>{periodStart}–{periodEnd}</Cell><Cell>{m.startDate}</Cell><Cell>{m.endDate}</Cell><Cell>{m.room}</Cell><Cell><button className={secondary} onClick={() => openMeeting(m)}>Sửa lịch</button></Cell></tr>; })}</Table>{!allowed.length && <Empty>Chưa lập thời khóa biểu. Chọn “Lập lịch” để thêm buổi học.</Empty>}</div>}
    <p className="text-xs text-slate-500">Khung giờ tiết học đang dùng được hiển thị trên từng buổi. Các buổi lặp hằng tuần trong khoảng ngày đã lập; lịch trùng phòng, giảng viên hoặc sinh viên sẽ bị từ chối khi lưu.</p>
  </div>;
}

