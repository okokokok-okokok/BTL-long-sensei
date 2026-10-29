'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { SupportModal } from '@/components/SupportModal';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { AnnouncementToast } from '@/components/AnnouncementToast';

function lecturerRouteAllowed(pathname: string) {
  return pathname.startsWith('/lecturer') || ['/courses', '/schedule', '/profile', '/settings', '/support'].includes(pathname);
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, isLoading } = useAuth();
  const { t } = useLanguage();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Strictly reset support modal for admin
  useEffect(() => {
    if (role === 'admin') {
      setIsSupportOpen(false);
    }
  }, [role]);

  useEffect(() => { setIsMobileSidebarOpen(false); }, [pathname]);

  const isLoginPage = pathname === '/login';

  // 1. If unauthenticated and trying to access protected routes, redirect to /login
  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoading, user, isLoginPage, router]);

  // 2. Role-based Route Protection
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'student') {
        if (pathname.startsWith('/lecturer') || pathname.startsWith('/admin') || pathname.startsWith('/academic-affairs')) {
          router.replace('/');
        }
      } else if (user.role === 'lecturer') {
        if (!lecturerRouteAllowed(pathname)) router.replace(pathname === '/grades' ? '/lecturer/results' : '/lecturer');
      } else if (user.role === 'academic') {
        if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/lecturer')) router.replace('/academic-affairs');
      } else if (user.role === 'admin') {
        if (pathname === '/' || pathname.startsWith('/lecturer')) {
          router.replace('/admin');
        }
      }
    }
  }, [isLoading, user, pathname, router]);

  // A. If on Login Page: Full-screen login layout (no Sidebar / Header / Chatbot)
  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full bg-surface dark:bg-slate-950">
        {children}
      </div>
    );
  }

  // B. Loading state while session is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface dark:bg-slate-950">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center animate-pulse border border-primary/20 shadow-md p-2">
          <Image src="/logo.png" alt="PTIT" width={44} height={44} className="object-contain" unoptimized />
        </div>
        <p className="mt-4 text-xs font-bold text-primary dark:text-red-400 text-center max-w-sm px-4">
          {t.academyName}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{t.loginAuthenticating}</p>
      </div>
    );
  }

  // C. If not authenticated, prevent rendering protected pages while redirecting
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface dark:bg-slate-950">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
          Chuyển hướng đến trang đăng nhập...
        </p>
      </div>
    );
  }

  // D. Role route mismatch guards
  if (user.role === 'student' && (pathname.startsWith('/lecturer') || pathname.startsWith('/admin') || pathname.startsWith('/academic-affairs'))) {
    return null;
  }
  if (user.role === 'lecturer' && !lecturerRouteAllowed(pathname)) {
    return null;
  }
  if (user.role === 'admin' && pathname.startsWith('/lecturer')) return null;
  if (user.role === 'academic' && pathname.startsWith('/lecturer')) return null;
  if (user.role === 'admin' && pathname === '/') {
    return null;
  }

  if (user.role === 'academic' && (pathname === '/' || pathname.startsWith('/admin'))) return null;

  // E. Authenticated & Authorized: Render full role-tailored dashboard
  return (
    <div className="flex min-h-screen w-full bg-surface dark:bg-slate-950 text-on-surface dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar with strictly role-tailored items */}
      {isMobileSidebarOpen && <button type="button" aria-label="Đóng menu" onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/45 md:hidden" />}
      <React.Suspense fallback={<div className="fixed left-0 top-0 h-full w-64 bg-surface dark:bg-inverse-surface border-r border-surface-gray" />}>
        <Sidebar onOpenSupport={() => setIsSupportOpen(true)} mobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      </React.Suspense>

      {/* Main Content Workspace */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-64">
        {/* Clean Sticky Header */}
        <Header onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        {/* Page Content View */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-surface dark:bg-slate-950">
          <div className="max-w-container-max-width mx-auto">{children}</div>
        </main>
      </div>

      {/* Support Modal (Chỉ dành cho Sinh viên và Giảng viên gửi yêu cầu) */}
      {(role === 'student' || role === 'lecturer') && (
        <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      )}

      {/* Chatbot AI Assistant (Góc phải màn hình, chỉ xuất hiện sau khi đăng nhập) */}
      <ChatbotWidget isLoginPage={false} />

      {/* Real-time Announcement Toast (Báo tin mới từ giaovu.ptit.edu.vn) */}
      <AnnouncementToast />
    </div>
  );
};
