'use client';

import { apiFetch } from '@/lib/apiFetch';
import { onPortalChanged } from '@/lib/portal-client-events';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '@/types/student';
const emptyProfile: StudentProfile = { id: '', studentCode: '', name: '', avatarUrl: '/default-avatar.png', email: '', major: '', class: '', faculty: '', academicYear: '', cumulativeGpa: 0, targetGpa: 3.5, earnedCredits: 0, requiredCredits: 140 };
import { useAuth } from '@/context/AuthContext';

export interface SimpleStudent {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  major: string;
  className: string;
  cumulativeGpa: number;
  earnedCredits: number;
}

interface StudentContextType {
  currentStudent: StudentProfile;
  error: string | null;
  studentsList: SimpleStudent[];
  setCurrentStudentCode: (code: string) => void;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentStudent, setCurrentStudent] = useState<StudentProfile>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [studentsList, setStudentsList] = useState<SimpleStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch student profile only when an authenticated student is logged in
  useEffect(() => {
    setCurrentStudent(emptyProfile); setError(null);
    if (user?.role === 'student' && user.studentCode) {
      loadStudent(user.studentCode);
      const unsubscribe = onPortalChanged(() => {
        if (user?.studentCode) void loadStudent(user.studentCode);
      });
      return () => unsubscribe();
    }
  }, [user?.id, user?.role, user?.studentCode]);

  const loadStudent = async (code: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await apiFetch(`/api/student?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.status === 'success' && json.data?.profile) {
        setCurrentStudent(json.data.profile);
      } else { throw new Error(json.message || 'Không tải được hồ sơ.'); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentStudentCode = (code: string) => {
    localStorage.setItem('active_student_code', code);
    loadStudent(code);
  };

  return (
    <StudentContext.Provider
      value={{
        currentStudent,
        error,
        studentsList,
        setCurrentStudentCode,
        isLoading,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
