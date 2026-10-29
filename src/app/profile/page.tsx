'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useStudent } from '@/context/StudentContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentStudent } = useStudent();
  const { user, role, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (role === 'student') router.replace('/#student-info');
    if (role === 'lecturer') router.replace('/lecturer#lecturer-profile');
  }, [authLoading, role, router]);

  if (role === 'student' || role === 'lecturer') return <p role="status">Đang mở hồ sơ trên Trang chủ…</p>;
  const isLecturer = user?.role === 'lecturer';
  const isAdmin = role === 'admin' || role === 'academic';

  // --- LECTURER PROFILE VIEW ---
  if (isLecturer) {
    const lecturerName = user?.name || 'TS. Nguyễn Thị Thu Hiền';
    const lecturerCode = (user as any)?.lecturerCode || 'GV2001';
    const lecturerDept = (user as any)?.department || 'Khoa Viễn thông 1';
    const lecturerEmail = user?.email || 'Hienntt@ptit.edu.vn';

    return (
      <div className="space-y-6 animate-in fade-in max-w-4xl">
        <div className="pb-4 border-b border-surface-gray dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-hanken text-on-surface dark:text-gray-100">
              Hồ sơ Giảng viên
            </h1>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Cán bộ Giảng viên
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
            Hồ sơ học thuật và thông tin cán bộ giảng viên Học viện Công nghệ Bưu chính Viễn thông.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-surface-gray dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-28 h-28 rounded-2xl bg-surface-gray dark:bg-slate-800 border-2 border-emerald-500/30 overflow-hidden shrink-0 relative shadow-md">
              <Image
                src={user?.avatarUrl || '/default-avatar.png'}
                alt="Lecturer Avatar"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold font-hanken text-on-surface dark:text-gray-100">
                    {lecturerName}
                  </h2>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                    {lecturerCode}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 font-semibold">
                  {lecturerDept} • Học viện Công nghệ Bưu chính Viễn thông
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-gray dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-400">Email công vụ:</span>
                  <p className="font-semibold text-on-surface dark:text-gray-200">{lecturerEmail}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400">Đơn vị công tác:</span>
                  <p className="font-semibold text-on-surface dark:text-gray-200">{lecturerDept}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400">Học hàm / Học vị:</span>
                  <p className="font-semibold text-on-surface dark:text-gray-200">Tiến sĩ (TS.) - Giảng viên cơ hữu</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400">Trạng thái công tác:</span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang giảng dạy (Học kỳ 1, 2024 - 2025)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN PROFILE VIEW ---
  if (isAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-4xl">
        <div className="pb-4 border-b border-surface-gray dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-hanken text-on-surface dark:text-gray-100">
              {role === 'academic' ? 'Hồ sơ Giáo vụ' : 'Hồ sơ Quản trị viên'}
            </h1>
            <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Quản trị viên Hệ thống
            </span>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
            Thông tin quản trị viên quản lý Cổng thông tin Sinh viên & Đào tạo PTIT.
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-surface-gray dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-28 h-28 rounded-2xl bg-surface-gray dark:bg-slate-800 border-2 border-purple-500/30 overflow-hidden shrink-0 relative shadow-md">
              <Image
                src={user?.avatarUrl || '/default-avatar.png'}
                alt="Admin Avatar"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold font-hanken text-on-surface dark:text-gray-100">
                    {user?.name || 'Quản trị viên PTIT'}
                  </h2>
                  <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                    {user?.username || 'admin@ptit'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 font-semibold">
                  {(user as any)?.department || 'Trung tâm Quản trị Mạng - Cơ sở Trần Phú'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-gray dark:border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-400">Email quản trị:</span>
                  <p className="font-semibold text-on-surface dark:text-gray-200">{user?.email || 'admin@ptit.edu.vn'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400">Phân quyền tài khoản:</span>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">{role === 'academic' ? 'Quản lý đào tạo & học vụ' : 'Toàn quyền Quản trị (Super Admin)'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STUDENT PROFILE VIEW (DEFAULT) ---
  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl">
      <div className="pb-4 border-b border-surface-gray dark:border-slate-800">
        <h1 className="text-2xl font-bold font-hanken text-on-surface dark:text-gray-100">
          {t.profileTitle}
        </h1>
        <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
          {t.profileDesc}
        </p>
      </div>

      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-surface-gray dark:border-slate-800 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-28 h-28 rounded-2xl bg-surface-gray dark:bg-slate-800 border-2 border-primary/20 overflow-hidden shrink-0 relative shadow-md">
            <Image
              src={currentStudent.avatarUrl || '/default-avatar.png'}
              alt="Student Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-hanken text-on-surface dark:text-gray-100">
                  {currentStudent.name}
                </h2>
                <span className="bg-ptit-red-light dark:bg-red-950/60 text-primary dark:text-red-400 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md">
                  {currentStudent.studentCode}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1 font-semibold">
                {currentStudent.major || t.majorValue} • {currentStudent.class}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-gray dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400">{t.email}:</span>
                <p className="font-semibold text-on-surface dark:text-gray-200">{currentStudent.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400">{t.faculty}:</span>
                <p className="font-semibold text-on-surface dark:text-gray-200">{currentStudent.faculty || t.facultyValue}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400">{t.academicYear}:</span>
                <p className="font-semibold text-on-surface dark:text-gray-200">{currentStudent.academicYear}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400">{t.standing}:</span>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {currentStudent.cumulativeGpa >= 3.6
                    ? t.standingExcellent
                    : currentStudent.cumulativeGpa >= 3.2
                    ? t.standingVeryGood
                    : currentStudent.cumulativeGpa >= 2.5
                    ? t.standingGood
                    : t.standingAverage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
