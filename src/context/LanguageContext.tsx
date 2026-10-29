'use client';
import React, { createContext, useContext } from 'react';
import { Language, translations } from '@/lib/translations';
const LanguageContext = createContext({ language: 'vi' as Language, t: translations.vi });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext.Provider value={{ language: 'vi', t: translations.vi }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
