'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface KpiCardProps {
  cumulativeGpa: number;
  targetGpa: number;
  earnedCredits: number;
  requiredCredits: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  cumulativeGpa,
  targetGpa,
  earnedCredits,
  requiredCredits,
}) => {
  const { t } = useLanguage();
  const gpaPercentage = Math.min(100, Math.round((cumulativeGpa / 4.0) * 100));
  const creditsPercentage = Math.min(100, Math.round((earnedCredits / requiredCredits) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* GPA Progress Card */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-surface-gray dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-base text-on-surface dark:text-gray-100">
              {t.cumulativeGpa}
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
              {t.targetGpa}: {targetGpa.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-ptit-red-light dark:bg-red-950/50 flex items-center justify-center text-primary dark:text-red-400">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-hanken font-bold text-3xl lg:text-4xl text-primary dark:text-red-400">
              {cumulativeGpa.toFixed(2)}
            </span>

          </div>
          <div className="w-full bg-surface-container-high dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-primary dark:bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${gpaPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Accumulated Credits Card */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl border border-surface-gray dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-base text-on-surface dark:text-gray-100">
              {t.totalCredits}
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
              {t.requiredCredits}: {requiredCredits}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed dark:bg-blue-950/50 flex items-center justify-center text-secondary dark:text-blue-400">
            <span className="material-symbols-outlined">library_books</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-hanken font-bold text-3xl lg:text-4xl text-on-surface dark:text-gray-100">
              {earnedCredits}
            </span>
            <span className="text-xs text-on-surface-variant dark:text-gray-400">
              / {requiredCredits} {t.earned} ({creditsPercentage}%)
            </span>
          </div>

          <div className="flex gap-1.5 mt-4">
            <div className={`h-2 flex-1 rounded-l-full ${creditsPercentage >= 20 ? 'bg-secondary' : 'bg-surface-container-high'}`} />
            <div className={`h-2 flex-1 ${creditsPercentage >= 40 ? 'bg-secondary' : 'bg-surface-container-high dark:bg-slate-800'}`} />
            <div className={`h-2 flex-1 ${creditsPercentage >= 65 ? 'bg-secondary' : 'bg-surface-container-high dark:bg-slate-800'}`} />
            <div className={`h-2 flex-1 ${creditsPercentage >= 85 ? 'bg-secondary' : 'bg-surface-container-high dark:bg-slate-800'}`} />
            <div className={`h-2 flex-1 rounded-r-full ${creditsPercentage >= 100 ? 'bg-secondary' : 'bg-surface-container-high dark:bg-slate-800'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
