'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SUPPORT_CATEGORY_LABELS as categoryLabels, SUPPORT_STATUS_LABELS as statusLabels, SUPPORT_STATUS_OPTIONS } from '@/lib/portal/options';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import type { SupportRequestView, SupportStatus } from '@/types/support-request';

interface InboxData { tickets: SupportRequestView[]; storage: 'demo' | 'postgresql' }
const textareaClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date) : '—';
}

export function SupportInbox() {
  const { role, user } = useAuth();
  const [data, setData] = useState<InboxData | null>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [status, setStatus] = useState<SupportStatus>('pending');
  const [response, setResponse] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'unfinished' | 'all' | SupportStatus>('unfinished');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await apiFetch('/api/support/tickets', { cache: 'no-store' });
      const json = await result.json();
      if (!result.ok || json.status !== 'success') throw new Error(json.message || 'Không tải được danh sách yêu cầu.');
      setData(json.data as InboxData);
      setSelectedCode(current => current || json.data.tickets?.[0]?.ticketCode || '');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được danh sách yêu cầu.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (role === 'admin' || role === 'academic') void load(); }, [role, user, load]);
  const filtered = useMemo(() => (data?.tickets || []).filter(ticket => (statusFilter === 'all' || (statusFilter === 'unfinished' ? ticket.status !== 'closed' : ticket.status === statusFilter)) && `${ticket.ticketCode} ${ticket.subject} ${ticket.userName} ${ticket.userCode}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))), [data, search, statusFilter]);
  const selected = filtered.find(ticket => ticket.ticketCode === selectedCode) || filtered[0] || null;

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status);
    setResponse(selected.adminResponse || '');
  }, [selected]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (status === 'closed' && !response.trim()) { setError('Ghi kết quả xử lý hoặc lý do từ chối trước khi kết thúc.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await apiFetch('/api/support/tickets', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode: selected.ticketCode, status, adminResponse: response }),
      });
      const json = await result.json();
      if (!result.ok || json.status !== 'success') throw new Error(json.message || 'Không lưu được cập nhật.');
      setNotice(`Đã cập nhật yêu cầu ${selected.ticketCode}.`);
      await load();
      setSelectedCode(selected.ticketCode);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không lưu được cập nhật.'); }
    finally { setSaving(false); }
  }

  if (role !== 'admin' && role !== 'academic') return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Bạn không có quyền tiếp nhận yêu cầu.</div>;

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{role === 'admin' ? 'Admin' : 'Giáo vụ'} tiếp nhận</p><h1 className="mt-1 text-2xl font-bold">{role === 'admin' ? 'Yêu cầu tài khoản & báo lỗi' : 'Yêu cầu hỗ trợ'}</h1><p className="mt-1 text-sm text-slate-500">{role === 'admin' ? 'Tiếp nhận yêu cầu tài khoản và báo lỗi website. Yêu cầu học vụ, phúc khảo thuộc Giáo vụ.' : 'Danh sách chỉ gồm yêu cầu thuộc phạm vi đơn vị của bạn.'}</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">{loading ? 'Đang tải…' : 'Làm mới'}</button>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}<button type="button" onClick={() => void load()} className="ml-3 font-bold underline">Thử lại</button></div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}
    <div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="support-search">Tìm yêu cầu</label><input id="support-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm mã, người gửi, tiêu đề" className={`${textareaClass} max-w-sm`} /><label className="sr-only" htmlFor="support-filter">Lọc trạng thái yêu cầu</label><select id="support-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} className={`${textareaClass} max-w-xs`}><option value="unfinished">Chưa kết thúc</option><option value="all">Tất cả trạng thái</option>{SUPPORT_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    {loading && !data ? <div className="rounded-xl border p-10 text-center text-sm text-slate-500">Đang tải yêu cầu…</div> : error && !data ? null : !filtered.length ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"><p className="font-semibold">{search ? 'Không tìm thấy yêu cầu phù hợp.' : 'Chưa có yêu cầu cần xử lý.'}</p></div> : <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 text-xs text-slate-500">{filtered.length} yêu cầu · {role === 'admin' ? 'Admin' : 'Giáo vụ'}</p>
        <ul className="max-h-[65vh] space-y-2 overflow-y-auto">{filtered.map(ticket => <li key={ticket.id}><button type="button" onClick={() => { setSelectedCode(ticket.ticketCode); setError(''); setNotice(''); }} className={`w-full rounded-xl border p-3 text-left ${selected?.id === ticket.id ? 'border-primary bg-red-50/50 dark:bg-red-950/20' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}><span className="flex items-center justify-between gap-2"><strong className="font-mono text-xs">{ticket.ticketCode}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800">{statusLabels[ticket.status]}</span></span><span className="mt-1 block truncate text-sm font-semibold">{ticket.subject}</span><span className="mt-1 block text-xs text-slate-500">{categoryLabels[ticket.category]} · {ticket.userName}</span><span className="mt-1 block text-[11px] text-slate-400">{dateLabel(ticket.createdAt)}</span></button></li>)}</ul>
      </section>

      {selected && <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800"><div><p className="font-mono text-xs font-bold text-primary">{selected.ticketCode}</p><h2 className="mt-1 text-xl font-bold">{selected.subject}</h2><p className="mt-1 text-sm text-slate-500">{categoryLabels[selected.category]} · {dateLabel(selected.createdAt)} · Tiếp nhận bởi {selected.receiverUnit === 'admin' ? 'Admin' : 'Giáo vụ'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{statusLabels[selected.status]}</span></div>
        <dl className="grid gap-x-4 gap-y-1 border-b border-slate-100 py-3 text-sm dark:border-slate-800 sm:grid-cols-2"><dt className="text-slate-500">Người gửi</dt><dd>{selected.userName}</dd><dt className="text-slate-500">Mã người gửi</dt><dd>{selected.userCode}</dd><dt className="text-slate-500">Email</dt><dd className="break-all">{selected.email || '—'}</dd><dt className="text-slate-500">Lớp / đơn vị</dt><dd>{selected.classNameOrDept || '—'}</dd></dl>
        <div className="py-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Nội dung yêu cầu</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{selected.content}</p></div>
        {selected.appealScores && <div className="mb-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"><p className="text-sm font-semibold">Điểm tại thời điểm gửi · {selected.appealSectionId}</p><p className="mt-1 text-sm">Chuyên cần {selected.appealScores.attendance ?? '—'} · Giữa kỳ {selected.appealScores.midterm ?? '—'} · Cuối kỳ {selected.appealScores.exam ?? '—'} · Tổng kết {selected.appealScores.final} ({selected.appealScores.letter})</p></div>}
        <form onSubmit={save} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div><label htmlFor="support-status" className="mb-1 block text-sm font-semibold">Trạng thái</label><select id="support-status" value={status} onChange={event => setStatus(event.target.value as SupportStatus)} className={textareaClass}>{SUPPORT_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div><label htmlFor="support-response" className="mb-1 block text-sm font-semibold">Phản hồi / kết quả xử lý</label><textarea id="support-response" rows={4} maxLength={8000} value={response} onChange={event => setResponse(event.target.value)} placeholder="Nhập phản hồi để người gửi xem. Bắt buộc khi kết thúc yêu cầu." className={`${textareaClass} resize-y`} /></div>
          <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu cập nhật'}</button></div>
        </form>
      </section>}
    </div>}
  </div>;
}
