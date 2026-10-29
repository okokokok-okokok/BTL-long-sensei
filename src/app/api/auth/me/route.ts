import { NextRequest, NextResponse } from 'next/server';
import { withState } from '@/lib/portal/store';
import { actorFrom, authUser, apiError, tokenPayload } from '@/lib/portal/session';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    tokenPayload(request);
    const user = await withState(false, state => {
      const actor = actorFrom(request, state);
      return authUser(state.users.find(u => u.id === actor.id)!, state);
    });
    return NextResponse.json({ status: 'success', data: { user } });
  } catch (e) { return apiError(e); }
}
