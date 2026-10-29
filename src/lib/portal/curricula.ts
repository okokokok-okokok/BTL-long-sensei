import { curriculumDefinitions, intakeRange } from '@/lib/demoCurricula';
import { parseSemester, sameSemester, semesterLabel } from './semester';
import type { CurriculumCourseEntry, CurriculumProgram, CurriculumVersion, PortalState, Student } from './types';

const norm = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

export function curriculumMatchesStudent(version: CurriculumVersion, student: Pick<Student, 'faculty' | 'major' | 'academicYear' | 'degreeSystem'>) {
  const intake = intakeRange(student.academicYear);
  return !!intake && !!student.degreeSystem
    && norm(version.faculty) === norm(student.faculty)
    && norm(version.major) === norm(student.major)
    && norm(version.degreeSystem) === norm(student.degreeSystem)
    && intake.startYear >= version.intakeStartYear && intake.startYear <= version.intakeEndYear;
}

export function curriculumVersionMatchesStudent(version: CurriculumVersion, student: Pick<Student, 'faculty' | 'major' | 'academicYear' | 'degreeSystem'>) {
  return curriculumMatchesStudent(version, student);
}

export function assignedCurriculum(state: Pick<PortalState, 'curriculumVersions'>, student: Student) {
  if (!student.curriculumId) return null;
  const version = state.curriculumVersions.find(row => row.id === student.curriculumId);
  if (!version || version.status === 'draft' || !curriculumMatchesStudent(version, student)) return null;
  return version;
}

export function curriculumOptionsForStudent(state: Pick<PortalState, 'curriculumVersions'>, student: Pick<Student, 'faculty' | 'major' | 'academicYear' | 'degreeSystem'>) {
  return state.curriculumVersions.filter(version => version.status === 'active' && curriculumMatchesStudent(version, student));
}

export function curriculumCourseCodesForStudent(state: Pick<PortalState, 'curriculumVersions'>, student: Student): Set<string> | null {
  const version = assignedCurriculum(state, student);
  return version ? new Set(version.courses.map(course => course.code.toUpperCase())) : null;
}

export function curriculumVersionFromState(state: Pick<PortalState, 'curriculumVersions'>, id: string) {
  return state.curriculumVersions.find(version => version.id === id) || null;
}

export function importLegacyDemoCurricula(state: PortalState): boolean {
  let changed = false;
  state.curriculumPrograms ||= [];
  state.curriculumVersions ||= [];
  state.curriculumAssignments ||= [];
  for (const definition of curriculumDefinitions) {
    const programId = `legacy-program-${definition.id.replace(/-v\d+$/, '')}`;
    const program: CurriculumProgram = { id: programId, code: `LEGACY-${definition.id.toUpperCase()}`, name: definition.plan.majorName, active: true };
    if (!state.curriculumPrograms.some(row => row.id === programId)) {
      state.curriculumPrograms.push(program);
      changed = true;
    }
    let version = state.curriculumVersions.find(row => row.id === definition.id);
    if (!version) {
      const linkedIntakes = state.students.filter(student => student.curriculumId === definition.id).map(student => intakeRange(student.academicYear)?.startYear).filter((year): year is number => !!year);
      const terms = definition.plan.semesters.map(row => {
        const parsed = parseSemester(row.semesterName);
        return {
          id: `${definition.id}-term-${row.semesterId}`,
          sequence: row.semesterId,
          name: `Kỳ ${row.semesterId}`,
          yearOffset: parsed ? parsed.startYear - definition.planStartYear : null,
          termNumber: parsed ? parsed.summer ? 3 as const : parsed.term as 1 | 2 : null,
        };
      });
      const rawCourses = definition.plan.semesters.flatMap((term, index) => term.courses.map(course => ({ term, course, index })));
      const requiredCredits = rawCourses.filter(row => row.course.required).reduce((sum, row) => sum + row.course.credits, 0);
      const optionalCourses = rawCourses.filter(row => !row.course.required);
      const electiveGroupId = optionalCourses.length ? `${definition.id}-legacy-electives` : null;
      const electiveGroups = electiveGroupId ? [{ id: electiveGroupId, name: 'Tự chọn theo khung cũ', minCredits: Math.max(0, definition.plan.totalCredits - requiredCredits) }] : [];
      const courses: CurriculumCourseEntry[] = rawCourses.map(({ term, course }) => ({
        id: `${definition.id}-course-${course.code.toUpperCase()}`,
        termId: `${definition.id}-term-${term.semesterId}`,
        subjectId: state.subjects.find(subject => subject.code.toUpperCase() === course.code.toUpperCase())?.id || null,
        code: course.code,
        name: course.name,
        credits: course.credits,
        required: course.required,
        electiveGroupId: course.required ? null : electiveGroupId,
        prerequisiteCourseIds: [],
      }));
      version = {
        id: definition.id,
        programId,
        version: definition.version,
        faculty: definition.faculty,
        major: definition.major,
        degreeSystem: definition.degreeSystem,
        intakeStartYear: Math.min(definition.planStartYear, ...linkedIntakes),
        intakeEndYear: Math.max(definition.planStartYear, ...linkedIntakes),
        planStartYear: definition.planStartYear,
        status: 'active',
        totalCreditsRequired: definition.plan.totalCredits,
        trainingTime: definition.plan.trainingTime,
        terms,
        electiveGroups,
        courses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };
      state.curriculumVersions.push(version);
      changed = true;
    }
    for (const student of state.students) {
      if (student.curriculumId === definition.id && !student.degreeSystem) {
        student.degreeSystem = version.degreeSystem;
        changed = true;
      }
    }
  }
  return changed;
}

