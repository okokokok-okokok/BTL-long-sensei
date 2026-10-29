import type { PortalState, Meeting, Section, Subject } from './types';
import { hashPassword } from './password';
import { demoAdditionalCohorts, demoAdditionalStudents } from './demo-students';
import { curriculumById, curriculumCourseCatalog, curriculumCourseCodesForStudent, curriculumIdForDemoStudent, studentMatchesCurriculum } from '@/lib/demoCurricula';
import { demoAdditionalLecturers } from './demo-lecturers';
import { configuredCurrentSemester } from './academic-dashboard';
import { buildStudentAcademicCalendar, plannedCourseCodesForStudentInSemester } from './student-calendar';
import { parseSemester, sameSemester, semesterLabel } from './semester';
import { ensureDirectories } from './directories';

const DEMO_FACULTIES = ['Khoa Viễn thông 1', 'Khoa Công nghệ thông tin 1', 'Khoa An toàn thông tin'];

const lecturerByCourse: Record<string, string> = {
  INT1402: 'usr-gv-hienntt', INT3306: 'usr-gv-tranquocbao', INT1306: 'usr-gv-tranquocbao',
  INT3401: 'usr-gv-leminhduc', INT3502: 'usr-gv-leminhduc', INT1339: 'usr-gv-vuanhtuan',
  INT1468: 'usr-gv-leminhduc', INT3308: 'usr-gv-tranquocbao', INT1334: 'usr-gv-vuanhtuan',
  TEL1405: 'usr-gv-phamthuha', TEL2402: 'usr-gv-nguyenhoangnam',
};

const preferredRoomByCourse: Record<string, string> = {
  INT1402: '405-A2', INT3306: 'Lab 2-A3', INT1306: '301-A2', INT3401: '202-A2', INT3502: '105-A3',
  INT1339: 'Lab ATTT-A3', INT1468: 'Lab 1-A3', INT3308: 'Lab 3-A3', INT1334: 'Lab ATTT-A3',
  TEL1405: '406-A2', TEL2402: '407-A2',
};

function ensureCurriculumSubjects(state: PortalState) {
  for (const course of curriculumCourseCatalog()) {
    const existing = state.subjects.find(row => row.code.toUpperCase() === course.code);
    if (existing) {
      existing.name = course.name;
      existing.credits = course.credits;
      existing.department = course.department;
    } else {
      state.subjects.push({ id: `subject-${course.code}`, ...course, active: true });
    }
  }
}

