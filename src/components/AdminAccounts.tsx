'use client';

import { useEffect, useState } from 'react';
import { ChoiceSelect } from './ChoiceSelect';
import { catalogChoices, catalogEqual } from '@/lib/portal/directories';
import { ROLE_OPTIONS, ROLE_LABELS } from '@/lib/portal/options';
import type { PortalView, SafeUser } from '@/lib/portal/types';

const control = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950';
const roleColor = { admin: 'bg-purple-50 text-purple-700', academic: 'bg-blue-50 text-blue-700', lecturer: 'bg-amber-50 text-amber-800', student: 'bg-emerald-50 text-emerald-700' };
export function AdminAccounts({ data, busy, onCreate, onEdit, onReset, onToggle, onDelete }: {
  data: PortalView; busy: boolean; onCreate: () => void; onEdit: (user: SafeUser) => void;
  onReset: (user: SafeUser) => void; onToggle: (user: SafeUser) => void; onDelete: (user: SafeUser) => void;
}) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [faculty, setFaculty] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  useEffect(() => { setPage(1); }, [query, role, faculty, active, size]);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
  const studentsByCode = new Map(data.students.map(student => [student.code.trim().toLocaleLowerCase('vi'), student]));
  const lecturersByCode = new Map(data.lecturers.map(lecturer => [lecturer.code.trim().toLocaleLowerCase('vi'), lecturer]));
  const linkedProfileForUser = (user: SafeUser) => {
    if (user.role === 'student' && user.studentCode) return studentsByCode.get(user.studentCode.trim().toLocaleLowerCase('vi'));
    if (user.role === 'lecturer' && user.lecturerCode) return lecturersByCode.get(user.lecturerCode.trim().toLocaleLowerCase('vi'));
    return undefined;
  };
  const facultyForUser = (user: SafeUser) => linkedProfileForUser(user)?.faculty || user.faculty;
  const filtered = data.users.filter(user => (!role || user.role === role) && (!active || String(user.active) === active)
    && (!faculty || ((user.role === 'student' || user.role === 'lecturer') && catalogEqual('faculty', facultyForUser(user), faculty, data.catalogs)))
    && normalize([user.username, user.name, user.email, user.studentCode, user.lecturerCode].join(' ')).includes(normalize(query.trim())));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  function action(event: React.MouseEvent, callback: () => void) {
    event.currentTarget.closest('details')?.removeAttribute('open'); callback();
  }
  return <div className="space-y-4">
    <p className="text-xs text-slate-500">Khóa tài khoản chỉ chặn đăng nhập; tình trạng học tập và công tác được quản lý tại hồ sơ.</p>
    <div className="flex flex-wrap items-center gap-3">
      <input aria-label="Tìm tài khoản" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tên đăng nhập, họ tên, email, mã hồ sơ…" className={`${control} min-w-64 flex-1`} />
      <select aria-label="Lọc vai trò" className={control} value={role} onChange={e => setRole(e.target.value)}><option value="">Tất cả vai trò</option>{ROLE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <ChoiceSelect label="Khoa" options={catalogChoices(data.catalogs, 'faculty', { filter: true })} emptyLabel="Tất cả khoa" value={faculty} onChange={e => setFaculty(e.target.value)} className={control} containerClassName="min-w-48" />
      <select aria-label="Lọc trạng thái tài khoản" className={control} value={active} onChange={e => setActive(e.target.value)}><option value="">Tất cả trạng thái</option><option value="true">Hoạt động</option><option value="false">Đã khóa</option></select>
      <button type="button" className={control} onClick={() => { setQuery(''); setRole(''); setFaculty(''); setActive(''); }}>Xóa bộ lọc</button>
      <button type="button" disabled={busy} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={onCreate}>+ Tạo tài khoản</button>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto"><table className="w-full text-left text-sm portal-table"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800"><tr>{['Tài khoản', 'Họ tên / Email', 'Vai trò', 'Hồ sơ liên kết', 'Trạng thái', 'Thao tác'].map(title => <th key={title} className="whitespace-nowrap px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(user => <tr key={user.id}>
        <td className="px-4 py-3 font-semibold">{user.username}{user.id === data.me.id && <span className="ml-2 text-xs font-normal text-slate-500">Bạn</span>}</td>
        <td className="px-4 py-3">{user.name}<div className="mt-1 text-xs text-slate-500">{user.email}</div></td>
        <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${roleColor[user.role]}`}>{ROLE_LABELS[user.role]}</span></td>
        <td className="px-4 py-3">{user.studentCode || user.lecturerCode || 'Không áp dụng'}{(user.role === 'student' || user.role === 'lecturer') && facultyForUser(user) && <div className="mt-1 text-xs font-normal text-slate-500">{facultyForUser(user)}</div>}</td>
        <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{user.active ? 'Hoạt động' : 'Đã khóa'}</span></td>
        <td className="px-4 py-3"><div className="flex flex-wrap items-start gap-2"><button disabled={busy} className={control} onClick={() => onEdit(user)}>Chỉnh sửa</button><details><summary className={`${control} cursor-pointer`}>Thao tác</summary><div className="mt-2 flex min-w-44 flex-col gap-1 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700">
          <button disabled={busy} className="rounded p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800" onClick={e => action(e, () => onReset(user))}>Đặt lại mật khẩu</button>
          <button disabled={busy || user.id === data.me.id} className="rounded p-2 text-left hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800" onClick={e => action(e, () => onToggle(user))}>{user.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</button>
          <button disabled={busy || user.id === data.me.id} className="rounded p-2 text-left text-red-700 hover:bg-red-50 disabled:opacity-40" onClick={e => action(e, () => onDelete(user))}>Xóa tài khoản</button>
        </div></details></div></td>
      </tr>)}</tbody></table></div>
      {!rows.length && <div className="p-10 text-center text-sm text-slate-500">{data.users.length ? 'Không tìm thấy tài khoản phù hợp. Hãy đổi hoặc xóa bộ lọc.' : 'Chưa có tài khoản.'}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm dark:border-slate-700"><span aria-live="polite">Hiển thị {filtered.length ? (current - 1) * size + 1 : 0}–{Math.min(current * size, filtered.length)} trên {filtered.length} tài khoản</span><div className="flex items-center gap-3"><label>Số dòng <select aria-label="Số tài khoản mỗi trang" className={control} value={size} onChange={e => setSize(Number(e.target.value))}><option value={20}>20</option><option value={50}>50</option></select></label><button className={control} disabled={current <= 1} onClick={() => setPage(current - 1)}>Trước</button><span>Trang {current}/{pages}</span><button className={control} disabled={current >= pages} onClick={() => setPage(current + 1)}>Sau</button></div></div>
    </div>
  </div>;
}
