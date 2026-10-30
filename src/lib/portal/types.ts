import type { UserRole } from '@/types/auth';
import type { SupportRequest } from '@/types/support-request';

export interface PortalUser {
  id: string; username: string; name: string; email: string; role: UserRole;
  passwordHash: string; active: boolean; studentCode: string | null;
  lecturerCode: string | null; department: string; faculty: string; avatarUrl: string;
}
export interface Cohort {
  id: string; code: string; name: string; major: string; faculty: string;
  startYear: number; endYear: number; active: boolean;
}
export interface Student {
  id: string; code: string; name: string; email: string; cohortId: string | null;
  major: string; faculty: string; academicYear: string; degreeSystem?: string; curriculumId?: string | null; phone: string;
  address: string; dateOfBirth: string; avatarUrl: string; active: boolean;
  legacyGpa: number; legacyCredits: number; targetGpa: number; requiredCredits: number;
}
export interface Subject {
  id: string; code: string; name: string; credits: number; department: string; active: boolean;
}
export interface Section {
  id: string; code: string; subjectId: string; semester: string; lecturerId: string | null;
  capacity: number; status: 'draft' | 'open' | 'closed'; gradesLocked: boolean;
  registrationStart: string; registrationEnd: string; allowCrossProgram?: boolean; outsideCurriculum?: boolean;
  gradeWorkflowEnabled?: boolean; componentGradesPublishedAt?: string; componentReviewDeadline?: string;
  componentsTransferredAt?: string; componentsTransferredById?: string | null; componentsTransferredByName?: string;
}
export interface Meeting {
  id: string; sectionId: string; day: number; startPeriod: number; endPeriod: number;
  startDate: string; endDate: string; room: string;
}
export interface Enrollment {
  id: string; sectionId: string; studentId: string; status: 'registered' | 'cancelled'; registeredAt: string;
}
export interface Result {
  id: string; enrollmentId: string; attendance: number | null; midterm: number | null;
  exam: number | null; published: boolean; publishedAt?: string; updatedAt: string;
}
export interface GradeReconciliation {
  id: string; sectionId: string; enrollmentId: string; studentId: string; message: string;
  status: 'open' | 'resolved'; resolution: string; createdAt: string; updatedAt: string;
  resolvedAt: string | null; resolvedById: string | null; resolvedByName: string;
}
export interface Audit {
  id: string; actorId: string; actorName: string; action: string; entityId: string; createdAt: string;
}
export type CurriculumStatus = 'draft' | 'active' | 'retired';
export interface CurriculumProgram { id: string; code: string; name: string; active: boolean; }
export interface CurriculumTerm { id: string; sequence: number; name: string; yearOffset: number | null; termNumber: 1 | 2 | 3 | null; }
export interface CurriculumElectiveGroup { id: string; name: string; minCredits: number; }
export interface CurriculumCourseEntry {
  id: string; termId: string; subjectId: string | null; code: string; name: string; credits: number;
  required: boolean; electiveGroupId: string | null; prerequisiteCourseIds: string[];
}
export interface CurriculumVersion {
  id: string; programId: string; version: string; faculty: string; major: string; degreeSystem: string;
  intakeStartYear: number; intakeEndYear: number; planStartYear: number; status: CurriculumStatus;
  totalCreditsRequired: number; trainingTime: string; terms: CurriculumTerm[];
  electiveGroups: CurriculumElectiveGroup[]; courses: CurriculumCourseEntry[];
  createdAt: string; updatedAt: string; publishedAt: string;
}
export interface CurriculumAssignment {
  id: string; studentId: string; oldVersionId: string | null; newVersionId: string | null;
  reason: string; actorId: string; actorName: string; createdAt: string;
}
export type CatalogKind = 'faculty' | 'major' | 'department' | 'intake' | 'semester' | 'room' | 'degreeSystem';
export interface CatalogEntry {
  id: string; kind: CatalogKind; code: string; name: string; aliases: string[];
  parentId: string | null; active: boolean; startYear: number | null; endYear: number | null;
}
export interface Lecturer {
  id: string; code: string; name: string; email: string; faculty: string; department: string; active: boolean;
}
export interface PortalState {
  users: PortalUser[]; cohorts: Cohort[]; students: Student[]; subjects: Subject[];
  sections: Section[]; meetings: Meeting[]; enrollments: Enrollment[]; results: Result[]; audits: Audit[];
  supportTickets: SupportRequest[]; gradeReconciliations: GradeReconciliation[];
  catalogs: CatalogEntry[]; lecturers: Lecturer[];
  curriculumPrograms: CurriculumProgram[]; curriculumVersions: CurriculumVersion[]; curriculumAssignments: CurriculumAssignment[];
}
export type Actor = Pick<PortalUser, 'id' | 'username' | 'name' | 'role' | 'studentCode' | 'lecturerCode'>;
export type SafeUser = Omit<PortalUser, 'passwordHash'>;
export interface PortalView extends Omit<PortalState, 'users' | 'supportTickets' | 'curriculumPrograms' | 'curriculumVersions' | 'curriculumAssignments'> {
  users: SafeUser[]; me: Actor; storage: 'postgresql' | 'demo';
  currentSemester?: string;
  sectionCounts: Record<string, number>; cohortCounts: Record<string, number>;
  cancellationIssues: Record<string, string>;
  studentAcademicCalendar?: StudentAcademicCalendar | null;
  curriculumPrograms?: CurriculumProgram[];
  curriculumVersions?: CurriculumVersion[];
  curriculumAssignments?: CurriculumAssignment[];
  studentCurriculum?: (CurriculumVersion & { programCode: string; programName: string }) | null;
}
export interface SemesterChoice { value: string; label: string; source: 'program' | 'actual' }
export interface StudentAcademicCalendar { programAssigned: boolean; curriculumId: string | null; plannedSemesters: { id: number; label: string; actualSemester: string }[]; actualSemesters: SemesterChoice[]; currentSemester: string; defaultSemester: string; issue?: string }
