import { NextRequest, NextResponse } from 'next/server';
import { withState, storageMode } from '@/lib/portal/store';
import { mutate, view } from '@/lib/portal/domain';
import { actorFrom, apiError, checkOrigin, readBody, tokenPayload } from '@/lib/portal/session';
import { PortalError, isStaff } from '@/lib/portal/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const data = await withState(false, state => {
      const actor = actorFrom(request, state);
      const sectionId = request.nextUrl.searchParams.get('roster');
      const cohortId = request.nextUrl.searchParams.get('cohort');
      if (cohortId) {
        const own = state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase());
        if (!isStaff(actor) && (actor.role !== 'student' || own?.cohortId !== cohortId)) throw new PortalError('Chỉ xem được danh sách lớp niên khóa của mình.', 403);
        return { roster: state.students.filter(s => s.cohortId === cohortId).map(s => ({ code: s.code, name: s.name, cohort: state.cohorts.find(c => c.id === cohortId)?.code || '' })) };
      }
      if (sectionId) {
        const section = state.sections.find(row => row.id === sectionId);
        if (!section) throw new PortalError('Không tìm thấy lớp tín chỉ.', 404);
        if (actor.role === 'student' && !state.enrollments.some(row => row.studentId === state.students.find(s => s.code.toLowerCase() === actor.studentCode?.toLowerCase())?.id && row.sectionId === sectionId && row.status === 'registered')) throw new PortalError('Chỉ xem được danh sách lớp tín chỉ bạn đang đăng ký.', 403);
        if (actor.role === 'lecturer' && section.lecturerId !== actor.id) throw new PortalError('Chỉ xem được danh sách lớp được phân công.', 403);
        if (!isStaff(actor) && !['student','lecturer'].includes(actor.role)) throw new PortalError('Không có quyền xem danh sách lớp.', 403);
        const ids = new Set(state.enrollments.filter(e => e.sectionId === sectionId && e.status === 'registered').map(e => e.studentId));
        if (actor.role === 'student') return { roster: state.students.filter(s => ids.has(s.id)).map(s => ({ code: s.code, name: s.name, avatarUrl: s.avatarUrl || '' })) };
        return { roster: state.students.filter(s => ids.has(s.id)).map(s => ({ code: s.code, name: s.name, cohort: state.cohorts.find(c => c.id === s.cohortId)?.code || '' })) };
      }
      return view(state, actor, storageMode());
    });
    return NextResponse.json({ status: 'success', data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return apiError(e); }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request); tokenPayload(request);
    const body = await readBody(request);
    const data = await withState(true, state => {
      const actor = actorFrom(request, state);
      const entityId = mutate(state, actor, String(body.action), body);
      return { entityId, ...view(state, actorFrom(request, state), storageMode()) };
    });
    return NextResponse.json({ status: 'success', message: 'Đã lưu thay đổi.', data });
  } catch (e) { return apiError(e); }
}
