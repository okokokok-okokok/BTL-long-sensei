import { NextRequest, NextResponse } from 'next/server';
import { withState, storageMode } from '@/lib/portal/store';
import { actorFrom, apiError, tokenPayload } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/errors';
import { buildStudentAcademicCalendar } from '@/lib/portal/student-calendar';
import { sameSemester } from '@/lib/portal/semester';
import { PERIOD_TIMES } from '@/lib/portal/options';
import { curriculumCourseCodesForStudent } from '@/lib/portal/curricula';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const data = await withState(false, state => {
      const actor = actorFrom(request, state, ['student']);
      const student = state.students.find(row => row.code.toLowerCase() === actor.studentCode?.toLowerCase());
      if (!student) throw new PortalError('Tài khoản chưa có hồ sơ sinh viên.', 409);
      const params = request.nextUrl.searchParams;
      const view = params.get('view');
      if (view === 'cohort') {
        const cohort = state.cohorts.find(row => row.id === student.cohortId);
        if (!cohort) return { cohort: null, advisor: null, students: [] };
        const members = state.students.filter(row => row.cohortId === cohort.id).map(row => ({
          code: row.code, name: row.name, avatarUrl: row.avatarUrl || '', isSelf: row.id === student.id, position: null,
        }));
        return { cohort: { id: cohort.id, code: cohort.code, name: cohort.name, major: cohort.major, faculty: cohort.faculty, intake: student.academicYear, academicYear: `${cohort.startYear}-${cohort.endYear}`, capacity: members.length }, advisor: null, students: members };
      }
      if (view === 'sections') {
        const registered = state.enrollments.filter(row => row.studentId === student.id && row.status === 'registered');
        const ownSectionIds = new Set(registered.map(row => row.sectionId));
        const curriculumCodes = curriculumCourseCodesForStudent(state, student);
        const calendar = buildStudentAcademicCalendar(state, student);
        const requested = params.get('semester');
        const matchingChoice = requested ? calendar.actualSemesters.find(row => sameSemester(row.value, requested, state.catalogs)) : undefined;
        if (requested && !matchingChoice) throw new PortalError('Học kỳ này không thuộc chương trình hoặc dữ liệu học tập của bạn.', 400);
        const selected = matchingChoice?.value || calendar.defaultSemester;
        const sections = state.sections.filter(row => {
          if (!ownSectionIds.has(row.id) || !selected || !sameSemester(row.semester, selected, state.catalogs)) return false;
          return true;
        }).map(section => {
          const subject = state.subjects.find(row => row.id === section.subjectId);
          const lecturer = state.users.find(row => row.id === section.lecturerId);
          const meetings = state.meetings.filter(row => row.sectionId === section.id).map(meeting => ({
            day: meeting.day, startPeriod: meeting.startPeriod, endPeriod: meeting.endPeriod,
            startTime: PERIOD_TIMES[meeting.startPeriod - 1]?.split('–')[0] || '', endTime: PERIOD_TIMES[meeting.endPeriod - 1]?.split('–')[1] || '', room: meeting.room,
            startDate: meeting.startDate, endDate: meeting.endDate,
          }));
          return { id: section.id, code: section.code, semester: section.semester, subjectCode: subject?.code || '', subjectName: subject?.name || '', credits: subject?.credits || 0,
            lecturerName: lecturer?.name || 'Chưa phân công', outsideCurriculum: !curriculumCodes || !subject || !curriculumCodes.has(subject.code.toUpperCase()), enrollmentCount: state.enrollments.filter(row => row.sectionId === section.id && row.status === 'registered').length,
            capacity: section.capacity, meetings };
        });
        const sectionId = params.get('sectionId');
        if (sectionId) {
          if (!ownSectionIds.has(sectionId)) throw new PortalError('Chỉ xem được danh sách lớp tín chỉ bạn đang đăng ký.', 403);
          const peers = state.enrollments.filter(row => row.sectionId === sectionId && row.status === 'registered').flatMap(enrollment => {
            const peer = state.students.find(row => row.id === enrollment.studentId);
            return peer ? [{ code: peer.code, name: peer.name, avatarUrl: peer.avatarUrl || '' }] : [];
          });
          return { semesters: calendar.actualSemesters, selectedSemester: selected, programAssigned: calendar.programAssigned, sections, roster: peers };
        }
        return { semesters: calendar.actualSemesters, selectedSemester: selected, programAssigned: calendar.programAssigned, sections };
      }
      throw new PortalError('Mục dữ liệu không hợp lệ.', 400);
    });
    return NextResponse.json({ status: 'success', data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