export function curriculumVersionLabel(version: CurriculumVersion, programs: CurriculumProgram[]) {
  const program = programs.find(row => row.id === version.programId);
  return `${program?.name || version.major} · ${version.degreeSystem} · phiên bản ${version.version}`;
}

export function actualSemesterForTerm(version: CurriculumVersion, student: Student, term: CurriculumVersion['terms'][number]) {
  const intake = intakeRange(student.academicYear);
  if (!intake || term.yearOffset === null || !term.termNumber) return '';
  const startYear = intake.startYear + term.yearOffset;
  const name = term.termNumber === 3 ? `Học kỳ hè · Năm học ${startYear}-${startYear + 1}` : `Học kỳ ${term.termNumber} · Năm học ${startYear}-${startYear + 1}`;
  return semesterLabel(name);
}

export function coursesInTerm(version: CurriculumVersion, termId: string) {
  return version.courses.filter(course => course.termId === termId);
}

export function plannedCourseCodes(state: Pick<PortalState, 'curriculumVersions'>, student: Student, actualSemester: string) {
  const version = assignedCurriculum(state, student);
  if (!version) return null;
  const intake = intakeRange(student.academicYear);
  const term = version.terms.find(row => actualSemesterForTerm(version, student, row) && sameSemester(actualSemesterForTerm(version, student, row), actualSemester));
  if (!intake || !term) return new Set<string>();
  return new Set(version.courses.filter(course => course.termId === term.id).map(course => course.code.toUpperCase()));
}

export function copyCurriculumVersion(source: CurriculumVersion, id: string, versionName: string, now = new Date().toISOString()): CurriculumVersion {
  const termIds = new Map(source.terms.map(term => [term.id, `${id}-term-${term.sequence}`]));
  const groupIds = new Map(source.electiveGroups.map((group, index) => [group.id, `${id}-group-${index + 1}`]));
  const courseIds = new Map(source.courses.map(course => [course.id, `${id}-course-${course.code.toUpperCase()}`]));
  return {
    ...structuredClone(source), id, version: versionName, status: 'draft', createdAt: now, updatedAt: now, publishedAt: '',
    terms: source.terms.map(term => ({ ...term, id: termIds.get(term.id)! })),
    courses: source.courses.map(course => ({ ...course, id: courseIds.get(course.id)!, termId: termIds.get(course.termId)!, electiveGroupId: course.electiveGroupId ? groupIds.get(course.electiveGroupId) || null : null, prerequisiteCourseIds: course.prerequisiteCourseIds.map(prerequisiteId => courseIds.get(prerequisiteId) || prerequisiteId) })),
    electiveGroups: source.electiveGroups.map(group => ({ ...group, id: groupIds.get(group.id)! })),
  };
}
