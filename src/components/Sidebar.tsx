'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  onOpenSupport?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSupport, mobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { user, role, logout } = useAuth();

  // Dynamic Navigation strictly isolated by Role and 100% translated
  const academicLink = { name: 'Quản lý đào tạo', href: '/academic', icon: 'account_balance' };
  const getNavItems = () => {
    if (role === 'academic') return [
      { name: 'Không gian Giáo vụ', href: '/academic-affairs', icon: 'dashboard' }, academicLink,
      { name: 'Tiếp nhận yêu cầu', href: '/support', icon: 'support_agent' },
      { name: 'Thời khóa biểu chung', href: '/schedule', icon: 'calendar_view_week' },
    ];
    if (role === 'admin') {
      return [
        { name: 'Tài khoản & phân quyền', href: '/admin/accounts', icon: 'manage_accounts' },
        { name: 'Yêu cầu tài khoản & báo lỗi', href: '/admin/support', icon: 'support_agent' },

        { name: 'Nhật ký hệ thống', href: '/admin/audit', icon: 'history' },
      ];
    }
    if (role === 'lecturer') {
      return [
        { name: t.navDashboard, href: '/lecturer', icon: 'dashboard' },
        { name: 'Lớp giảng dạy', href: '/courses', icon: 'school' },
        { name: t.navLecturerGrades, href: '/lecturer/results', icon: 'visibility' },
        { name: 'Lịch giảng dạy', href: '/schedule', icon: 'calendar_view_week' },
      ];
    }
    // Default: Student
    return [
      { name: t.navDashboard, href: '/', icon: 'dashboard' },
      { name: 'Lớp niên khóa', href: '/my-cohort', icon: 'groups' },
      { name: 'Lớp tín chỉ', href: '/my-sections', icon: 'school' },
      { name: 'Kết quả học tập', href: '/grades', icon: 'grade' },
      { name: t.navScheduleWeek || 'Thời khóa biểu tuần', href: '/schedule', icon: 'calendar_view_week' },
      { name: 'Đăng ký lớp tín chỉ', href: '/courses', icon: 'add_circle' },
      { name: t.navCurriculum || 'Chương trình đào tạo', href: '/curriculum', icon: 'fact_check' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav aria-label="Điều hướng chính" className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-surface-gray bg-surface px-4 py-6 transition-transform duration-200 dark:border-on-surface-variant dark:bg-inverse-surface md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Logo Header */}
      <div className="mb-6 flex items-center gap-3.5 px-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-surface-gray">
          <Image
            src="/logo.png"
            alt="PTIT Logo"
            width={36}
            height={36}
            className="w-full h-full object-contain p-0.5"
            unoptimized
          />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-hanken font-bold text-[22px] leading-6 text-primary dark:text-inverse-primary">
            PTIT
          </h1>
          <p className="font-inter text-[11px] text-on-surface-variant dark:text-gray-400 truncate">
            {t.studentManagement}
          </p>
        </div>
        <button type="button" aria-label="Đóng menu" onClick={onCloseMobile} className="ml-auto rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high dark:text-gray-300 dark:hover:bg-slate-800 md:hidden">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Role Identity Tag */}
      <div className="mb-4 px-3">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/80 border border-surface-gray dark:border-slate-700/60">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              role === 'admin'
                ? 'bg-purple-500'
                : role === 'lecturer'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
          />
          <span className="text-[11px] font-bold text-on-surface dark:text-gray-200 uppercase tracking-wider truncate">
            {role === 'academic' ? 'Cổng Giáo vụ' : role === 'admin'
              ? t.roleAdmin
              : role === 'lecturer'
              ? t.roleLecturer
              : t.roleStudent}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          let isActive = pathname === item.href;
          if (item.href.includes('?')) {
            const [path, query] = item.href.split('?');
            const tabVal = new URLSearchParams(query).get('tab');
            isActive = pathname === path && searchParams.get('tab') === tabVal;
          } else if (item.href === '/admin') {
            isActive = pathname === '/admin' && !searchParams.get('tab');
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-ptit-red-light dark:bg-primary-container text-primary dark:text-on-primary-container shadow-xs font-bold'
                    : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          );
        })}
        {role === 'admin' && <li className="mt-3 border-t border-surface-gray pt-3 dark:border-slate-800"><details key={pathname.startsWith('/admin') ? 'admin' : 'training'} open={!pathname.startsWith('/admin')}><summary className="cursor-pointer rounded-xl px-3.5 py-2.5 text-xs font-semibold text-on-surface-variant">Nghiệp vụ đào tạo</summary><ul className="mt-1 space-y-1">{[{ name: 'Không gian Giáo vụ', href: '/academic-affairs' }, { name: 'Quản lý đào tạo', href: '/academic' }, { name: 'Thời khóa biểu chung', href: '/schedule' }].map(item => <li key={item.href}><Link href={item.href} onClick={onCloseMobile} aria-current={pathname === item.href ? 'page' : undefined} className={`block rounded-xl px-5 py-2.5 text-xs ${pathname === item.href ? 'bg-ptit-red-light font-semibold text-primary dark:bg-primary-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>{item.name}</Link></li>)}</ul></details></li>}
      </ul>

      {/* Bottom Footer Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-surface-gray dark:border-slate-800/60">
        {(role === 'student' || role === 'lecturer') && (
          <button
            onClick={() => { onCloseMobile?.(); onOpenSupport?.(); }}
            className="w-full bg-primary hover:bg-ptit-red-dark text-on-primary rounded-xl py-2.5 px-4 text-xs font-semibold transition-colors shadow-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">support_agent</span>
            {t.contactSupport}
          </button>
        )}

        <Link
          href="/settings"
          onClick={onCloseMobile}
          className={`flex items-center gap-3 px-3.5 py-2 hover:bg-surface-container-high dark:hover:bg-slate-800 text-on-surface-variant dark:text-surface-variant text-xs rounded-xl transition-all ${
            pathname === '/settings' ? 'bg-surface-container-low font-semibold' : ''
          }`}
        >
          <span className="material-symbols-outlined text-base">settings</span>
          {t.settings}
        </Link>

        <button
          onClick={() => { onCloseMobile?.(); void logout(); }}
          className="flex items-center gap-3 text-on-surface-variant dark:text-surface-variant hover:text-error dark:hover:text-red-400 px-3.5 py-2 hover:bg-surface-container-high dark:hover:bg-slate-800 text-xs rounded-xl transition-all text-left w-full cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          {t.logout}
        </button>
      </div>
    </nav>
  );
};
