import { NextRequest, NextResponse } from 'next/server';
import { apiError, actorFrom, tokenPayload } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/errors';
import { withState } from '@/lib/portal/store';
import { createScheduleWorkbook, type ScheduleExportOptions, type ScheduleExportScope } from '@/lib/portal/schedule-export';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const textParam = (request: NextRequest, key: string) => request.nextUrl.searchParams.get(key)?.trim() || '';

export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const scopeValue = textParam(request, 'scope');
    if (!['week', 'date-range', 'semester'].includes(scopeValue)) throw new PortalError('Phạm vi xuất không hợp lệ.', 400);
    const options: ScheduleExportOptions = {
      scope: scopeValue as ScheduleExportScope,
      startDate: textParam(request, 'startDate'),
      endDate: textParam(request, 'endDate'),
      semester: textParam(request, 'semester'),
      assignmentSemester: textParam(request, 'assignmentSemester'),
      targetMeetingId: textParam(request, 'targetMeetingId'),
      targetDate: textParam(request, 'targetDate'),
      applyFilters: textParam(request, 'applyFilters') === 'true',
      filters: {
        semester: textParam(request, 'filterSemester'),
        lecturerId: textParam(request, 'lecturerId'),
        sectionId: textParam(request, 'sectionId'),
        room: textParam(request, 'room'),
        query: textParam(request, 'query'),
      },
    };
    const state = await withState(false, current => {
      actorFrom(request, current, ['academic', 'admin']);
      return structuredClone(current);
    });
    const { buffer } = await createScheduleWorkbook(state, options);
    const filename = `thoi-khoa-bieu-${options.scope}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
