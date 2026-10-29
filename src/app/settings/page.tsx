'use client';
import React, { useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { useTheme } from '@/context/ThemeContext';
export default function SettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setNotice(null);
    if (newPassword !== confirmPassword) { setNotice({ error: true, text: 'Mật khẩu xác nhận không khớp.' }); return; }
    setBusy(true);
    try {
      const response = await apiFetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không đổi được mật khẩu.');
      setCurrent(''); setNew(''); setConfirm(''); setNotice({ error: false, text: json.message });
    } catch (error) { setNotice({ error: true, text: error instanceof Error ? error.message : 'Không đổi được mật khẩu.' }); }
    finally { setBusy(false); }
  }
  return <div className="max-w-3xl space-y-6">
    <header className="border-b border-slate-200 pb-4 dark:border-slate-800"><h1 className="text-2xl font-bold">Cài đặt tài khoản</h1><p className="mt-1 text-sm text-slate-500">Đổi mật khẩu và chọn giao diện hiển thị.</p></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Giao diện</h2><div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm">Đang dùng giao diện {isDarkMode ? 'tối' : 'sáng'}. Lựa chọn được ghi nhớ trên trình duyệt này.</p><button type="button" onClick={toggleTheme} className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold">Chuyển sang {isDarkMode ? 'sáng' : 'tối'}</button></div></section>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-bold">Đổi mật khẩu</h2>
      {notice && <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-sm text-red-700 dark:text-red-300' : 'text-sm text-emerald-700 dark:text-emerald-300'}>{notice.text}</p>}
      <label className="block text-sm font-semibold">Mật khẩu hiện tại<input className={field} type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={e => setCurrent(e.target.value)} disabled={busy} /></label>
      <label className="block text-sm font-semibold">Mật khẩu mới<input className={field} type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={e => setNew(e.target.value)} disabled={busy} /></label>
      <label className="block text-sm font-semibold">Xác nhận mật khẩu mới<input className={field} type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={e => setConfirm(e.target.value)} disabled={busy} /></label>
      <p className="text-xs text-slate-500">Mật khẩu mới từ 8 đến 128 ký tự. Nếu quên mật khẩu hiện tại, liên hệ Admin để đặt lại.</p><button type="submit" disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
    </form>
    <details className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"><summary className="cursor-pointer font-semibold">Quy trình nghiệp vụ đào tạo</summary><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6"><li>Giáo vụ tạo lớp niên khóa và hồ sơ sinh viên; Admin cấp tài khoản liên kết đúng mã sinh viên.</li><li>Giáo vụ tạo môn, lớp tín chỉ, phân công giảng viên và lập lịch không trùng.</li><li>Giáo vụ mở đăng ký; sinh viên đăng ký và xem lịch cá nhân.</li><li>Giảng viên nhập đủ điểm, lưu và công bố; sinh viên xem điểm, GPA và tín chỉ.</li><li>Sinh viên gửi phúc khảo; Giáo vụ tiếp nhận, phản hồi và kết thúc yêu cầu.</li><li>Giáo vụ khóa bảng điểm. Kiểm tra chặn sửa điểm, thêm sinh viên và hủy đăng ký khi đã khóa.</li></ol></details>
  </div>;
}
