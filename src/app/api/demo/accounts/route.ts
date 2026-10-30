import { NextResponse } from 'next/server';
import { withState } from '@/lib/portal/store';
import { checkPassword } from '@/lib/portal/password';
import { apiError } from '@/lib/portal/session';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    // Demo credentials are only shown by the local development server. Even when
    // local data is stored in PostgreSQL, expose a preset password only after its
    // hash matches the actual active account. Never publish this list in production.
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ enabled: false, accounts: [] });
    const presets = [
      { username: 'admin@ptit', password: 'ptitcstranphu@123', label: 'Admin' },
      { username: 'giaovu@ptit', password: 'giaovu@123', label: 'Giáo vụ' },
      { username: 'hienntt', password: 'khoavt1@123', label: 'Giảng viên' },
      { username: 'B23DCVT022', password: 'ptit@123', label: 'Sinh viên' },
    ];
    const accounts = await withState(false, state => presets.flatMap(preset => {
      const user = state.users.find(row => row.active && row.username.toLowerCase() === preset.username.toLowerCase());
      if (!user) return [];
      return [{ username: user.username, label: preset.label, password: checkPassword(preset.password, user.passwordHash) ? preset.password : null }];
    }));
    return NextResponse.json({ enabled: true, accounts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
