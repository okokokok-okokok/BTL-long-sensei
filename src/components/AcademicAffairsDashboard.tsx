'use client';

import Link from 'next/link';
import { PERIOD_TIMES } from '@/lib/portal/options';
import { ChoiceSelect } from '@/components/ChoiceSelect';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Clock3, GraduationCap, MapPin, RefreshCw, Search, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { semesterLabel } from '@/lib/portal/semester';
import type { buildAcademicDashboard } from '@/lib/portal/academic-dashboard';

type Dashboard = ReturnType<typeof buildAcademicDashboard> & { storage: 'demo' | 'postgresql' };
type Roster = { title: string; rows: { code: string; name: string; cohort: string }[] };

const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-200 dark:bg-slate-950 dark:text-white dark:border-slate-700';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50';
const primary = `${button} bg-primary text-white hover:bg-red-800`;
const secondary = `${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700`;
const periodTimes = PERIOD_TIMES;

function fmtDateTime(value: string | null) {
  if (!value) return 'Chưa đặt';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Thời hạn không hợp lệ';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

function fmtDate(value: string) {
  const date = new Date(`${value}T12:00:00+07:00`);
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

function monday(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

function clockRange(start: number, end: number) {
  const first = periodTimes[start - 1]?.split('–')[0];
  const last = periodTimes[end - 1]?.split('–')[1];
  return first && last ? `${first}–${last}` : 'Chưa có khung giờ';
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>;
}

function Metric({ href, title, value, scope, hint, icon: Icon }: { href: string; title: string; value: number; scope: string; hint: string; icon: typeof Users }) {
  return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p><p className="mt-3 text-3xl font-bold tracking-tight">{value.toLocaleString('vi-VN')}</p></div><span className="rounded-xl bg-red-50 p-3 text-primary dark:bg-red-950/50 dark:text-red-300"><Icon size={20} /></span></div>
    <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{scope}</span><span className="text-slate-500 group-hover:text-primary">{hint} <ArrowRight size={13} className="inline" /></span></div>
  </Link>;
}

function TaskCard({ title, description, rows, focus, semester }: { title: string; description: string; rows: { id: string; code: string; subjectName: string }[]; focus: string; semester: string }) {
  const params = new URLSearchParams({ tab: 'sections', semester, focus });
  const rowUrl = (id: string) => {
    if (focus === 'no-schedule') return `/schedule?${new URLSearchParams({ semester, section: id, action: 'create-meeting' })}`;
    const options: Record<string, string> = focus === 'unassigned' ? { tab: 'sections', action: 'assign-lecturer' } : { tab: 'results' };
    return `/academic?${new URLSearchParams({ ...options, semester, section: id })}`;
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <Link href={`/academic?${params}`} className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div><span className={`shrink-0 rounded-xl px-3 py-1.5 text-lg font-bold ${rows.length ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{rows.length}</span></Link>
    {rows.length > 0 && <><ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">{rows.slice(0, 4).map(row => <li key={row.id}><Link className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary" href={rowUrl(row.id)}><span className="min-w-0"><strong className="block">{row.code}</strong><span className="block truncate text-xs text-slate-500">{row.subjectName}</span></span><ArrowRight size={15} className="shrink-0" /></Link></li>)}</ul>{rows.length > 4 && <Link className="text-sm font-semibold text-primary" href={`/academic?${params}`}>Xem tất cả {rows.length} lớp</Link>}</>}
  </section>;
}

export default function AcademicAffairsDashboard() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState('');
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [registrationFilter, setRegistrationFilter] = useState('all');
  const [roster, setRoster] = useState<Roster | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [rosterSection, setRosterSection] = useState<{ id: string; code: string } | null>(null);

  useEffect(() => { const saved = window.sessionStorage.getItem('ptit:academic-semester'); if (saved) setSemester(saved); }, []);
  useEffect(() => { if (data?.semester) window.sessionStorage.setItem('ptit:academic-semester', data.semester); }, [data?.semester]);

  const load = useCallback(async (signal: AbortSignal) => {
    const params = new URLSearchParams();
    if (semester) params.set('semester', semester);
    if (date) params.set('date', date);
    const response = await apiFetch(`/api/academic-dashboard${params.size ? `?${params}` : ''}`, { cache: 'no-store', signal });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Không tải được tổng quan đào tạo.');
    return json.data as Dashboard;
  }, [semester, date]);

  useEffect(() => {
    if (!user || authLoading || (role !== 'admin' && role !== 'academic')) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);
    load(controller.signal).then(result => { setData(result); setSemester(current => current && current !== result.semester ? result.semester : current); }).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không tải được tổng quan đào tạo.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user, role, authLoading, load, retryCount]);

  const openRoster = useCallback(async (sectionId: string, sectionCode: string) => {
    setRosterSection({ id: sectionId, code: sectionCode });
    setRoster(null);
    setRosterError('');
    setRosterLoading(true);
    try {
      const response = await apiFetch(`/api/portal?roster=${encodeURIComponent(sectionId)}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không tải được danh sách lớp.');
      setRoster({ title: `Danh sách sinh viên · ${sectionCode}`, rows: json.data.roster });
    } catch (reason) {
      setRosterError(reason instanceof Error ? reason.message : 'Không tải được danh sách lớp.');
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roster) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setRoster(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [roster]);

  const selectedSemester = semester || data?.semester || '';
  const selectedDate = date || data?.date || '';
  const paramsForManagement = (tab: string, extra: Record<string, string> = {}) => new URLSearchParams({ tab, ...(tab !== 'students' && tab !== 'cohorts' && tab !== 'lecturers' ? { semester: selectedSemester } : {}), ...extra });
  const currentSectionsUrl = (focus = '') => `/academic?${paramsForManagement('sections', focus ? { focus } : {})}`;
  const filteredRegistration = useMemo(() => (data?.registration || []).filter(row => {
    const matchesText = `${row.code} ${row.subjectCode} ${row.subjectName} ${row.lecturerName} ${row.lecturerCode}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'));
    const matchesFilter = registrationFilter === 'all' || (registrationFilter === 'accepting' ? row.canRegister : registrationFilter === 'open' ? row.isOpen : registrationFilter === 'full' ? row.registrationStatus === 'full' : registrationFilter === 'ended' ? row.timeStatus === 'ended' : !row.isOpen);
    return matchesText && matchesFilter;
  }), [data, search, registrationFilter]);

  if (authLoading) return <div className="space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div></div>;
  if (!user || (role !== 'admin' && role !== 'academic')) return <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-red-800 dark:bg-slate-900">Trang tổng quan này chỉ dành cho Admin và Giáo vụ.</div>;
  if (!data && loading) return <div className="space-y-5"><div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div></div>;
  if (error && !data) return <div className="rounded-2xl border border-red-200 bg-white p-6 dark:bg-slate-900"><h1 className="text-xl font-bold">Không tải được Không gian Giáo vụ</h1><p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p><button className={`${primary} mt-5`} onClick={() => setRetryCount(value => value + 1)}><RefreshCw size={16} /> Thử tải lại</button></div>;
  if (!data) return null;

  const term = selectedSemester;
  const layout = (dateValue: string) => dateValue ? monday(dateValue) : monday(data.date);
  const scheduleUrl = `/schedule?${new URLSearchParams({ semester: term, week: layout(selectedDate) })}`;
  const gradeReportUrl = `/academic?${paramsForManagement('results', { report: 'system' })}`;
  const registrationStatusLabel = (row: Dashboard['registration'][number]) => {
    if (row.registrationStatus === 'locked') return 'Bảng điểm đã khóa';
    if (row.registrationStatus === 'unavailable') return row.blockReason || 'Chưa đủ điều kiện';
    if (row.registrationStatus === 'draft') return 'Nháp';
    if (row.registrationStatus === 'closed') return 'Đã đóng';
    if (row.registrationStatus === 'invalid-window') return 'Thời hạn không hợp lệ';
    if (row.registrationStatus === 'not-started') return 'Chưa tới hạn';
    if (row.registrationStatus === 'ended') return 'Đã hết hạn';
    if (row.registrationStatus === 'full') return 'Hết chỗ';
    if (row.registrationStatus === 'open-no-deadline') return 'Đang mở · chưa đặt hạn';
    return 'Đang nhận đăng ký';
  };
  const badgeClass = (row: Dashboard['registration'][number]) => row.canRegister ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : row.isOpen ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  const progressLabel: Record<string, string> = { 'no-students': 'Chưa có sinh viên', 'not-started': 'Chưa nhập điểm', 'in-progress': 'Đang nhập / chưa công bố đủ', 'published-unlocked': 'Đã công bố đủ · chờ khóa', locked: 'Đã khóa' };

  return <div className="space-y-8 pb-10">
    <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 xl:flex-row xl:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">PTIT · CÔNG TÁC ĐÀO TẠO</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Không gian Giáo vụ</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Tổng quan học kỳ, đăng ký học phần, lịch học, tiến độ điểm và các việc cần xử lý.</p><div className="mt-4 flex flex-wrap gap-2"><Link className={secondary} href="/academic">Quản lý đào tạo <ArrowRight size={15} /></Link><Link className={secondary} href={scheduleUrl}>Thời khóa biểu chung <ArrowRight size={15} /></Link></div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[430px]">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Học kỳ · năm học<ChoiceSelect label="Học kỳ" aria-label="Chọn học kỳ" className={input + ' mt-1.5'} value={term} onChange={event => setSemester(event.target.value)} options={data.semesters.map(item => ({ value: item, label: semesterLabel(item) }))} emptyLabel="Chọn học kỳ…" required /></label>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ngày xem lịch trong học kỳ<input aria-label="Chọn ngày xem lịch trong học kỳ" aria-describedby="academic-dashboard-date-hint" type="date" className={`${input} mt-1.5`} value={selectedDate} onChange={event => setDate(event.target.value)} /></label>
        <p id="academic-dashboard-date-hint" className="text-xs text-slate-500 sm:col-span-2">Lịch trong ngày luôn dùng học kỳ đang chọn; đổi ngày không tự đổi học kỳ.</p>
      </div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><span>{error} Dữ liệu đang hiển thị là lần tải thành công gần nhất.</span><button className={secondary} onClick={() => setRetryCount(value => value + 1)}><RefreshCw size={15} /> Thử lại</button></div>}

    <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm dark:border-red-950 dark:bg-red-950/20">
      {data.storage === 'demo' && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">Chế độ demo</span>}
      <p><strong>Đăng ký:</strong> {data.registrationWindow.label}.</p><p><strong>Nhập điểm:</strong> {data.gradeEntryWindow.label}.</p>
    </section>

    <section>
      <SectionTitle title="Thống kê tổng quan" subtitle="Số sinh viên, giảng viên và lớp niên khóa tính toàn hệ thống; lớp tín chỉ và lượt đăng ký theo học kỳ đang chọn." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric href="/academic?tab=students&active=true" title="Sinh viên đang học" value={data.stats.activeStudents} scope="Toàn hệ thống" hint="Mở hồ sơ" icon={Users} />
        <Metric href="/academic?tab=lecturers&active=true" title="Giảng viên đang hoạt động" value={data.stats.activeLecturers} scope="Toàn hệ thống" hint="Mở danh sách" icon={GraduationCap} />
        <Metric href="/academic?tab=cohorts&active=true" title="Lớp niên khóa đang hoạt động" value={data.stats.activeCohorts} scope="Toàn hệ thống" hint="Mở danh sách" icon={Users} />
        <Metric href={currentSectionsUrl()} title="Lớp tín chỉ trong học kỳ" value={data.stats.sections} scope={term} hint="Mở lớp tín chỉ" icon={ClipboardList} />
        <Metric href={currentSectionsUrl('open')} title="Lớp đang mở đăng ký" value={data.stats.openSections} scope={data.scopes.openSections} hint="Kiểm tra hạn và chỗ" icon={CalendarDays} />
        <Metric href={currentSectionsUrl('registered')} title="Lượt đăng ký còn hiệu lực" value={data.stats.activeEnrollments} scope={term} hint="Mở danh sách lớp" icon={CheckCircle2} />
      </div>
    </section>

    <section>
      <SectionTitle title="Công việc cần xử lý" subtitle={`Danh sách đã lọc theo ${term}. Lớp chưa có sinh viên không được tính vào công việc nhập điểm.`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TaskCard title="Chưa phân công giảng viên" description="Lớp tín chỉ chưa có giảng viên phụ trách." rows={data.tasks.unassigned} focus="unassigned" semester={term} />
        <TaskCard title="Chưa có lịch học" description="Lớp tín chỉ chưa có buổi học được xếp lịch." rows={data.tasks.noSchedule} focus="no-schedule" semester={term} />
        <TaskCard title="Có sinh viên nhưng chưa nhập điểm" description="Tất cả đăng ký còn hiệu lực của lớp chưa có thành phần điểm nào." rows={data.tasks.noGrades} focus="no-grades" semester={term} />
        <TaskCard title="Đang nhập điểm / chưa công bố đủ" description="Đã có điểm ở một phần lớp, nhưng còn sinh viên thiếu điểm hoặc chưa được công bố đủ." rows={data.tasks.gradeInProgress} focus="grades-incomplete" semester={term} />
        <TaskCard title="Đã công bố đủ điểm nhưng chưa khóa" description="Tất cả sinh viên còn hiệu lực đã có đủ ba thành phần điểm và điểm đã công bố." rows={data.tasks.readyToLock} focus="ready-to-lock" semester={term} />
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <SectionTitle title="Thao tác nhanh" subtitle="Mở biểu mẫu nghiệp vụ đang có trong Quản lý đào tạo." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <QuickAction href={`/academic?${paramsForManagement('students', { action: 'create-student' })}`} label="Thêm hồ sơ sinh viên" icon={Users} />
        <QuickAction href={`/academic?${paramsForManagement('cohorts', { action: 'create-cohort' })}`} label="Tạo lớp niên khóa" icon={GraduationCap} />
        <QuickAction href={`/academic?${paramsForManagement('sections', { action: 'create-section' })}`} label="Tạo lớp tín chỉ" icon={ClipboardList} />
        <QuickAction href={`/academic?${paramsForManagement('sections', { action: 'assign-lecturer' })}`} label="Phân công giảng viên" icon={Users} />
        <QuickAction href={`/schedule?${new URLSearchParams({ semester: term, action: 'create-meeting' })}`} label="Lập thời khóa biểu" icon={CalendarDays} />
        <QuickAction href={gradeReportUrl} label="Tra cứu kết quả học tập" icon={CheckCircle2} />
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <SectionTitle title="Tình hình đăng ký" subtitle={`Sĩ số tính từ đăng ký còn hiệu lực trong ${term}; đăng ký đã hủy không được tính.`} action={<Link className={`${secondary} w-full sm:w-auto`} href={currentSectionsUrl('registered')}>Quản lý lớp tín chỉ <ArrowRight size={15} /></Link>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_220px]">
        <label className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Tìm lớp tín chỉ" className={`${input} pl-9`} placeholder="Tìm mã lớp, môn hoặc giảng viên" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <select aria-label="Lọc trạng thái đăng ký" className={input} value={registrationFilter} onChange={event => setRegistrationFilter(event.target.value)}><option value="all">Mọi trạng thái</option><option value="accepting">Đang nhận đăng ký</option><option value="open">Lớp ở trạng thái mở</option><option value="full">Đã hết chỗ</option><option value="ended">Đã hết hạn đăng ký</option><option value="closed">Nháp / đã đóng</option></select>
      </div>
      {filteredRegistration.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800"><th className="px-3 py-3">Mã lớp / học kỳ</th><th className="px-3 py-3">Môn học</th><th className="px-3 py-3">Giảng viên</th><th className="px-3 py-3">Đăng ký / sĩ số</th><th className="px-3 py-3">Còn chỗ</th><th className="px-3 py-3">Thời hạn đăng ký</th><th className="px-3 py-3">Trạng thái</th><th className="px-3 py-3">Danh sách</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredRegistration.slice(0, 10).map(row => <tr key={row.id}><td className="px-3 py-3 align-top"><strong>{row.code}</strong><span className="block text-xs text-slate-500">{row.semester}</span></td><td className="px-3 py-3 align-top">{row.subjectName}<span className="block text-xs text-slate-500">{row.subjectCode}</span></td><td className="px-3 py-3 align-top">{row.lecturerName || <span className="text-amber-700">Chưa phân công</span>}<span className="block text-xs text-slate-500">{row.lecturerCode}</span></td><td className="px-3 py-3 align-top font-semibold">{row.count} / {row.capacity}</td><td className="px-3 py-3 align-top">{row.remainingSeats}</td><td className="px-3 py-3 align-top text-xs"><span className="block">Từ: {fmtDateTime(row.registrationStart)}</span><span className="mt-1 block">Đến: {fmtDateTime(row.registrationEnd)}</span></td><td className="px-3 py-3 align-top"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(row)}`}>{registrationStatusLabel(row)}</span><span className="mt-1 block text-[11px] text-slate-500">Trạng thái lớp: {row.status === 'draft' ? 'Nháp' : row.status === 'closed' ? 'Đã đóng' : 'Mở'}</span></td><td className="px-3 py-3 align-top"><button className={`${secondary} px-3 py-2 text-xs`} onClick={() => openRoster(row.id, row.code)}>Xem sinh viên</button></td></tr>)}</tbody></table></div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950">Không có lớp phù hợp với bộ lọc.</p>}
      {filteredRegistration.length > 10 && <Link className="mt-4 inline-block text-sm font-semibold text-primary" href={currentSectionsUrl()}>Mở danh sách lớp đầy đủ trong Quản lý đào tạo</Link>}
      {!data.registration.length && <p className="mt-3 text-sm text-slate-500">Học kỳ này chưa có lớp tín chỉ.</p>}
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle title="Lịch học trong ngày" subtitle={`${fmtDate(data.date)} · ${data.todaySchedule.length} buổi trong ${term}`} action={<Link className={secondary} href={scheduleUrl}>Thời khóa biểu chung <ArrowRight size={15} /></Link>} />
        {data.todaySchedule.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{data.todaySchedule.map(item => <li key={item.id} className="flex gap-4 py-4"><div className="min-w-[90px] rounded-xl bg-red-50 px-3 py-2 text-center text-primary dark:bg-red-950/40 dark:text-red-300"><strong className="block text-sm">Tiết {item.startPeriod}–{item.endPeriod}</strong><span className="mt-1 block text-xs">{clockRange(item.startPeriod, item.endPeriod)}</span></div><div className="min-w-0 flex-1"><p className="font-bold">{item.subjectName}</p><p className="mt-1 text-sm text-slate-500">{item.sectionCode} · {item.lecturerName}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} /> {item.room} · Hiệu lực {item.startDate} – {item.endDate}</p></div><Link aria-label={`Mở lịch lớp ${item.sectionCode}`} href={`/schedule?${new URLSearchParams({ semester: term, week: layout(data.date), section: item.sectionId })}`} className="self-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"><ArrowRight size={16} /></Link></li>)}</ul> : <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950">Không có buổi học nào diễn ra trong ngày này.</div>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle title="Tiến độ nhập điểm" subtitle="Các trạng thái dưới đây không chồng lấp; lớp chưa có sinh viên được báo riêng." action={<span className="flex gap-3"><Link className="text-sm font-semibold text-primary hover:underline" href={gradeReportUrl}>Báo cáo điểm</Link><Link className="text-sm font-semibold text-primary hover:underline" href={currentSectionsUrl()}>Tất cả lớp</Link></span>} />
        <div className="grid grid-cols-2 gap-3"><ProgressMetric title="Chưa nhập" value={data.gradeProgress.notStarted} /><ProgressMetric title="Đang nhập / thiếu công bố" value={data.gradeProgress.inProgress} /><ProgressMetric title="Công bố đủ, chờ khóa" value={data.gradeProgress.publishedUnlocked} /><ProgressMetric title="Đã khóa" value={data.gradeProgress.locked} /></div>
        <p className="mt-3 text-xs text-slate-500">{data.gradeProgress.noStudents} lớp chưa có sinh viên, không tính vào nhóm chờ nhập điểm.</p>
        <div className="mt-4 max-h-[390px] overflow-auto"><table className="w-full min-w-[470px] text-left text-xs"><thead className="sticky top-0 bg-white text-slate-500 dark:bg-slate-900"><tr><th className="py-2">Lớp / môn</th><th className="py-2">Đủ điểm đã công bố</th><th className="py-2">Trạng thái</th><th className="py-2" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{data.gradeProgress.sections.slice(0, 10).map(row => <tr key={row.id}><td className="py-2.5"><strong className="block">{row.code}</strong><span className="text-slate-500">{row.subjectName}</span></td><td className="py-2.5 font-semibold">{row.completedCount} / {row.enrollmentCount}</td><td className="py-2.5">{progressLabel[row.status]}</td><td className="py-2.5"><Link className="whitespace-nowrap font-semibold text-primary hover:underline" href={`/academic?${paramsForManagement('results', { section: row.id })}`}>Bảng điểm</Link></td></tr>)}</tbody></table>{!data.gradeProgress.sections.length && <p className="py-6 text-center text-sm text-slate-500">Học kỳ chưa có lớp tín chỉ.</p>}</div>
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle title="Báo cáo tóm tắt" subtitle={`Kết quả đã công bố đủ điểm trong ${term}; dùng quy tắc tính điểm và điều kiện đạt hiện có.`} />
        {data.report.completedEnrollments ? <><div className="grid grid-cols-2 gap-3"><ReportMetric label="Lượt học phần đã công bố đủ điểm" value={data.report.completedEnrollments.toLocaleString('vi-VN')} /><ReportMetric label="Đạt" value={data.report.passed.toLocaleString('vi-VN')} /><ReportMetric label="Chưa đạt" value={data.report.failed.toLocaleString('vi-VN')} /><ReportMetric label="Tỷ lệ đạt" value={`${data.report.passRate}%`} /></div></> : <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500 dark:bg-slate-950">Chưa có dữ liệu kết quả đã công bố đủ điểm.</p>}
        <Link className={`${secondary} mt-4 w-full`} href={gradeReportUrl}>Tra cứu báo cáo chi tiết <ArrowRight size={15} /></Link>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <SectionTitle title="Hoạt động gần đây" subtitle="Các thay đổi đào tạo ghi trong nhật ký hệ thống · toàn hệ thống." action={<Link className="text-sm font-semibold text-primary" href="/academic?tab=audit">Xem nhật ký</Link>} />
        {data.audits.length ? <ol className="divide-y divide-slate-100 dark:divide-slate-800">{data.audits.slice(0, 5).map(item => <li key={item.id} className="flex gap-3 py-3"><span className="mt-1 rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Clock3 size={15} /></span><div className="min-w-0 flex-1"><p className="text-sm"><strong>{item.actorName}</strong> · {item.actionLabel}</p><p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{item.entityLabel}</p><time className="mt-1 block text-xs text-slate-500">{fmtDateTime(item.createdAt)}</time></div></li>)}</ol> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950">Chưa có hoạt động đào tạo được ghi nhận.</p>}
      </div>
    </section>

    {rosterSection && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget && !rosterLoading) setRosterSection(null); }}><section role="dialog" aria-modal="true" aria-labelledby="roster-title" className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7"><div className="flex items-center justify-between gap-3"><div><h2 id="roster-title" className="text-xl font-bold">{roster?.title || `Danh sách sinh viên · ${rosterSection.code}`}</h2><p className="mt-1 text-sm text-slate-500">Chỉ gồm đăng ký còn hiệu lực.</p></div><button className={secondary} onClick={() => setRosterSection(null)}>Đóng</button></div>{rosterLoading ? <p className="py-12 text-center text-sm text-slate-500">Đang tải danh sách…</p> : rosterError ? <div className="py-8 text-center"><p role="alert" className="text-sm text-red-700">{rosterError}</p><button className={`${secondary} mt-3`} onClick={() => openRoster(rosterSection.id, rosterSection.code)}><RefreshCw size={15} /> Thử lại</button></div> : roster?.rows.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[460px] text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="py-3">Mã sinh viên</th><th className="py-3">Họ tên</th><th className="py-3">Lớp niên khóa</th></tr></thead><tbody className="divide-y">{roster.rows.map(row => <tr key={row.code}><td className="py-3 font-semibold">{row.code}</td><td className="py-3">{row.name}</td><td className="py-3">{row.cohort}</td></tr>)}</tbody></table></div> : <p className="py-12 text-center text-sm text-slate-500">Lớp chưa có sinh viên đăng ký còn hiệu lực.</p>}</section></div>}
  </div>;
}

function ProgressMetric({ title, value }: { title: string; value: number }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950"><p className="text-[11px] leading-4 text-slate-500">{title}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"><p className="text-xs leading-5 text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Users }) {
  return <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold transition hover:border-red-300 hover:bg-red-50 hover:text-primary dark:border-slate-800 dark:hover:border-red-900 dark:hover:bg-red-950/30"><span className="flex items-center gap-3"><Icon size={18} className="text-primary" />{label}</span><ArrowRight size={15} /></Link>;
}
