import { NextRequest, NextResponse } from 'next/server';
import { actorFrom, apiError, tokenPayload } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/domain';
import { withState, storageMode } from '@/lib/portal/store';
import { buildAcademicDashboard, isCalendarDate } from '@/lib/portal/academic-dashboard';
import { findCatalog } from '@/lib/portal/directories';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const requestedDate = request.nextUrl.searchParams.get('date') || undefined;
    if (requestedDate && !isCalendarDate(requestedDate)) throw new PortalError('Ngày xem lịch không hợp lệ.', 400);
    const requestedSemester = request.nextUrl.searchParams.get('semester') || undefined;
    const data = await withState(false, state => {
      actorFrom(request, state, ['admin', 'academic']);
      const term = requestedSemester ? findCatalog(state, 'semester', requestedSemester) : undefined;
      if (requestedSemester && !term) throw new PortalError('Học kỳ không thuộc danh mục.', 400);
      return { ...buildAcademicDashboard(state, { semester: term?.name, date: requestedDate }), storage: storageMode() };
    });
    return NextResponse.json({ status: 'success', data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}
