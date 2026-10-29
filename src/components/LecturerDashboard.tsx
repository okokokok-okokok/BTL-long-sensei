'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { PERIOD_TIMES } from '@/lib/portal/options';
import { sameSemester, semesterLabel, semesterChoices } from '@/lib/portal/semester';
import type { PortalView } from '@/lib/portal/types';

const control = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const sectionKey = 'ptit:lecturer-semester';

function dateInVietnam(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function weekdayInVietnam(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function LecturerDashboard() {
  const { user, role, isLoading: authLoading } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState<PortalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/portal', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không tải được dữ liệu giảng viên.');
      setData(json.data as PortalView);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được dữ liệu giảng viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && role === 'lecturer' && userId) void load();
  }, [authLoading, role, userId, load]);

  const semesters = useMemo(() => {
    const values = [...new Set((data?.sections || []).map(section => section.semester))];
    return semesterChoices(values, data?.catalogs);
  }, [data]);

  useEffect(() => {
    if (!data || role !== 'lecturer' || !userId) return;
    const stored = window.sessionStorage.getItem(sectionKey) || '';
    const next = semesters.find(term => sameSemester(term.value, stored, data.catalogs))?.value
      || semesters.find(term => sameSemester(term.value, data.currentSemester || '', data.catalogs))?.value
      || semesters.at(-1)?.value
      || '';
    setSemester(current => semesters.find(term => sameSemester(term.value, current, data.catalogs))?.value || next);
  }, [data, role, userId, semesters]);

  useEffect(() => {
    if (role === 'lecturer' && semester) window.sessionStorage.setItem(sectionKey, semester);
  }, [role, semester]);

  if (authLoading || loading && !data) return <div className="py-16 text-center text-slate-500">Đang tải trang chủ giảng viên…</div>;
  if (role !== 'lecturer') return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Trang này dành cho tài khoản giảng viên.</div>;
  if (!data || error) return <div className="rounded-2xl border border-red-200 bg-white p-6 dark:bg-slate-900"><p role="alert" className="mb-4 text-sm text-red-700">{error || 'Không tải được dữ liệu.'}</p><button type="button" onClick={() => void load()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Thử lại</button></div>;

  const profile = data.lecturers.find(row => row.code === user?.lecturerCode);
  const selectedSections = data.sections.filter(section => !semester || sameSemester(section.semester, semester, data.catalogs));
  const selectedIds = new Set(selectedSections.map(section => section.id));
  const studentRegistrations = data.enrollments.filter(enrollment => selectedIds.has(enrollment.sectionId) && enrollment.status === 'registered').length;
  const semesterMeetings = data.meetings.filter(meeting => selectedIds.has(meeting.sectionId));
  const today = dateInVietnam();
  const todaySchedule = data.meetings.filter(meeting => {
    const section = data.sections.find(row => row.id === meeting.sectionId);
    return !!section && selectedIds.has(section.id) && meeting.day === weekdayInVietnam(today) && meeting.startDate <= today && meeting.endDate >= today;
  }).sort((a, b) => a.startPeriod - b.startPeriod);
  const todayLabel = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  const departments = [...new Set([profile?.faculty || user?.faculty, profile?.department || user?.department].filter((value): value is string => !!value?.trim()))];
  const classHref = `/courses${semester ? `?semester=${encodeURIComponent(semester)}` : ''}`;
  const scheduleHref = `/schedule${semester ? `?semester=${encodeURIComponent(semester)}` : ''}`;

  return <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">PTIT · Cổng Giảng viên</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trang chủ</h1><p className="mt-2 text-sm text-slate-500">Lớp được phân công và lịch giảng dạy của bạn.</p></div>
      <div className="flex flex-wrap items-center gap-2"><label htmlFor="lecturer-home-semester" className="text-sm font-medium">Học kỳ</label><select id="lecturer-home-semester" className={control} value={semester} onChange={event => setSemester(event.target.value)}><option value="">Tất cả học kỳ</option>{semesters.map(term => <option key={term.value} value={term.value}>{term.label}</option>)}</select><button type="button" className={control} onClick={() => void load()} disabled={loading}>{loading ? 'Đang tải…' : 'Làm mới'}</button></div>
    </header>

    {data.storage === 'demo' && <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">Chế độ demo</span>}

    <section id="lecturer-profile" aria-labelledby="lecturer-profile-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"><Image src={user?.avatarUrl || '/default-avatar.png'} alt="Ảnh đại diện giảng viên" fill className="object-cover" unoptimized /></div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3"><h2 id="lecturer-profile-title" className="text-xl font-bold sm:text-2xl">Thông tin giảng viên</h2>{profile?.active !== undefined && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${profile.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{profile.active ? 'Hồ sơ đang hoạt động' : 'Hồ sơ ngừng hoạt động'}</span>}</div>
          <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0"><dt className="text-xs text-slate-500">Họ tên</dt><dd className="mt-0.5 break-words font-semibold">{user?.name || profile?.name || '—'}</dd></div>
            <div className="min-w-0"><dt className="text-xs text-slate-500">Mã giảng viên</dt><dd className="mt-0.5 break-words font-mono font-semibold">{profile?.code || user?.lecturerCode || '—'}</dd></div>
            <div className="min-w-0"><dt className="text-xs text-slate-500">Email công vụ</dt><dd className="mt-0.5 break-all font-medium">{profile?.email || user?.email || '—'}</dd></div>
            {departments.length > 0 && <div className="min-w-0 sm:col-span-2 xl:col-span-1"><dt className="text-xs text-slate-500">Khoa / đơn vị</dt><dd className="mt-0.5 break-words font-medium">{departments.join(' · ')}</dd></div>}
          </dl>
        </div>
      </div>
    </section>

    <section aria-label="Thống kê giảng dạy" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        ['Lớp được phân công', selectedSections.length],
        ['Lượt sinh viên đăng ký', studentRegistrations],
        ['Buổi học đã lập lịch', semesterMeetings.length],
      ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{semester ? semesterLabel(semester) : 'Các học kỳ được phân công'}</p></div>)}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Lịch giảng dạy hôm nay</h2><p className="mt-1 text-sm capitalize text-slate-500">{todayLabel}</p></div><Link href={scheduleHref} className="text-sm font-semibold text-primary hover:underline">Xem cả tuần →</Link></div>
        {todaySchedule.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{todaySchedule.map(meeting => {
          const section = data.sections.find(row => row.id === meeting.sectionId)!;
          const subject = data.subjects.find(row => row.id === section.subjectId);
          const start = PERIOD_TIMES[meeting.startPeriod - 1]?.split('–')[0] || '';
          const end = PERIOD_TIMES[meeting.endPeriod - 1]?.split('–')[1] || '';
          return <li key={meeting.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold">{subject?.name || 'Môn học'} <span className="font-normal text-slate-500">· {section.code}</span></p><p className="mt-1 text-sm text-slate-500">Tiết {meeting.startPeriod}–{meeting.endPeriod} · {start}–{end} · {meeting.room}</p></div><Link href={classHref} className="shrink-0 text-sm font-semibold text-primary hover:underline">Lớp giảng dạy</Link></li>;
        })}</ul> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Không có buổi giảng trong ngày được chọn.</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Lớp giảng dạy</h2><p className="mt-1 text-sm text-slate-500">{semester ? semesterLabel(semester) : 'Các học kỳ được phân công'}</p></div><Link href={classHref} className="text-sm font-semibold text-primary hover:underline">Xem tất cả →</Link></div>
        {selectedSections.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{selectedSections.slice(0, 4).map(section => {
          const subject = data.subjects.find(row => row.id === section.subjectId);
          return <li key={section.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold">{section.code} · {subject?.name || 'Môn học'}</p><p className="mt-1 text-sm text-slate-500">{subject?.code || '—'} · {subject?.credits || 0} tín chỉ · {data.sectionCounts[section.id] || 0}/{section.capacity} sinh viên</p></div><Link href={`/lecturer/results?section=${encodeURIComponent(section.id)}&semester=${encodeURIComponent(section.semester)}`} className="shrink-0 text-sm font-semibold text-primary hover:underline">Kết quả lớp</Link></li>;
        })}</ul> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Không có lớp được phân công trong học kỳ này.</p>}
      </div>
    </section>
  </div>;
}
