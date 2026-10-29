import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import type { AuthUser, UserRole } from '@/types/auth';
import type { Actor, PortalState, PortalUser } from './types';
import { PortalError, requireRole } from './domain';

export function tokenPayload(request: NextRequest) {
  // Bearer takes precedence so separately signed-in tabs cannot act as the cookie's other user.
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifySessionToken(token) : null;
  if (!payload) throw new PortalError('Vui lòng đăng nhập lại.', 401);
  return payload;
}
export function actorFrom(request: NextRequest, state: PortalState, roles?: UserRole[]): Actor {
  const payload = tokenPayload(request);
  const user = state.users.find(u => u.id === payload.userId);
  if (!user?.active) throw new PortalError('Tài khoản không còn hoạt động.', 401);
  if (roles) requireRole(user, roles);
  return { id: user.id, username: user.username, name: user.name, role: user.role, studentCode: user.studentCode, lecturerCode: user.lecturerCode };
}
export function authUser(user: PortalUser, state: PortalState): AuthUser {
  const student = state.students.find(s => s.code === user.studentCode);
  return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, studentCode: user.studentCode || undefined, lecturerCode: user.lecturerCode || undefined, department: user.department, faculty: student?.faculty || user.faculty, className: state.cohorts.find(c => c.id === student?.cohortId)?.code };
}
export function apiError(e: unknown) {
  if (e instanceof PortalError) return NextResponse.json({ status: 'error', message: e.message }, { status: e.status });
  if (e instanceof SyntaxError) return NextResponse.json({ status: 'error', message: 'Nội dung JSON không hợp lệ.' }, { status: 400 });
  console.error('Portal API error:', e instanceof Error ? e.name : 'unknown');
  return NextResponse.json({ status: 'error', message: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' }, { status: 500 });
}
export async function readBody(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 65536) throw new PortalError('Nội dung yêu cầu quá lớn.', 413);
  const body: unknown = JSON.parse(raw);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PortalError('Nội dung yêu cầu không hợp lệ.');
  return body as Record<string, unknown>;
}
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin && origin !== process.env.APP_ORIGIN) throw new PortalError('Nguồn yêu cầu không hợp lệ.', 403);
}
