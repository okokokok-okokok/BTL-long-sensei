'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AcademicWorkspace } from '@/components/AcademicWorkspace';
import { SupportInbox } from '@/components/SupportInbox';

export type AdminSection = 'accounts' | 'support' | 'audit';

export function AdminWorkspace({ section }: { section: AdminSection }) {
  const { role } = useAuth();

  if (role !== 'admin') return null;
  return (
    <div className="space-y-5">
      {section === 'accounts' && <AcademicWorkspace onlyTab="users" />}
      {section === 'support' && <SupportInbox />}
      {section === 'audit' && <AcademicWorkspace onlyTab="audit" />}
    </div>
  );
}
