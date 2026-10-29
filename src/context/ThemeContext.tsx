'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ isDarkMode: false, toggleTheme: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem('ptit_theme') === 'dark'); }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode); }, [isDarkMode]);
  function toggleTheme() {
    setDark(previous => { const next = !previous; localStorage.setItem('ptit_theme', next ? 'dark' : 'light'); return next; });
  }
  return <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