function meetingsOverlap(a: Meeting, b: Meeting) {
  if (a.day !== b.day || a.startPeriod > b.endPeriod || b.startPeriod > a.endPeriod) return false;
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

function nextFreeMeeting(state: PortalState, sectionId: string, room: string, startDate: string, endDate: string): Meeting {
  for (let day = 1; day <= 7; day++) {
    for (const startPeriod of [1, 4, 7, 10, 13]) {
      const candidate: Meeting = {
        id: `meeting-${sectionId}`,
        sectionId,
        day,
        startPeriod,
        endPeriod: startPeriod + 2,
        startDate,
        endDate,
        room,
      };
      if (!state.meetings.some(existing => meetingsOverlap(candidate, existing))) return candidate;
    }
  }
  throw new Error(`Không tìm được khung lịch trống cho lớp ${sectionId}.`);
}

function ensureMeeting(state: PortalState, section: Section, room: string, startDate: string, endDate: string) {
  if (state.meetings.some(meeting => meeting.sectionId === section.id)) return;
  state.meetings.push(nextFreeMeeting(state, section.id, room, startDate, endDate));
}

function ensureSection(state: PortalState, subject: Subject, code: string, semester: string, capacity: number, lecturerId: string, status: Section['status'], room: string, startDate: string, endDate: string) {
  let section = state.sections.find(row => row.subjectId === subject.id && sameSemester(row.semester, semester, state.catalogs));
  if (!section) {
    const parsed = parseSemester(semester);
    const semesterSuffix = sameSemester(semester, configuredCurrentSemester(), state.catalogs) ? '01' : parsed
      ? `HK${parsed.term}-${parsed.startYear}-${parsed.endYear}-01`
      : 'HIST-01';
    const sectionCode = `${code}-${semesterSuffix}`;
    const collision = state.sections.find(row => row.code === sectionCode);
    const uniqueCode = collision ? `${sectionCode}-${state.sections.filter(row => row.code.startsWith(`${sectionCode}-`)).length + 2}` : sectionCode;
    section = {
      id: `section-${uniqueCode}`,
      code: uniqueCode,
      subjectId: subject.id,
      semester,
      lecturerId,
      capacity,
      status,
      gradesLocked: false,
      registrationStart: '',
      registrationEnd: '',
    };
    state.sections.push(section);
  } else if (!section.lecturerId || section.lecturerId === 'usr-gv-hienntt') {
    section.lecturerId = lecturerId;
  }
  section.capacity = Math.max(section.capacity, capacity);
  ensureMeeting(state, section, room, startDate, endDate);
  return section;
}

function sectionMeetingsConflict(state: PortalState, leftSectionId: string, rightSectionId: string) {
  const left = state.meetings.filter(meeting => meeting.sectionId === leftSectionId);
  const right = state.meetings.filter(meeting => meeting.sectionId === rightSectionId);
  return left.some(a => right.some(b => meetingsOverlap(a, b)));
}

function enrollmentCount(state: PortalState, sectionId: string) {
  return state.enrollments.filter(row => row.sectionId === sectionId && row.status === 'registered').length;
}

function addEnrollment(state: PortalState, studentId: string, section: Section, studentIndex: number, courseIndex: number) {
  const student = state.students.find(row => row.id === studentId);
  const subject = state.subjects.find(row => row.id === section.subjectId);
  const allowedCourses = student && curriculumCourseCodesForStudent(student);
  if (!allowedCourses || !subject || !allowedCourses.has(subject.code.toUpperCase())) return false;
  const plannedCourses = plannedCourseCodesForStudentInSemester(state, student!, section.semester);
  if (!plannedCourses?.has(subject.code.toUpperCase())) return false;
  const old = state.enrollments.find(row => row.studentId === studentId && row.sectionId === section.id);
  if (old) return old.status === 'registered';
  if (enrollmentCount(state, section.id) >= section.capacity) return false;
  const alreadyInSubject = state.enrollments.some(row => {
    if (row.studentId !== studentId || row.status !== 'registered') return false;
    const other = state.sections.find(candidate => candidate.id === row.sectionId);
    return other?.semester === section.semester && other.subjectId === section.subjectId;
  });
  if (alreadyInSubject) return false;
  const activeSections = state.enrollments
    .filter(row => row.studentId === studentId && row.status === 'registered')
    .map(row => state.sections.find(candidate => candidate.id === row.sectionId))
    .filter((row): row is Section => Boolean(row));
  if (activeSections.some(other => sectionMeetingsConflict(state, section.id, other.id))) return false;

  const id = `demo-enrollment-${section.id}-${studentId}`;
  const monthDay = 18 + (studentIndex % 10);
  const registrationDate = new Date(`${semesterDates(section.semester).start}T08:00:00.000Z`);
  registrationDate.setUTCDate(registrationDate.getUTCDate() - 14 + (monthDay % 10));
  state.enrollments.push({ id, sectionId: section.id, studentId, status: 'registered', registeredAt: registrationDate.toISOString() });

  if (!state.results.some(row => row.enrollmentId === id)) {
    const seed = (studentIndex * 17 + courseIndex * 11) % 31;
    const attendance = Number((7 + (seed % 31) / 10).toFixed(1));
    if (seed % 4 !== 0) {
      const midterm = Number((5.5 + ((seed * 3) % 46) / 10).toFixed(1));
      state.results.push({ id: `demo-result-${id}`, enrollmentId: id, attendance, midterm, exam: null, published: false, updatedAt: `${semesterDates(section.semester).start}T09:00:00.000Z` });
    } else {
      state.results.push({ id: `demo-result-${id}`, enrollmentId: id, attendance, midterm: null, exam: null, published: false, updatedAt: `${semesterDates(section.semester).start}T09:00:00.000Z` });
    }
  }
  return true;
}

function ensureDemoLecturers(state: PortalState) {
  const facultyCorrections: Record<string, string> = {
    'usr-gv-leminhduc': 'Khoa Công nghệ thông tin 1',
    'usr-gv-nguyenhoangnam': 'Khoa Viễn thông 1',
  };
  for (const [userId, faculty] of Object.entries(facultyCorrections)) {
    const user = state.users.find(row => row.id === userId && row.role === 'lecturer');
    if (user) {
      user.faculty = faculty;
      user.department = faculty;
      const profile = state.lecturers.find(row => row.code === user.lecturerCode);
      if (profile) { profile.faculty = faculty; profile.department = faculty; }
    }
  }
  for (const lecturer of demoAdditionalLecturers) {
    const existing = state.users.find(row => row.id === lecturer.id || row.lecturerCode === lecturer.lecturerCode);
    if (!existing) {
      state.users.push({
        id: lecturer.id, username: lecturer.username, name: lecturer.name, email: lecturer.email,
        role: 'lecturer', passwordHash: hashPassword(lecturer.password), active: true,
        studentCode: null, lecturerCode: lecturer.lecturerCode, department: lecturer.department,
        faculty: lecturer.faculty, avatarUrl: '/default-avatar.png',
      });
    } else if (existing.role === 'lecturer') {
      existing.faculty = lecturer.faculty;
      existing.department = lecturer.department;
    }
  }

  ensureDirectories(state);
  const lecturersByFaculty = new Map(DEMO_FACULTIES.map(faculty => [
    faculty,
    state.users.filter(user => user.active && user.role === 'lecturer' && user.faculty === faculty)
      .sort((a, b) => (a.lecturerCode || '').localeCompare(b.lecturerCode || '', 'vi')),
  ]));
  const assignedCounts = new Map<string, number>();
  const assignments = new Map<string, string>();
  for (const faculty of DEMO_FACULTIES) {
    const lecturers = lecturersByFaculty.get(faculty) || [];
    const courses = state.subjects.filter(subject => subject.department === faculty).sort((a, b) => a.code.localeCompare(b.code, 'vi'));
    for (const subject of courses) {
      const preferredId = lecturerByCourse[subject.code.toUpperCase()];
      const preferred = lecturers.find(user => user.id === preferredId);
      const selected = preferred || [...lecturers].sort((a, b) =>
        (assignedCounts.get(a.id) || 0) - (assignedCounts.get(b.id) || 0)
        || (a.lecturerCode || '').localeCompare(b.lecturerCode || '', 'vi'),
      )[0];
      if (!selected) continue;
      assignments.set(subject.code.toUpperCase(), selected.id);
      assignedCounts.set(selected.id, (assignedCounts.get(selected.id) || 0) + 1);
    }
  }
  for (const section of state.sections) {
    const subject = state.subjects.find(row => row.id === section.subjectId);
    const lecturerId = subject && assignments.get(subject.code.toUpperCase());
    if (lecturerId) section.lecturerId = lecturerId;
  }
  return assignments;
}

function semesterBefore(value: string, currentValue: string) {
  const valueParts = parseSemester(value), currentParts = parseSemester(currentValue);
  if (!valueParts || !currentParts) return false;
  return valueParts.startYear < currentParts.startYear
    || valueParts.startYear === currentParts.startYear && valueParts.term < currentParts.term;
}

function semesterDates(value: string) {
  const parsed = parseSemester(value);
  if (!parsed) throw new Error(`Học kỳ chương trình không hợp lệ: ${value}`);
  if (parsed.summer || parsed.term === 3) return { start: `${parsed.endYear}-06-01`, end: `${parsed.endYear}-08-15` };
  if (parsed.term === 1) return { start: `${parsed.startYear}-09-01`, end: `${parsed.startYear}-12-31` };
  if (parsed.term === 2) return { start: `${parsed.endYear}-01-12`, end: `${parsed.endYear}-05-22` };
  const month = String(1 + ((parsed.term - 1) % 10)).padStart(2, '0');
  return { start: `${parsed.startYear}-${month}-01`, end: `${parsed.startYear}-${month}-28` };
}

function stableScoreSeed(...values: string[]) {
  let hash = 2166136261;
  for (const character of values.join('|')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function historicalScores(studentCode: string, courseCode: string, semester: string) {
  const seed = stableScoreSeed(studentCode, courseCode, semester);
  if (seed % 13 === 0) {
    return {
      attendance: Number((4 + seed % 21 / 10).toFixed(1)),
      midterm: Number((2 + (seed >>> 4) % 21 / 10).toFixed(1)),
      exam: Number((0.5 + (seed >>> 8) % 16 / 10).toFixed(1)),
    };
  }
  return {
    attendance: Number((6 + seed % 41 / 10).toFixed(1)),
    midterm: Number((5 + (seed >>> 4) % 51 / 10).toFixed(1)),
    exam: Number((4 + (seed >>> 8) % 61 / 10).toFixed(1)),
  };
}

function ensureHistoricalResult(state: PortalState, enrollmentId: string, studentCode: string, courseCode: string, semester: string, endDate: string) {
  const scores = historicalScores(studentCode, courseCode, semester);
  let result = state.results.find(row => row.enrollmentId === enrollmentId);
  if (!result) {
    result = { id: `demo-result-${enrollmentId}`, enrollmentId, ...scores, published: true, updatedAt: `${endDate}T09:00:00.000Z` };
    state.results.push(result);
    return 'created' as const;
  }
  let changed = false;
  if (result.attendance === null || result.attendance === undefined) { result.attendance = scores.attendance; changed = true; }
  if (result.midterm === null || result.midterm === undefined) { result.midterm = scores.midterm; changed = true; }
  if (result.exam === null || result.exam === undefined) { result.exam = scores.exam; changed = true; }
  if (!result.published) { result.published = true; changed = true; }
  if (result.updatedAt < `${endDate}T09:00:00.000Z`) { result.updatedAt = `${endDate}T09:00:00.000Z`; changed = true; }
  return changed ? 'repaired' as const : 'unchanged' as const;
}

function historicalLecturer(state: PortalState, code: string, department: string, assignments: Map<string, string>) {
  const assigned = assignments.get(code.toUpperCase());
  if (assigned) return assigned;
  const preferredId = lecturerByCourse[code];
  const preferred = preferredId && state.users.find(user => user.id === preferredId && user.role === 'lecturer');
  if (preferred) return preferred.id;
  const byDepartment = state.users.find(user => user.role === 'lecturer' && user.active && user.faculty === department);
  if (byDepartment) return byDepartment.id;
  const anyFacultyLecturer = state.users.find(user => user.role === 'lecturer' && user.active);
  if (!anyFacultyLecturer) throw new Error(`Không có giảng viên để phân công môn ${code}.`);
  return anyFacultyLecturer.id;
}

function ensureCurrentDemoSections(state: PortalState, semester: string, assignments: Map<string, string>) {
  const offerings = new Map<string, { students: number; subject: Subject }>();
  for (const student of state.students.filter(row => row.active)) {
    const plannedCodes = plannedCourseCodesForStudentInSemester(state, student, semester, semester);
    if (!plannedCodes) continue;
    for (const code of plannedCodes) {
      const subject = state.subjects.find(row => row.code.toUpperCase() === code);
      if (!subject) continue;
      const existing = offerings.get(code) || { students: 0, subject };
      existing.students++;
      offerings.set(code, existing);
    }
  }
  const dates = semesterDates(semester);
  for (const [code, offering] of offerings) {
    const lecturerId = assignments.get(code);
    if (!lecturerId) throw new Error(`Chưa phân công giảng viên cho học phần ${code}.`);
    const room = preferredRoomByCourse[code]
      || (offering.subject.department === 'Khoa An toàn thông tin' ? 'Lab ATTT-A3' : offering.subject.department === 'Khoa Công nghệ thông tin 1' ? 'Lab CNTT-A3' : '405-A2');
    ensureSection(state, offering.subject, code, semester, Math.max(30, offering.students + 10), lecturerId, 'open', room, dates.start, dates.end);
  }
}

function uniqueEnrollmentId(state: PortalState, section: Section, studentId: string) {
  const base = `demo-enrollment-${section.id}-${studentId}`;
  if (!state.enrollments.some(row => row.id === base)) return base;
  let attempt = 2;
  while (state.enrollments.some(row => row.id === `${base}-${attempt}`)) attempt++;
  return `${base}-${attempt}`;
}

type HistoricalTarget = { studentId: string; studentCode: string; subject: Subject; code: string; semester: string; department: string };

/** Add missing, complete demo history for courses planned before the configured semester. */
export function ensureHistoricalCurriculumRecords(state: PortalState, currentSemester = configuredCurrentSemester()) {
  const currentParts = parseSemester(currentSemester);
  if (!currentParts) return { addedEnrollments: 0, addedResults: 0, repairedResults: 0, createdSections: 0, coveredTargets: 0 };
  const lecturerAssignments = ensureDemoLecturers(state);

  const targets: HistoricalTarget[] = [];
  for (const student of state.students.filter(row => row.active)) {
    const definition = curriculumById(student.curriculumId);
    if (!definition || !studentMatchesCurriculum(student, definition.id)) continue;
    const calendar = buildStudentAcademicCalendar(state, student, currentSemester);
    const subjectByCode = new Map(state.subjects.map(row => [row.code.toUpperCase(), row]));
    for (const planned of calendar.plannedSemesters) {
      if (!semesterBefore(planned.actualSemester, currentSemester)) continue;
      const plannedTerm = definition.plan.semesters.find(row => row.semesterId === planned.id);
      if (!plannedTerm) continue;
      for (const course of plannedTerm.courses.filter(row => row.required !== false)) {
        const subject = subjectByCode.get(course.code.toUpperCase());
        if (!subject) continue;
        targets.push({ studentId: student.id, studentCode: student.code, subject, code: course.code.toUpperCase(), semester: semesterLabel(planned.actualSemester), department: definition.faculty });
      }
    }
  }

  const groups = new Map<string, HistoricalTarget[]>();
  let addedResults = 0;
  let repairedResults = 0;
  for (const target of targets) {
    const priorAttempt = state.enrollments.find(enrollment => {
      if (enrollment.studentId !== target.studentId || enrollment.status !== 'registered') return false;
      const section = state.sections.find(row => row.id === enrollment.sectionId);
      return section?.subjectId === target.subject.id && sameSemester(section.semester, target.semester, state.catalogs);
    });
    if (priorAttempt) {
      const dates = semesterDates(target.semester);
      const outcome = ensureHistoricalResult(state, priorAttempt.id, target.studentCode, target.code, target.semester, dates.end);
      if (outcome === 'created') addedResults++;
      else if (outcome === 'repaired') repairedResults++;
      continue;
    }
    const key = `${target.subject.id}|${target.semester}`;
    const group = groups.get(key) || [];
    group.push(target);
    groups.set(key, group);
  }

  let createdSections = 0;
  let addedEnrollments = 0;
  for (const group of groups.values()) {
    const first = group[0];
    const dates = semesterDates(first.semester);
    const existingSection = state.sections.find(row => row.subjectId === first.subject.id && sameSemester(row.semester, first.semester, state.catalogs));
    const existingCount = existingSection ? enrollmentCount(state, existingSection.id) : 0;
    const beforeSections = state.sections.length;
    const section = ensureSection(
      state, first.subject, first.code, first.semester,
      Math.max(30, existingCount + group.length),
      historicalLecturer(state, first.code, first.department, lecturerAssignments), 'closed', 'A2', dates.start, dates.end,
    );
    if (state.sections.length > beforeSections) createdSections++;
    section.status = 'closed';
    for (const target of group) {
      const enrollmentId = uniqueEnrollmentId(state, section, target.studentId);
      const registeredAt = new Date(`${dates.start}T08:00:00.000Z`);
      registeredAt.setUTCDate(registeredAt.getUTCDate() - 14);
      state.enrollments.push({ id: enrollmentId, sectionId: section.id, studentId: target.studentId, status: 'registered', registeredAt: registeredAt.toISOString() });
      addedEnrollments++;
      const outcome = ensureHistoricalResult(state, enrollmentId, target.studentCode, target.code, target.semester, dates.end);
      if (outcome === 'created') addedResults++;
      else if (outcome === 'repaired') repairedResults++;
    }
  }

  // Old registrations and their actual semesters remain untouched. This pass only
  // closes/locks sections where every active enrollment has a complete published result.
  for (const section of state.sections) {
    if (!semesterBefore(section.semester, currentSemester)) continue;
    const active = state.enrollments.filter(row => row.sectionId === section.id && row.status === 'registered');
    if (active.length && active.every(enrollment => {
      const result = state.results.find(row => row.enrollmentId === enrollment.id);
      return !!result && result.published && result.attendance !== null && result.attendance !== undefined && result.midterm !== null && result.midterm !== undefined && result.exam !== null && result.exam !== undefined;
    })) section.gradesLocked = true;
  }
  ensureDirectories(state, currentSemester);
  return { addedEnrollments, addedResults, repairedResults, createdSections, coveredTargets: targets.length };
}

export function cancelOffPlanCurrentDemoEnrollments(state: PortalState, currentSemester = configuredCurrentSemester()) {
  let cancelled = 0;
  for (const enrollment of state.enrollments) {
    if (enrollment.status !== 'registered') continue;
    const section = state.sections.find(row => row.id === enrollment.sectionId);
    if (!section || !sameSemester(section.semester, currentSemester, state.catalogs)) continue;
    const student = state.students.find(row => row.id === enrollment.studentId);
    const subject = state.subjects.find(row => row.id === section.subjectId);
    if (!student || !subject) continue;
    const plannedCourses = plannedCourseCodesForStudentInSemester(state, student, section.semester, currentSemester);
    if (!plannedCourses?.has(subject.code.toUpperCase())) {
      enrollment.status = 'cancelled';
      cancelled++;
    }
  }
  return cancelled;
}

export function reconcileDemoCurrentSemester(state: PortalState, currentSemester = configuredCurrentSemester()) {
  ensureCurriculumSubjects(state);
  const beforeSections = state.sections.length;
  const assignments = ensureDemoLecturers(state);
  ensureCurrentDemoSections(state, currentSemester, assignments);
  const cancelledEnrollments = cancelOffPlanCurrentDemoEnrollments(state, currentSemester);
  return { createdSections: state.sections.length - beforeSections, cancelledEnrollments };
}

export function enrichDemoAcademics(state: PortalState) {
  for (const cohort of demoAdditionalCohorts) {
    if (!state.cohorts.some(row => row.code === cohort.code)) state.cohorts.push({ ...cohort });
  }
  for (const student of demoAdditionalStudents) {
    const cohortId = `cohort-${student.className}`;
    if (!state.students.some(row => row.code === student.studentCode)) {
      state.students.push({
        id: student.id,
        code: student.studentCode,
        name: student.name,
        email: student.email,
        cohortId,
        major: student.major,
        faculty: student.faculty,
        academicYear: student.academicYear,
        curriculumId: curriculumIdForDemoStudent(student),
        phone: '',
        address: '',
        dateOfBirth: '',
        avatarUrl: student.avatarUrl,
        active: true,
        legacyGpa: student.cumulativeGpa,
        legacyCredits: student.earnedCredits,
        targetGpa: student.targetGpa,
        requiredCredits: student.requiredCredits,
      });
    }
    const username = student.studentCode.toLowerCase();
    if (!state.users.some(row => row.id === `usr-${username}` || row.username.toLowerCase() === username)) {
      state.users.push({
        id: `usr-${username}`,
        username: student.studentCode,
        name: student.name,
        email: student.email,
        role: 'student',
        passwordHash: hashPassword('ptit@123'),
        active: true,
        studentCode: student.studentCode,
        lecturerCode: null,
        department: '',
        faculty: student.faculty,
        avatarUrl: student.avatarUrl,
      });
    }
  }

  ensureCurriculumSubjects(state);
  const currentSemester = configuredCurrentSemester();
  reconcileDemoCurrentSemester(state, currentSemester);
  const currentSections = state.sections.filter(section => sameSemester(section.semester, currentSemester, state.catalogs) && section.status === 'open' && section.lecturerId);
  const students = state.students.filter(student => student.active);
  for (const [studentIndex, student] of students.entries()) {
    const plannedCourses = plannedCourseCodesForStudentInSemester(state, student, currentSemester);
    if (!plannedCourses) continue;
    const studentSections = currentSections.filter(section => plannedCourses.has(state.subjects.find(row => row.id === section.subjectId)?.code.toUpperCase() || ''));
    let activeCount = state.enrollments.filter(enrollment => {
      const section = state.sections.find(row => row.id === enrollment.sectionId);
      return enrollment.studentId === student.id && enrollment.status === 'registered' && studentSections.some(row => row.id === section?.id);
    }).length;
    const targetCount = Math.min(5, studentSections.length);
    const startAt = (studentIndex * 5) % Math.max(studentSections.length, 1);
    for (let offset = 0; offset < studentSections.length && activeCount < targetCount; offset++) {
      const courseIndex = (startAt + offset) % studentSections.length;
      if (addEnrollment(state, student.id, studentSections[courseIndex], studentIndex, courseIndex)) activeCount++;
    }
  }

  cancelOffPlanCurrentDemoEnrollments(state, currentSemester);
  ensureHistoricalCurriculumRecords(state, currentSemester);
}
