'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { completedSubjectCodes, studentSummary } from '@/lib/portal/analytics';
import { sameSemester, semesterLabel } from '@/lib/portal/semester';
import type { PortalView } from '@/lib/portal/types';

export default function CurriculumPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PortalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState('');
  const [query, setQuery] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await apiFetch('/api/portal', { cache: 'no-store' }); const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không tải được kết quả học tập.');
      setData(json.data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được dữ liệu.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user) { setData(null); void load(); } }, [user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps
  const own = data?.students.find(student => student.code.toLowerCase() === user?.studentCode?.toLowerCase());
  const curriculum = data?.studentCurriculum || null;
  const supported = !!curriculum;
  useEffect(() => {
    if (!data?.studentAcademicCalendar || !curriculum) return;
    const choices = data.studentAcademicCalendar.actualSemesters;
    const stored = window.sessionStorage.getItem('ptit:student-semester') || '';
    const preferred = choices.find(row => sameSemester(row.value, stored, data.catalogs))?.value || data.studentAcademicCalendar.currentSemester || data.studentAcademicCalendar.defaultSemester;
    const planned = data.studentAcademicCalendar.plannedSemesters.find(row => sameSemester(row.actualSemester, preferred, data.catalogs));
    setSemester(planned ? String(planned.id) : '');
  }, [data, curriculum]);
  const codes = data && own ? completedSubjectCodes(data, own.id) : new Set<string>();
  const summary = data && own ? studentSummary(data, own.id) : null;
  const earnedCredits = summary?.gpa != null ? summary.earnedCredits : own?.legacyCredits || 0;
  const allTerms = [...(curriculum?.terms || [])].sort((a, b) => a.sequence - b.sequence);
  const semesters = allTerms.filter(row => !semester || String(row.sequence) === semester).map(row => { const mapping = data?.studentAcademicCalendar?.plannedSemesters.find(term => term.id === row.sequence); return { ...row, actualSemester: mapping?.actualSemester || '', semesterName: row.name, courses: (curriculum?.courses || []).filter(course => course.termId === row.id && (course.code + ' ' + course.name).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))) }; }).filter(row => row.courses.length);
  const completedCount = (curriculum?.courses || []).filter(course => codes.has(course.code.toUpperCase())).length;
  function exportCsv() {
    const rows: unknown[][] = [['Học kỳ', 'Mã môn', 'Tên môn', 'Tín chỉ trong khung', 'Bắt buộc', 'Đã hoàn thành']];
    for (const row of semesters) for (const course of row.courses) rows.push([row.semesterName, course.code, course.name, course.credits, course.required ? 'Có' : 'Không', codes.has(course.code.toUpperCase()) ? 'Có' : 'Không']);
    const text = '\uFEFF' + rows.map(row => row.map(value => { let text = String(value ?? ''); if (/^[=+@-]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'chuong-trinh-dao-tao.csv'; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800"><div><h1 className="text-2xl font-bold text-primary">Chương trình đào tạo</h1><p className="mt-2 text-sm text-slate-500">{own ? own.major + ' · ' + own.academicYear : 'Theo dõi tiến độ từ kết quả học tập đã công bố.'}</p></div><button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">{loading ? 'Đang tải…' : 'Làm mới'}</button></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">Thử lại</button></div>}
    {loading && !data ? <p className="py-12 text-center text-slate-500">Đang tải chương trình và kết quả…</p> : data && <>
      <div className="flex flex-wrap gap-3"><div className="rounded-xl border border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Tín chỉ tích lũy · {summary?.gpa != null ? 'kết quả đã công bố' : 'số liệu tổng hợp cũ'}</p><strong className="text-2xl">{earnedCredits}</strong></div>{supported && <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs text-slate-500">Môn đã hoàn thành trong khung</p><strong className="text-2xl">{completedCount}</strong></div>}<Link href="/grades" className="self-center text-sm font-semibold text-primary">Xem kết quả học tập →</Link></div>
      {!supported ? <section className="rounded-2xl border border-slate-200 p-8 dark:border-slate-800"><h2 className="font-bold">{data.studentAcademicCalendar?.issue || (own?.curriculumId ? 'Chương trình được gán không khớp hồ sơ hiện tại' : 'Bạn chưa được gán chương trình đào tạo')}</h2><p className="mt-2 text-sm text-slate-500">Không tự chọn chương trình theo ngành hoặc khóa khác. Liên hệ Giáo vụ để kiểm tra chương trình được gán. Kết quả học tập, lớp đã đăng ký và thời khóa biểu vẫn được lọc theo học kỳ thực tế của bạn.</p></section> : <>
        <div className="flex flex-wrap gap-3 print:hidden"><select aria-label="Lọc học kỳ chương trình" value={semester} onChange={e => { const selected=e.target.value;setSemester(selected);const mapped=data.studentAcademicCalendar?.plannedSemesters.find(row=>String(row.id)===selected);if(mapped?.actualSemester)window.sessionStorage.setItem('ptit:student-semester',mapped.actualSemester); }} className="rounded-xl border bg-white px-3 py-2 text-sm dark:bg-slate-900"><option value="">Tất cả học kỳ dự kiến</option>{allTerms.map(row => {const mapped=data.studentAcademicCalendar?.plannedSemesters.find(term=>term.id===row.sequence);return <option key={row.id} value={row.sequence}>{row.name} (dự kiến) → {mapped?.actualSemester || 'Chưa ánh xạ'}</option>;})}</select><input aria-label="Tìm môn trong chương trình" placeholder="Tìm mã, tên môn…" value={query} onChange={e => setQuery(e.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm dark:bg-slate-900" /><button onClick={exportCsv} className="rounded-xl border px-4 py-2 text-sm">Xuất CSV</button><button onClick={() => window.print()} className="rounded-xl border px-4 py-2 text-sm">In chương trình</button></div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr>{['Mã môn', 'Tên môn học', 'Tín chỉ', 'Loại môn', 'Hoàn thành'].map(label => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{semesters.map(row => <React.Fragment key={row.id}><tr className="bg-slate-100 font-semibold dark:bg-slate-800"><td colSpan={5} className="px-4 py-3">Kỳ {row.sequence} trong chương trình · dự kiến {row.name}{row.actualSemester?` · học kỳ thực tế ${row.actualSemester}`:''} · {row.courses.length} môn đang hiển thị</td></tr>{row.courses.map(course => <tr key={course.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-3 font-mono text-primary">{course.code}</td><td className="px-4 py-3">{course.name}</td><td className="px-4 py-3">{course.credits}</td><td className="px-4 py-3">{course.required ? 'Bắt buộc' : 'Tự chọn'}</td><td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">{codes.has(course.code.toUpperCase()) ? '✓ Đã đạt' : '—'}</td></tr>)}</React.Fragment>)}</tbody></table>{!semesters.length && <p className="p-10 text-center text-sm text-slate-500">Không có môn học phù hợp bộ lọc.</p>}</div>
      </>}
    </>}
  </div>;
}
