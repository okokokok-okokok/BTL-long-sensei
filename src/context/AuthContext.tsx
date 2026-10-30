'use client';

import { apiFetch } from '@/lib/apiFetch';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, UserRole } from '@/types/auth';


interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionCheckStarted = useRef(false);
  const router = useRouter();

  // 1. Check session on mount (Strictly session-scoped to the active browser tab)
  useEffect(() => {
    if (sessionCheckStarted.current) return;
    sessionCheckStarted.current = true;
    void checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Clean up any legacy persistent localStorage so session never leaks across browser restarts
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ptit_current_user');
      }

      // Check sessionStorage (only lives within the current active tab; empty on new visit)
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem('ptit_session_user') : null;
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('ptit_session_token') : null;

      if (cached && token) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);

          // Verify with backend passing Bearer token
          const res = await apiFetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          });
          const json = await res.json();
          if (json.status === 'success' && json.data?.user) {
            setUser(json.data.user);
            sessionStorage.setItem('ptit_session_user', JSON.stringify(json.data.user));
          } else {
            setUser(null);
            sessionStorage.removeItem('ptit_session_user');
            sessionStorage.removeItem('ptit_session_token');
          }
        } catch (e) {
          setUser(null);
          sessionStorage.removeItem('ptit_session_user');
          sessionStorage.removeItem('ptit_session_token');
        }
      } else {
        // No active session in this tab -> Force login!
        setUser(null);
      }
    } catch (err) {
      console.warn('Session check notice:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (json.status === 'success' && json.data?.user) {
        const loggedUser: AuthUser = json.data.user;
        const token: string = json.data.token || '';

        setUser(loggedUser);
        
        // Save strictly to sessionStorage (destroyed when tab or browser is closed)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('ptit_session_user', JSON.stringify(loggedUser));
          if (token) {
            sessionStorage.setItem('ptit_session_token', token);
          }
          localStorage.removeItem('ptit_current_user');
        }

        // Redirect based on role
        if (loggedUser.role === 'admin') {
          router.push('/admin');
        } else if (loggedUser.role === 'academic') {
          router.push('/academic-affairs');
        } else if (loggedUser.role === 'lecturer') {
          router.push('/lecturer');
        } else {
          router.push('/');
        }

        return { success: true, user: loggedUser };
      } else {
        return { success: false, error: json.message || 'Tài khoản hoặc mật khẩu không chính xác' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Không thể kết nối máy chủ xác thực' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!window.dispatchEvent(new Event('ptit:before-navigation', { cancelable: true }))) return;
    setIsLoading(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ptit_session_user');
        sessionStorage.removeItem('ptit_session_token');
        localStorage.removeItem('ptit_current_user');
        localStorage.removeItem('active_student_code');
      }
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
