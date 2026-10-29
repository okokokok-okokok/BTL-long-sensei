import { ALL_SYSTEM_USERS } from '@/lib/auth';
import { mockRealStudents } from '@/lib/mockData';
import { demoAdditionalStudents } from './demo-students';
import { hashPassword } from './password';
import { enrichDemoAcademics } from './demo-enrichment';
import type { PortalState } from './types';
import { ensureDirectories } from './directories';
import { curriculumIdForDemoStudent } from '@/lib/demoCurricula';
import { importLegacyDemoCurricula } from './curricula';

// Local demo only. A real database imports existing rows instead (scripts/portal-migrate.ts).
export function createDemoState(): PortalState {
  const state: PortalState = { users: [], cohorts: [], students: [], subjects: [], sections: [], meetings: [], enrollments: [], results: [], audits: [], supportTickets: [], catalogs: [], lecturers: [], curriculumPrograms: [], curriculumVersions: [], curriculumAssignments: [] };
  state.users = ALL_SYSTEM_USERS.map(u => ({
    id: u.id, username: u.username, name: u.name, email: u.email, role: u.role,
    passwordHash: hashPassword(u.password), active: true, studentCode: u.studentCode || null,
    lecturerCode: u.lecturerCode || null, department: u.department || '', faculty: u.faculty || '', avatarUrl: u.avatarUrl,
  }));
  state.users.push({ id: 'usr-giaovu-ptit', username: 'giaovu@ptit', name: 'Phòng Giáo vụ', email: 'giaovu@ptit.edu.vn', role: 'academic', passwordHash: hashPassword('giaovu@123'), active: true, studentCode: null, lecturerCode: null, department: 'Phòng Giáo vụ', faculty: '', avatarUrl: '/default-avatar.png' });
  for (const s of [...mockRealStudents, ...demoAdditionalStudents]) {
    const cohortId = `cohort-${s.className}`;
    const startYear = Number(s.academicYear.slice(0, 4)) || 2023;
    const endYear = Number(s.academicYear.slice(-4)) || startYear + 4;
    if (!state.cohorts.some(c => c.id === cohortId)) state.cohorts.push({ id: cohortId, code: s.className, name: s.className, major: s.major, faculty: s.faculty, startYear, endYear, active: true });
    state.students.push({ id: s.id, code: s.studentCode, name: s.name, email: s.email, cohortId, major: s.major, faculty: s.faculty, academicYear: s.academicYear, curriculumId: curriculumIdForDemoStudent(s), phone: '', address: '', dateOfBirth: '', avatarUrl: s.avatarUrl, active: true, legacyGpa: s.cumulativeGpa, legacyCredits: s.earnedCredits, targetGpa: s.targetGpa, requiredCredits: s.requiredCredits });
  }
  enrichDemoAcademics(state);
  importLegacyDemoCurricula(state);
  ensureDirectories(state, process.env.PORTAL_CURRENT_SEMESTER);
  return state;
}
