'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

type Account = { username: string; label: string; password: string | null };
export function DemoAccounts({ onSelect }: { onSelect: (account: Account) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  useEffect(() => { let active = true; apiFetch('/api/demo/accounts', { cache: 'no-store' }).then(r => r.json()).then(json => { if (active && json.enabled) setAccounts(json.accounts); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!accounts.length) return null;
  return <details open className="mt-4 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700"><summary className="cursor-pointer font-semibold">Tài khoản bản trình diễn ({accounts.length} vai trò)</summary><div className="mt-3 grid grid-cols-2 gap-2">{accounts.map(account => <button type="button" key={account.username} onClick={() => onSelect(account)} className="rounded-lg border border-slate-200 bg-white p-2 text-left dark:border-slate-700 dark:bg-slate-900"><strong className="block">{account.label}</strong><span className="block break-all">{account.username}</span><span className="mt-1 block text-[11px]">{account.password ? `Mật khẩu: ${account.password}` : 'Mật khẩu đã thay đổi; nhập mật khẩu hiện tại.'}</span></button>)}</div></details>;
}
