import React from 'react';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { StudentProvider } from '@/context/StudentContext';
import { AnnouncementProvider } from '@/context/AnnouncementContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppShell } from '@/components/AppShell';
import { giaovuSiteUrl } from '@/lib/giaovu';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A bad announcement-source setting must not prevent authentication pages.
  let announcementsSite = '';
  try { announcementsSite = giaovuSiteUrl(); } catch { /* The public API reports the configuration error. */ }
  return (
    <html lang="vi" className="light">
      <head>
        <title>PTIT · Quản lý sinh viên</title>
        <meta
          name="description"
          content="Quản lý sinh viên, lớp học, lịch học và kết quả học tập PTIT."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-surface dark:bg-slate-950 text-on-surface dark:text-gray-100 antialiased transition-colors duration-200">
        <LanguageProvider>
          <AuthProvider>
            <StudentProvider>
              <AnnouncementProvider siteUrl={announcementsSite}>
                <ThemeProvider><AppShell>{children}</AppShell></ThemeProvider>
              </AnnouncementProvider>
            </StudentProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
