'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnnouncementItem } from '@/types/student';
import { useLanguage } from '@/context/LanguageContext';
import { useStudent } from '@/context/StudentContext';
import { useAuth } from '@/context/AuthContext';
import { useAnnouncements } from '@/context/AnnouncementContext';
import { useTheme } from '@/context/ThemeContext';

interface HeaderProps {
  announcements?: AnnouncementItem[];
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ announcements: propAnnouncements, onOpenMobileMenu }) => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { currentStudent, studentsList, setCurrentStudentCode, isLoading } = useStudent();
  const { user, role, logout } = useAuth();
  const { announcements: liveAnnouncements, unreadCount: liveUnreadCount, markAsRead, markAllAsRead, source, allAnnouncementsUrl } = useAnnouncements();
  const { isDarkMode, toggleTheme } = useTheme();
  const isStudentHome = role === 'student' && pathname === '/';
  const isLecturerHome = role === 'lecturer' && pathname === '/lecturer';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);

  const displayAnnouncements = propAnnouncements && propAnnouncements.length > 0 ? propAnnouncements : liveAnnouncements;
  const unreadCount = propAnnouncements ? propAnnouncements.filter((a) => !a.read).length : liveUnreadCount;

  return (
    <header className="sticky top-0 z-40 flex w-full min-w-0 items-center justify-between px-3 sm:px-6 lg:px-8 bg-surface-container-lowest dark:bg-inverse-surface h-16 border-b border-surface-gray dark:border-slate-800 transition-colors duration-200">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button type="button" onClick={onOpenMobileMenu} aria-label="Mở menu" className="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low dark:text-gray-300 dark:hover:bg-slate-800 md:hidden">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="min-w-0 flex-1 truncate font-hanken text-[18px] font-bold text-primary dark:text-inverse-primary sm:text-[22px]">
          {t.portalTitle}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4">
        {/* Giao diện sáng / tối */}
        <button
          onClick={toggleTheme}
          title={isDarkMode ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
          className="p-2 rounded-full text-on-surface-variant dark:text-gray-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Thông báo Giáo vụ PTIT"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-gray-900 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-surface-gray dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center pb-3 border-b border-surface-gray dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-on-surface dark:text-white flex items-center gap-1.5">
                    <span>{t.notifications}</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-ptit-red-light dark:bg-red-950/60 text-primary dark:text-red-400 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      aria-label="Đánh dấu tất cả thông báo đã đọc"
                      className="text-xs text-primary dark:text-red-400 hover:underline"
                    >
                      {t.markAllRead}
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto flex flex-col gap-2.5">
                {displayAnnouncements.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    Không có thông báo mới
                  </div>
                ) : (
                  displayAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markAsRead(item.id);
                        if (item.link) {
                          window.open(item.link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`text-xs p-2.5 rounded-lg cursor-pointer transition-colors border ${
                        !item.read
                          ? 'bg-ptit-red-light/30 dark:bg-red-950/30 border-primary/20 dark:border-red-900/30'
                          : 'hover:bg-surface-container-low dark:hover:bg-slate-800 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!item.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface dark:text-gray-200 leading-snug line-clamp-2">
                            {item.title}
                          </p>
                          {item.content && (
                            <p className="text-on-surface-variant dark:text-gray-400 mt-1 line-clamp-2 text-[11px] leading-relaxed">
                              {item.content}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px] text-gray-400">
                            <span>{item.timeAgo}</span>
                            <span className="text-primary dark:text-red-400 font-medium flex items-center gap-0.5">
                              <span>Xem</span>
                              <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-surface-gray dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Nguồn: {source}
                </span>
                <a
                  href={allAnnouncementsUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary dark:text-red-400 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <span>Mở trang Giáo vụ</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Role / Student Switcher */}
        <div className="relative border-l border-surface-gray dark:border-slate-800 pl-2">
          <button
            onClick={() => setShowStudentMenu(!showStudentMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
            title="Tài khoản & Vai trò người dùng"
          >
            <div className={isStudentHome || isLecturerHome ? 'hidden' : 'text-right hidden sm:block'}>
              <span className="font-semibold text-xs text-on-surface dark:text-gray-200 block truncate max-w-[130px]">
                {isLoading ? '...' : user?.name || currentStudent.name}
              </span>
              <span className="text-[10px] font-bold block">
                {role === 'academic' ? <span className="text-amber-600">Cổng Giáo vụ</span> : role === 'admin' ? (
                  <span className="text-purple-600 dark:text-purple-400">{t.roleAdmin}</span>
                ) : role === 'lecturer' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">{t.roleLecturer}</span>
                ) : (
                  <span className="text-primary dark:text-red-400 font-mono">{user?.studentCode || currentStudent.studentCode}</span>
                )}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-gray dark:bg-slate-700 border border-surface-gray dark:border-slate-600 overflow-hidden shrink-0 shadow-xs relative">
              <Image
                src={user?.avatarUrl || currentStudent.avatarUrl || '/default-avatar.png'}
                alt="User Avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <span className="material-symbols-outlined text-xs text-gray-400">expand_more</span>
          </button>

          {/* User Account Details Dropdown */}
          {showStudentMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-surface-gray dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              {/* User Profile Card */}
              <div className="px-4 pb-3 border-b border-surface-gray dark:border-slate-800">
                <p className="text-xs font-bold text-on-surface dark:text-gray-100 truncate">
                  {user?.name || currentStudent.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                  {user?.email || `${user?.username || 'user'}@ptit.edu.vn`}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      role === 'admin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : role === 'lecturer'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {role === 'academic' ? 'Tài khoản Giáo vụ' : role === 'admin' ? t.roleAccountAdmin : role === 'lecturer' ? t.roleAccountLecturer : t.roleAccountStudent}
                  </span>
                </div>
              </div>

              {/* Role Specific Details */}
              <div className="p-3 text-xs space-y-1.5 text-gray-600 dark:text-gray-300 border-b border-surface-gray dark:border-slate-800">
                {role === 'student' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-[11px]">{t.studentIdLabel}:</span>
                      <span className="font-mono font-bold">{user?.studentCode || currentStudent.studentCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-[11px]">{t.classLabel}:</span>
                      <span className="font-semibold">{currentStudent.class}</span>
                    </div>
                  </>
                )}
                {role === 'lecturer' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-[11px]">{t.lecturerIdLabel}:</span>
                      <span className="font-mono font-bold">{user?.lecturerCode || user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-[11px]">{t.facultyLabel}:</span>
                      <span className="font-semibold">{user?.faculty || user?.department || '—'}</span>
                    </div>
                  </>
                )}
                {role === 'admin' && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-[11px]">{t.adminPrivilegeLabel}:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{t.adminPrivilegeValue}</span>
                  </div>
                )}
              </div>

              {/* Dropdown Footer Actions */}
              <div className="pt-2 px-3">
                <button
                  onClick={() => {
                    setShowStudentMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t.logoutAction}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
