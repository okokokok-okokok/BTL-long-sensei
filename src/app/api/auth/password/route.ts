import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { actorFrom, apiError, checkOrigin, readBody, tokenPayload } from '@/lib/portal/session';
import { PortalError } from '@/lib/portal/domain';
import { withState } from '@/lib/portal/store';
import { checkPassword, hashPassword } from '@/lib/portal/password';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request); tokenPayload(request);
    const body = await readBody(request);
    if (typeof body.currentPassword !== 'string' || body.currentPassword.length > 128 || typeof body.newPassword !== 'string' || body.newPassword.length < 8 || body.newPassword.length > 128) throw new PortalError('Mật khẩu mới cần từ 8 đến 128 ký tự.');
    if (body.newPassword !== body.confirmPassword) throw new PortalError('Mật khẩu xác nhận không khớp.');
    await withState(true, state => {
      const actor = actorFrom(request, state);
      const user = state.users.find(row => row.id === actor.id)!;
      if (!checkPassword(body.currentPassword as string, user.passwordHash)) throw new PortalError('Mật khẩu hiện tại không chính xác.', 400);
      if (body.newPassword === body.currentPassword) throw new PortalError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      user.passwordHash = hashPassword(body.newPassword as string);
      state.audits.push({ id: randomUUID(), actorId: actor.id, actorName: actor.name, action: 'user.password.change', entityId: user.id, createdAt: new Date().toISOString() });
    });
    return NextResponse.json({ status: 'success', message: 'Đã đổi mật khẩu. Hãy sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.' });
  } catch (error) { return apiError(error); }
}
