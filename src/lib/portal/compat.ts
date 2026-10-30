import { NextRequest, NextResponse } from 'next/server';
import type { Actor, PortalState, Student } from './types';
import { withState, storageMode } from './store';
import { actorFrom, apiError, tokenPayload, checkOrigin, readBody } from './session';
import { PortalError, mutate, view, isStaff } from './domain';
import { gradeSummary, studentSummary } from './analytics';
import { catalogEqual } from './directories';
import { sameSemester } from './semester';
import type { UserRole } from '@/types/auth';
import { curriculumCourseCodesForStudent } from './curricula';
import { plannedCourseCodesForStudentInSemester } from './student-calendar';

export async function guard(request: NextRequest, roles?: UserRole[]) {
  tokenPayload(request);
  if (!['GET', 'HEAD'].includes(request.method)) checkOrigin(request);
  return withState(false, s => { const actor = actorFrom(request, s, roles); const u = s.users.find(u => u.id === actor.id)!; return { ...actor, email: u.email, department: u.department, className: s.cohorts.find(c => c.id === s.students.find(st => st.code === u.studentCode)?.cohortId)?.code || '' }; });
}
export function legacyStudent(s: Student, state: PortalState) {
  const summary = studentSummary(state, s.id);
  const className = state.cohorts.find(c => c.id === s.cohortId)?.code || '';
  return { ...s, studentCode: s.code, className, class: className, cumulativeGpa: summary.gpa ?? s.legacyGpa, targetGpa: s.targetGpa, earnedCredits: summary.gpa !== null ? summary.earnedCredits : s.legacyCredits, requiredCredits: s.requiredCredits, resultSource: summary.gpa === null ? 'legacy_summary' : 'published_results' };
}
export function legacyCourses(state: PortalState, actor: Actor, includeRoster = false) {
  const own = state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase());
  const curriculumCodes = actor.role === 'student' && own ? curriculumCourseCodesForStudent(state, own) : null;
  const ownSectionIds = new Set(state.enrollments.filter(row => row.studentId === own?.id && row.status === 'registered').map(row => row.sectionId));
  return state.sections.filter(section => {
    if (actor.role === 'lecturer') return section.lecturerId === actor.id;
    if (actor.role !== 'student') return true;
    if (ownSectionIds.has(section.id)) return true;
    if (section.status !== 'open') return false;
    if (section.allowCrossProgram) return true;
    const course = state.subjects.find(row => row.id === section.subjectId);
    if (!curriculumCodes || !own) return ownSectionIds.has(section.id);
    if (!course || !curriculumCodes.has(course.code.toUpperCase())) return false;
    return !!plannedCourseCodesForStudentInSemester(state, own, section.semester)?.has(course.code.toUpperCase());
  }).map(section => {
    const subject = state.subjects.find(s => s.id === section.subjectId)!;
    const enrolled = state.enrollments.filter(e => e.sectionId === section.id && e.status === 'registered');
    const meetings = state.meetings.filter(m => m.sectionId === section.id);
    return { id: section.id, code: section.code, subjectCode: subject.code, name: subject.name, credits: subject.credits, instructor: state.users.find(u => u.id === section.lecturerId)?.name || 'Chưa phân công', department: subject.department, schedule: meetings.map(m => `${m.day === 7 ? 'CN' : `Thứ ${m.day + 1}`} (Tiết ${m.startPeriod}-${m.endPeriod})`).join('; '), room: meetings.map(m => m.room).join('; '), capacity: section.capacity, enrolled: enrolled.length, semester: section.semester, status: actor.role === 'student' && enrolled.some(e => e.studentId === own?.id) ? 'registered' : section.status === 'open' ? 'open' : 'closed', ...(includeRoster ? { students: state.students.filter(s => enrolled.some(e => e.studentId === s.id)).map(s => legacyStudent(s, state)) } : {}) };
  });
}
export async function compat(request: NextRequest, kind: 'students' | 'student' | 'courses' | 'grades' | 'admin-courses' | 'stats' | 'update-grade') {
  try {
    tokenPayload(request);
    if (request.method !== 'GET') checkOrigin(request);
    const body = request.method !== 'GET' ? await readBody(request) : {};
    const data = await withState(request.method !== 'GET', state => {
      const actor = actorFrom(request, state);
      const visible = view(state, actor, 'demo');
      const own = state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase());
      if (kind === 'stats') {
        if (!isStaff(actor)) throw new PortalError('Không có quyền quản trị.', 403);
        return { connected: storageMode() === 'postgresql', latencyMs: 0, studentsCount: state.students.length, coursesCount: state.sections.length, gradesCount: state.results.length, announcementsCount: 0, usersCount: state.users.length };
      }
      if (kind === 'students') return actor.role === 'lecturer'
        ? visible.students.map(student => ({ id: student.id, studentCode: student.code, name: student.name, className: state.cohorts.find(cohort => cohort.id === student.cohortId)?.code || '' }))
        : visible.students.map(s => legacyStudent(s, state));
      if (kind === 'student') {
        if (actor.role === 'lecturer') throw new PortalError('Giáº£ng viÃªn xem danh sÃ¡ch sinh viÃªn trong lá»›p Ä‘Æ°á»£c phÃ¢n cÃ´ng.', 403);
        const requested = request.nextUrl.searchParams.get('code');
        const student = actor.role === 'student' ? own : visible.students.find(s => s.code === requested);
        if (actor.role === 'student' && requested && requested.toLowerCase() !== actor.studentCode?.toLowerCase()) throw new PortalError('Chỉ được xem hồ sơ của mình.', 403);
        if (!student) throw new PortalError('Không tìm thấy hồ sơ.', 404);
        return { profile: legacyStudent(student, state), announcements: [], schedule: [] };
      }
      if (kind === 'grades') {
        const requested = request.nextUrl.searchParams.get('studentCode');
        if (actor.role === 'student' && requested && requested.toLowerCase() !== actor.studentCode?.toLowerCase()) throw new PortalError('Chỉ được xem điểm của mình.', 403);
        const semester = request.nextUrl.searchParams.get('semester');
        return visible.results.flatMap(r => {
          const e = visible.enrollments.find(e => e.id === r.enrollmentId);
          const s = state.sections.find(s => s.id === e?.sectionId);
          const c = state.subjects.find(c => c.id === s?.subjectId);
          const student = visible.students.find(st => st.id === e?.studentId);
          if (!e || e.status !== 'registered' || !s || !c || (requested && student?.code !== requested) || (semester && (actor.role === 'student' ? !sameSemester(semester, s.semester, state.catalogs) : !catalogEqual('semester', semester, s.semester, state.catalogs)))) return [];
          const g = gradeSummary(r);
          return [{ id: r.id, studentCode: student?.code, courseCode: c.code, courseName: c.name, credits: c.credits, attendanceGrade: r.attendance, midtermGrade: r.midterm, examGrade: r.exam, finalGrade: g.final, letterGrade: g.letter, semester: s.semester, status: g.passed === null ? 'in_progress' : g.passed ? 'passed' : 'failed' }];
        });
      }
      if (kind === 'courses' || kind === 'admin-courses') {
        if (kind === 'admin-courses' && !isStaff(actor)) throw new PortalError('Không có quyền quản lý lớp.', 403);
        if (request.method !== 'GET') {
          const section = state.sections.find(s => s.id === body.sectionId || s.code === body.courseCode);
          if (!section) throw new PortalError('Không tìm thấy lớp tín chỉ.', 404);
          const student = actor.role === 'student' ? own : state.students.find(s => s.code === body.studentCode);
          if (actor.role === 'student' && body.studentCode && body.studentCode !== own?.code) throw new PortalError('Chỉ được đăng ký cho mình.', 403);
          if (body.action === 'update_capacity') mutate(state, actor, 'section.save', { ...section, capacity: body.capacity });
          else if (body.action === 'drop' || body.action === 'remove_student') {
            const e = state.enrollments.find(e => e.sectionId === section.id && e.studentId === student?.id && e.status === 'registered');
            if (!e) throw new PortalError('Không tìm thấy đăng ký.', 404);
            mutate(state, actor, 'enrollment.cancel', { id: e.id });
          } else mutate(state, actor, 'enrollment.add', { sectionId: section.id, studentId: student?.id });
        }
        const courses = legacyCourses(state, actor, kind === 'admin-courses');
        return kind === 'admin-courses' ? { courses, allStudents: visible.students.map(s => legacyStudent(s, state)) } : courses;
      }
      if (kind === 'update-grade') {
        const section = state.sections.find(s => s.code === body.courseCode || s.id === body.sectionId);
        const student = state.students.find(s => s.code === body.studentCode);
        const enrollment = state.enrollments.find(e => e.sectionId === section?.id && e.studentId === student?.id && e.status === 'registered');
        if (!enrollment) throw new PortalError('Không tìm thấy sinh viên đã đăng ký lớp này.', 404);
        mutate(state, actor, 'result.save', { enrollmentId: enrollment.id, attendance: body.attendanceGrade, midterm: body.midtermGrade, exam: body.examGrade, published: body.published === true });
        return { saved: true };
      }
    });
    return NextResponse.json({ status: 'success', message: request.method !== 'GET' ? 'Đã lưu thay đổi.' : undefined, data });
  } catch (e) { return apiError(e); }
}
