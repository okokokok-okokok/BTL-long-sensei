'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import type { PortalView } from '@/lib/portal/types';
import { sameSemester, semesterLabel } from '@/lib/portal/semester';

export function PersonalTodaySchedule() {
  const { user } = useAuth();
  const [data, setData] = useState<PortalView | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiFetch('/api/portal').then(async response => { const json = await response.json(); if (!response.ok) throw new Error(json.message); if (active) setData(json.data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [user?.id]);
  const now = new Date();
  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const today = `${todayParts.find(part => part.type === 'year')?.value}-${todayParts.find(part => part.type === 'month')?.value}-${todayParts.find(part => part.type === 'day')?.value}`;
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short' }).format(now);
  const weekdayNumber = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[weekday] || 0;
  const own = data?.students.find(s => s.code.toLowerCase() === user?.studentCode?.toLowerCase());
  const currentSemester = data?.studentAcademicCalendar?.defaultSemester || '';
  const ids = new Set(data?.enrollments.filter(e => e.studentId === own?.id && e.status === 'registered').map(e => e.sectionId));
  const meetings = data?.meetings.filter(m => ids.has(m.sectionId) && m.day === weekdayNumber && m.startDate <= today && m.endDate >= today && sameSemester(data.sections.find(section => section.id === m.sectionId)?.semester || '', currentSemester, data.catalogs)).sort((a, b) => a.startPeriod - b.startPeriod) || [];
  const scheduleHref = currentSemester ? `/schedule?semester=${encodeURIComponent(currentSemester)}` : '/schedule';
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:bg-slate-900 dark:border-slate-800"><div className="flex justify-between items-center gap-4 mb-4"><div><h2 className="font-bold text-lg">Lịch học hôm nay</h2>{currentSemester&&<p className="mt-1 text-xs text-slate-500">{semesterLabel(currentSemester)}</p>}</div><Link href={scheduleHref} className="text-sm font-semibold text-primary">Xem cả tuần →</Link></div>{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : !data ? <p className="text-sm text-slate-500">Đang tải lịch học…</p> : !data.studentAcademicCalendar?.programAssigned && <p className="mb-3 text-xs text-amber-800 dark:text-amber-200">Hồ sơ chưa được gán chương trình; lịch bên dưới lấy theo lớp đăng ký thực tế của bạn.</p>}{data && !meetings.length ? <p className="text-sm text-slate-500">Không có buổi học đã đăng ký trong ngày hôm nay.</p> : meetings.map(m => { const section = data!.sections.find(s => s.id === m.sectionId)!; const subject = data!.subjects.find(s => s.id === section.subjectId); return <div key={m.id} className="border-l-4 border-primary pl-4 py-2 mt-3"><p className="text-xs font-bold text-primary">Tiết {m.startPeriod}–{m.endPeriod} · {m.room}</p><h3 className="font-semibold mt-1">{subject?.name}</h3><p className="text-xs text-slate-500 mt-1">{section.code} · {data!.users.find(u => u.id === section.lecturerId)?.name}</p></div>; })}</section>;
}
