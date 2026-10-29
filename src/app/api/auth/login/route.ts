import { NextRequest, NextResponse } from 'next/server';
import { signSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { withState } from '@/lib/portal/store';
import { checkPassword } from '@/lib/portal/password';
import { authUser, apiError, checkOrigin, readBody } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/domain';

export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const body = await readBody(request);
    if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || body.password.length > 128) throw new PortalError('Vui lòng nhập tên đăng nhập và mật khẩu hợp lệ.');
    if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) throw new PortalError('Cần cấu hình AUTH_SECRET ít nhất 32 ký tự.', 503);
    const username = body.username.trim().toLowerCase();
    const limit = attempts.get(username);
    if (limit && limit.until > Date.now() && limit.count >= 10) throw new PortalError('Bạn đã thử đăng nhập quá nhiều lần. Hãy thử lại sau 15 phút.', 429);
    const user = await withState(false, state => {
      const found = state.users.find(u => u.username.toLowerCase() === username || u.email.toLowerCase() === username || u.studentCode?.toLowerCase() === username || (username === 'admin' && u.username === 'admin@ptit'));
      return found?.active && checkPassword(body.password as string, found.passwordHash) ? authUser(found, state) : null;
    });
    if (!user) {
      if (attempts.size > 2000) for (const [k, v] of attempts) if (v.until <= Date.now()) attempts.delete(k);
      attempts.set(username, { count: limit && limit.until > Date.now() ? limit.count + 1 : 1, until: limit && limit.until > Date.now() ? limit.until : Date.now() + 900000 });
      throw new PortalError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
    }
    attempts.delete(username);
    const token = signSessionToken(user);
    const response = NextResponse.json({ status: 'success', message: 'Đăng nhập thành công', data: { user, token } });
    response.cookies.set({ name: AUTH_COOKIE_NAME, value: token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    return response;
  } catch (e) { return apiError(e); }
}
