'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnnouncements } from '@/context/AnnouncementContext';

export const Announcements: React.FC = () => {
  const { t } = useLanguage();
  const { announcements, isLoading, refreshAnnouncements, markAsRead, allAnnouncementsUrl, error } = useAnnouncements();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const list = announcements;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAnnouncements();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleOpenNotice = (item: any) => {
    if (item.id) {
      markAsRead(item.id);
    }
    const url = item.link || allAnnouncementsUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-surface-gray dark:border-slate-800 flex flex-col hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all overflow-hidden h-full">
      {/* Header with Live Sync Indicator */}
      <div className="p-4 border-b border-surface-gray dark:border-slate-800 flex justify-between items-center bg-surface-bright dark:bg-slate-900 gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-red-400 shrink-0">
            campaign
          </span>
          <h3 className="font-semibold text-base text-on-surface dark:text-gray-100">
            {t.announcements}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            title="Đồng bộ thông báo mới từ giaovu.ptit.edu.vn"
            className="p-1 rounded-lg text-gray-400 hover:text-primary dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing || isLoading ? 'animate-spin' : ''}`}>
              sync
            </span>
          </button>
          <a
            href={allAnnouncementsUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary dark:text-red-400 hover:underline flex items-center gap-0.5 ml-1"
          >
            <span>{t.viewAll}</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </a>
        </div>
      </div>

      {/* Announcements List Body */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 max-h-[460px]">
        {error && <p role="alert" className="text-xs text-red-700 dark:text-red-300">Chưa tải được thông báo. Bấm đồng bộ để thử lại.</p>}
        {isLoading && list.length === 0 ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700 mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            Hiện chưa có thông báo mới nào
          </div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenNotice(item)}
              className="group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-surface-container-low dark:hover:bg-slate-800/60 transition-all"
            >
              <div className="flex gap-3 items-start">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 group-hover:scale-125 transition-transform ${
                    item.isUrgent ? 'bg-primary dark:bg-red-400' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-on-surface dark:text-gray-200 group-hover:text-primary dark:group-hover:text-red-400 transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                  {item.content && (
                    <p className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {item.timeAgo}
                    </span>
                    <span className="text-[10px] text-primary/70 dark:text-red-400/70 group-hover:text-primary dark:group-hover:text-red-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Xem tin</span>
                      <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
