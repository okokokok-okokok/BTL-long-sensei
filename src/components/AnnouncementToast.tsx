'use client';

import React, { useEffect } from 'react';
import { useAnnouncements } from '@/context/AnnouncementContext';

export const AnnouncementToast: React.FC = () => {
  const { newToastItem, dismissToast, markAsRead } = useAnnouncements();

  useEffect(() => {
    if (!newToastItem) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 12000);
    return () => clearTimeout(timer);
  }, [newToastItem, dismissToast]);

  if (!newToastItem) return null;

  const handleOpenLink = () => {
    markAsRead(newToastItem.id);
    if (newToastItem.link) {
      window.open(newToastItem.link, '_blank', 'noopener,noreferrer');
    }
    dismissToast();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 border-2 border-primary/30 dark:border-red-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-ptit-red-light dark:bg-red-950/80 text-primary dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-xl animate-bounce">
              campaign
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-red-400">
                  Thông báo mới • Giáo vụ PTIT
                </span>
              </div>
              <button
                onClick={dismissToast}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-2 leading-snug">
              {newToastItem.title}
            </h4>

            {newToastItem.content && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {newToastItem.content}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-slate-800">
              <span className="text-[10px] text-gray-400 font-medium">
                {newToastItem.timeAgo}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={dismissToast}
                  className="px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleOpenLink}
                  className="px-3 py-1 text-[11px] font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg shadow-xs flex items-center gap-1 transition-all"
                >
                  <span>Xem trên Giáo vụ</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
