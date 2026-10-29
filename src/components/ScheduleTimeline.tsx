'use client';

import React from 'react';
import { ScheduleBlock } from '@/types/student';
import { useLanguage } from '@/context/LanguageContext';

interface ScheduleTimelineProps {
  schedule: ScheduleBlock[];
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ schedule }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-surface-gray dark:border-slate-800 overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all">
      <div className="p-4 sm:p-5 border-b border-surface-gray dark:border-slate-800 flex justify-between items-center bg-surface-bright dark:bg-slate-900">
        <h3 className="font-semibold text-base text-on-surface dark:text-gray-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-red-400">
            calendar_today
          </span>
          {t.todaysSchedule}
        </h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded border border-surface-gray dark:border-slate-700 flex items-center justify-center text-on-surface-variant dark:text-gray-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button className="w-8 h-8 rounded border border-surface-gray dark:border-slate-700 flex items-center justify-center text-on-surface-variant dark:text-gray-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="w-full flex flex-col gap-3">
          {schedule.map((item) => {
            const courseInfo = (t.courses as Record<string, { name: string; instructor: string; room: string }>)[item.courseCode];
            const courseName = courseInfo?.name || item.courseName;
            const instructor = courseInfo?.instructor || item.instructor;
            const room = courseInfo?.room || item.room;

            return (
              <div
                key={item.id}
                className={`relative border rounded-xl p-3 sm:p-3.5 flex justify-between items-center transition-all cursor-pointer hover:shadow-md gap-3 ${
                  item.colorType === 'red'
                    ? 'bg-ptit-red-light/40 dark:bg-red-950/20 border-outline-variant dark:border-red-900/40'
                    : item.colorType === 'blue'
                    ? 'bg-secondary-fixed/40 dark:bg-blue-950/20 border-secondary-fixed dark:border-blue-900/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                }`}
              >
                {/* Left Color Indicator Strip */}
                <div
                  className={`w-1.5 absolute left-0 top-0 bottom-0 rounded-l-xl ${
                    item.colorType === 'red'
                      ? 'bg-primary'
                      : item.colorType === 'blue'
                      ? 'bg-secondary'
                      : 'bg-emerald-600'
                  }`}
                />

                <div className="pl-2.5 min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-on-surface dark:text-gray-100 truncate">
                    {courseName}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant dark:text-gray-400 mt-0.5 truncate">
                    {item.courseCode} • {room}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-on-surface dark:text-gray-200 block whitespace-nowrap">
                    {item.startTime} - {item.endTime}
                  </span>
                  <span className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-0.5 block whitespace-nowrap truncate max-w-[160px] sm:max-w-[200px]">
                    {instructor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
