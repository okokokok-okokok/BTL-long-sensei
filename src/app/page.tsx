'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { KpiCard } from '@/components/KpiCard';
import { Announcements } from '@/components/Announcements';
import { PersonalTodaySchedule } from '@/components/PersonalTodaySchedule';
import { useStudent } from '@/context/StudentContext';

export default function DashboardPage() {
  const { currentStudent, error, isLoading } = useStudent();

  useEffect(() => {
    if (isLoading || error || window.location.hash !== '#student-info') return;
    requestAnimationFrame(() => document.getElementById('student-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [currentStudent.id, error, isLoading]);

  if (isLoading) return <p>Đang tải hồ sơ…</p>;
  if (error) return <p role="alert" className="text-red-700">{error}</p>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <section id="student-info" aria-labelledby="student-info-title" className="scroll-mt-24 rounded-2xl border border-surface-gray bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-surface-gray bg-surface-container-low dark:border-slate-700 dark:bg-slate-800 sm:h-24 sm:w-24">
            <Image src={currentStudent.avatarUrl || '/default-avatar.png'} alt={`Ảnh đại diện ${currentStudent.name}`} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 id="student-info-title" className="font-hanken text-xl font-bold text-on-surface dark:text-gray-100 sm:text-2xl">Thông tin sinh viên</h1>
              <span className="rounded-md bg-ptit-red-light px-2.5 py-1 font-mono text-xs font-bold text-primary dark:bg-red-950/60 dark:text-red-400">{currentStudent.studentCode}</span>
            </div>
            <dl className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0 sm:col-span-2 xl:col-span-1"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Họ tên</dt><dd className="mt-0.5 break-words font-semibold text-on-surface dark:text-gray-100">{currentStudent.name}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Lớp niên khóa</dt><dd className="mt-0.5 break-words font-medium">{currentStudent.class || 'Chưa xếp lớp'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Ngành</dt><dd className="mt-0.5 break-words font-medium">{currentStudent.major || 'Chưa cập nhật'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Khoa</dt><dd className="mt-0.5 break-words font-medium">{currentStudent.faculty || 'Chưa cập nhật'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Niên khóa</dt><dd className="mt-0.5 break-words font-medium">{currentStudent.academicYear || 'Chưa cập nhật'}</dd></div>
              <div className="min-w-0"><dt className="text-xs text-on-surface-variant dark:text-gray-400">Email trường</dt><dd className="mt-0.5 break-all font-medium">{currentStudent.email || 'Chưa cập nhật'}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <KpiCard
            cumulativeGpa={currentStudent.cumulativeGpa}
            targetGpa={currentStudent.targetGpa}
            earnedCredits={currentStudent.earnedCredits}
            requiredCredits={currentStudent.requiredCredits}
          />
          <PersonalTodaySchedule />
        </div>
        <div className="lg:col-span-4">
          <Announcements />
        </div>
      </div>
    </div>
  );
}
