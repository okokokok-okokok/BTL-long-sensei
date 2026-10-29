'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { DemoAccounts } from '@/components/DemoAccounts';
import { PublicAcademicAnnouncements } from '@/components/PublicAcademicAnnouncements';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = await login(username, password);
    if (!res.success) {
      setErrorMessage(res.error || t.loginErrorDefault);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-100 via-gray-50 to-red-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-red-950/20">
      {/* Outer Grand Container (Dual-Pane Enterprise Academic Portal) */}
      <div className="w-full max-w-6xl min-h-screen sm:min-h-[640px] bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.18)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 border-0 sm:border border-surface-gray dark:border-slate-800">
        
        {/* Left Column: Official PTIT Identity Hero Banner (lg:col-span-6 xl:col-span-7) */}
        <div className="lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-[#800000] via-[#A00000] to-[#500000] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Luminous Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-3">
              {/* Official Crisp PTIT Emblem */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 p-1.5 flex items-center justify-center shadow-lg shrink-0">
                <Image
                  src="/logo.png"
                  alt="PTIT Logo"
                  width={60}
                  height={60}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold tracking-widest uppercase backdrop-blur-xs border border-white/20 mb-1">
                  {t.academyShort} • EST. 1953
                </span>
                <h1 className="text-lg sm:text-xl xl:text-2xl font-extrabold font-hanken tracking-tight leading-snug">
                  {t.academyName}
                </h1>
              </div>
            </div>

            <p className="text-white/80 text-xs font-medium leading-relaxed max-w-xl">
              {t.academySlogan}
            </p>
          </div>

          {/* Middle: Framed PTIT Campus Landmark Photograph */}
          <div className="relative z-10 my-3 group">
            <div className="relative w-full h-52 sm:h-56 md:h-60 rounded-2xl overflow-hidden border border-white/25 shadow-xl bg-black/20">
              <Image
                src="/campus.jpg"
                alt="Tòa nhà đa năng Học viện PTIT"
                fill
                className="object-cover object-[center_42%] transition-transform duration-700 group-hover:scale-105"
                priority
                unoptimized
              />
              {/* Subtle Vignette Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Location Pill below the photo (Unobstructed view) */}
            <div className="flex items-center gap-1.5 text-[11px] text-white/85 font-medium mt-1.5 px-1">
              <span className="material-symbols-outlined text-xs text-red-300 shrink-0">location_on</span>
              <span className="truncate">{t.campusLocation}</span>
            </div>
          </div>

          <PublicAcademicAnnouncements />
        </div>

        {/* Right Column: Authentication Form (lg:col-span-6 xl:col-span-5) */}
        <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-slate-900">
          
          {/* Thông tin cổng đăng nhập */}
          <div className="flex justify-between items-center pb-4 border-b border-surface-gray dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center p-1 border border-primary/20">
                <Image
                  src="/logo.png"
                  alt="PTIT"
                  width={22}
                  height={22}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="font-hanken font-bold text-xs text-primary dark:text-red-400 tracking-wider">
                {t.loginBrandBadge}
              </span>
            </div>

          </div>

          {/* Form Content Area */}
          <div className="my-auto py-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-hanken text-on-surface dark:text-white tracking-tight">
                {t.loginCardTitle}
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1.5 leading-relaxed">
                {t.loginCardSubtitle}
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-bold text-on-surface dark:text-gray-200 mb-1.5">
                  {t.loginUsernameLabel}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.loginUsernamePlaceholder}
                    required
                    autoFocus
                    className="w-full bg-surface-container-low dark:bg-slate-800 border border-surface-gray dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-xs font-medium text-on-surface dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-on-surface dark:text-gray-200 mb-1.5">
                  {t.loginPasswordLabel}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.loginPasswordPlaceholder}
                    required
                    className="w-full bg-surface-container-low dark:bg-slate-800 border border-surface-gray dark:border-slate-700 rounded-xl py-3 pl-10 pr-11 text-xs font-medium text-on-surface dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 bg-gradient-to-r from-primary to-ptit-red-dark hover:from-ptit-red-dark hover:to-primary text-white font-bold py-3.5 px-6 rounded-xl text-xs transition-all shadow-[0_4px_20px_rgba(209,0,0,0.3)] hover:shadow-[0_6px_25px_rgba(209,0,0,0.45)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.loginAuthenticating}</span>
                  </>
                ) : (
                  <>
                    <span>{t.loginButton}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
            <DemoAccounts onSelect={account => { setUsername(account.username); setPassword(account.password || ""); setErrorMessage(""); }} />
          </div>

          {/* Bottom Help & Copyright Footer */}
          <div className="pt-4 border-t border-surface-gray dark:border-slate-800 text-center text-[11px] text-gray-400 dark:text-gray-500">
            {t.loginFooterSupport}
          </div>
        </div>

      </div>
    </div>
  );
}
