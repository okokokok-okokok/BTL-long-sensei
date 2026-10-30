import { assignedCurriculum, actualSemesterForTerm, plannedCourseCodes } from './curricula';
import { configuredCurrentSemester } from './academic-dashboard';
import { sameSemester, semesterValue, uniqueSemesterOptions, toSemesterChoice } from './semester';
import type { PortalState, Student, StudentAcademicCalendar } from './types';

type CalendarState = Pick<PortalState, 'enrollments' | 'sections' | 'results' | 'curriculumVersions'> & Partial<Pick<PortalState, 'catalogs'>>;

export function plannedCourseCodesForStudentInSemester(
  state: CalendarState,
  student: Student,
  actualSemester: string,
  _currentSemester = configuredCurrentSemester(),
): Set<string> | null {
  return plannedCourseCodes(state, student, actualSemester);
}

export function buildStudentAcademicCalendar(
  state: CalendarState,
  student: Student,
  currentSemester = configuredCurrentSemester(),
): StudentAcademicCalendar {
  const version = assignedCurriculum(state, student);
  const rawAssigned = student.curriculumId ? state.curriculumVersions.find(row => row.id === student.curriculumId) : null;
  const plannedSemesters = version ? [...version.terms].sort((a, b) => a.sequence - b.sequence).map(term => ({
    id: term.sequence,
    label: term.name,
    actualSemester: actualSemesterForTerm(version, student, term),
  })) : [];

  const choices = new Map<string, ReturnType<typeof toSemesterChoice>>();
  const actualValues: string[] = [];
  for (const row of plannedSemesters) {
    if (row.actualSemester) choices.set(row.actualSemester, toSemesterChoice(row.actualSemester, 'program'));
  }
  const ownEnrollments = state.enrollments.filter(row => row.studentId === student.id);
  for (const enrollment of ownEnrollments) {
    const section = state.sections.find(row => row.id === enrollment.sectionId);
    if (!section) continue;
    const hasResult = state.results.some(result => result.enrollmentId === enrollment.id);
    if (enrollment.status !== 'registered' && !hasResult) continue;
    const choice = toSemesterChoice(section.semester, 'actual');
    actualValues.push(choice.value);
    if (!choices.has(choice.value)) choices.set(choice.value, choice);
  }
  const actualSemesters = uniqueSemesterOptions([...choices.values()], state.catalogs);
  const configured = semesterValue(currentSemester);
  const current = actualSemesters.find(row => sameSemester(row.value, configured, state.catalogs))?.value || '';
  const latest = uniqueSemesterOptions(actualValues.map(value => toSemesterChoice(value, 'actual')), state.catalogs).at(-1)?.value || '';
  const mostRecentActual = actualSemesters.find(row => sameSemester(row.value, latest, state.catalogs))?.value || '';
  const defaultSemester = current || mostRecentActual || actualSemesters[0]?.value || '';
  let issue: string | undefined;
  if (!student.curriculumId) issue = 'Sinh viên chưa được gán chương trình đào tạo.';
  else if (!rawAssigned) issue = 'Không tìm thấy chương trình đang được gán.';
  else if (rawAssigned.status === 'draft') issue = 'Chương trình đang được gán chưa được công bố.';
  else if (!version) issue = 'Chương trình đang được gán không phù hợp hồ sơ ngành, khóa hoặc hệ đào tạo hiện tại.';
  return {
    programAssigned: !!version,
    curriculumId: version?.id || null,
    plannedSemesters,
    actualSemesters,
    currentSemester: current,
    defaultSemester,
    issue,
  };
}
