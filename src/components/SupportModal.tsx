'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChoiceSelect } from '@/components/ChoiceSelect';
import { compareSemesters, semesterLabel } from '@/lib/portal/semester';
import { compareVietnamese } from '@/lib/portal/choice-order';
import { SUPPORT_CATEGORY_LABELS as categoryLabels, SUPPORT_STATUS_LABELS as statusLabels } from '@/lib/portal/options';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import type { AppealScoreSnapshot, SupportCategory, SupportRequestView, SupportStatus } from '@/types/support-request';

interface AppealOption {
  sectionId: string;
  sectionCode: string;
  semester: string;
  subjectName: string;
  scores: AppealScoreSnapshot;
}
interface SupportData {
  tickets: SupportRequestView[];
  appealOptions: AppealOption[];
  storage: 'demo' | 'postgresql';
  sender: { name: string; code: string; email: string; classNameOrDept: string };
}
interface SupportModalProps { isOpen: boolean; onClose: () => void; initialTab?: 'submit' | 'mine' }

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date) : '—';
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, initialTab = 'submit' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'mine'>(initialTab);
  const [data, setData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [category, setCategory] = useState<SupportCategory>('academic_support');
  const [sectionId, setSectionId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/api/support/tickets', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || json.status !== 'success') throw new Error(json.message || 'Không tải được yêu cầu.');
      setData(json.data as SupportData);
      setSelectedCode(current => current || json.data.tickets?.[0]?.ticketCode || '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được yêu cầu.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isOpen && user) void load(); }, [isOpen, user, load]);
  useEffect(() => { if (!isOpen) { setError(''); setNotice(''); } }, [isOpen]);

  const appealOptions = useMemo(() => [...(data?.appealOptions ?? [])].sort((a, b) => compareSemesters(a.semester, b.semester) || compareVietnamese(a.sectionCode, b.sectionCode)), [data?.appealOptions]);
  const selectedAppeal = useMemo(() => appealOptions.find(option => option.sectionId === sectionId) || null, [appealOptions, sectionId]);
  const selectedTicket = data?.tickets.find(ticket => ticket.ticketCode === selectedCode) || data?.tickets[0] || null;
  const placeholder = category === 'grade_appeal'
    ? 'Nêu rõ phần điểm cần xem lại và lý do phúc khảo.'
    : category === 'academic_support'
      ? 'Ví dụ: cần cập nhật hồ sơ, gặp lỗi khi đăng ký lớp hoặc lịch học chưa chính xác.'
      : category === 'account_website'
        ? 'Ví dụ: không đăng nhập được, tài khoản bị khóa hoặc mô tả lỗi trên website.'
        : 'Mô tả yêu cầu và thông tin giúp đơn vị tiếp nhận xử lý.';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (category === 'grade_appeal' && !sectionId) { setError('Hãy chọn lớp học phần cần phúc khảo.'); return; }
    setSending(true);
    try {
      const response = await apiFetch('/api/support/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, content, sectionId: category === 'grade_appeal' ? sectionId : undefined }),
      });
      const json = await response.json();
      if (!response.ok || json.status !== 'success') throw new Error(json.message || 'Không gửi được yêu cầu.');
      setSubject(''); setContent(''); setSectionId('');
      setNotice(`Đã gửi yêu cầu ${json.data.ticketCode}.`);
      await load();
      setSelectedCode(json.data.ticketCode);
      setActiveTab('mine');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không gửi được yêu cầu.');
    } finally { setSending(false); }
  }

  if (!isOpen || !user || !['student', 'lecturer'].includes(user.role)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="support-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800 sm:px-6">
          <div>
            <h2 id="support-title" className="text-lg font-bold">Liên hệ hỗ trợ</h2>
            <p className="mt-1 text-xs text-slate-500">Gửi yêu cầu đến đúng đơn vị tiếp nhận.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Đóng</button>
        </header>

        <nav className="flex gap-2 border-b border-slate-200 px-4 pt-3 dark:border-slate-800 sm:px-6" aria-label="Yêu cầu hỗ trợ">
          {(['submit', 'mine'] as const).map(tab => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setError(''); setNotice(''); if (tab === 'mine') void load(); }} className={`rounded-t-lg border-b-2 px-3 py-2 text-sm font-semibold ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>{tab === 'submit' ? 'Gửi yêu cầu' : 'Yêu cầu của tôi'}</button>)}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><span>{error}</span><button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button></div>}
          {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}

          {activeTab === 'submit' ? (
            <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                <h3 className="mb-2 font-semibold">Thông tin người gửi</h3>
                {loading && !data ? <p className="text-slate-500">Đang tải thông tin…</p> : <dl className="grid gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300 sm:grid-cols-2"><dt>Họ tên</dt><dd className="font-medium text-slate-900 dark:text-white">{data?.sender.name || user.name}</dd><dt>Mã</dt><dd>{data?.sender.code || user.studentCode || user.lecturerCode || user.username}</dd><dt>Email</dt><dd className="break-all">{data?.sender.email || user.email}</dd><dt>Lớp / đơn vị</dt><dd>{data?.sender.classNameOrDept || '—'}</dd></dl>}
              </section>

              <div>
                <label htmlFor="support-category" className="mb-1.5 block text-sm font-semibold">Loại yêu cầu</label>
                <select id="support-category" className={fieldClass} value={category} onChange={event => { setCategory(event.target.value as SupportCategory); setSectionId(''); }}>
                  {(Object.entries(categoryLabels) as [SupportCategory, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">{category === 'account_website' ? 'Đơn vị tiếp nhận: Admin.' : 'Đơn vị tiếp nhận: Giáo vụ.'}</p>
              </div>

              {category === 'grade_appeal' && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <div>
                  <label htmlFor="appeal-section" className="mb-1.5 block text-sm font-semibold">Lớp học phần</label>
                  <ChoiceSelect id="appeal-section" label="Lớp học phần phúc khảo" className={fieldClass} value={sectionId} onChange={event => setSectionId(event.target.value)} required options={appealOptions.map(option => ({ value: option.sectionId, label: option.sectionCode + ' · ' + option.subjectName + ' · ' + semesterLabel(option.semester) }))} emptyLabel="Chọn lớp có điểm đã công bố…" />
                  {!appealOptions.length && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Chưa có lớp học phần nào của bạn có điểm công bố đầy đủ.</p>}
                </div>
                {selectedAppeal && <div>
                  <h3 className="mb-2 text-sm font-semibold">Điểm hiện tại <span className="font-normal text-slate-500">(chỉ đọc)</span></h3>
                  <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">{[['Chuyên cần', selectedAppeal.scores.attendance], ['Giữa kỳ', selectedAppeal.scores.midterm], ['Cuối kỳ', selectedAppeal.scores.exam], ['Tổng kết', selectedAppeal.scores.final], ['Điểm chữ', selectedAppeal.scores.letter]].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-white p-2 text-center dark:bg-slate-900"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>
                </div>}
              </div>}

              <div>
                <label htmlFor="support-subject" className="mb-1.5 block text-sm font-semibold">Tiêu đề</label>
                <input id="support-subject" className={fieldClass} value={subject} onChange={event => setSubject(event.target.value)} maxLength={200} required placeholder={category === 'grade_appeal' ? 'Ví dụ: Xin phúc khảo điểm cuối kỳ môn Cơ sở dữ liệu' : category === 'account_website' ? 'Ví dụ: Không đăng nhập được vào cổng sinh viên' : category === 'academic_support' ? 'Ví dụ: Không đăng ký được lớp tín chỉ INT1402' : 'Tóm tắt yêu cầu của bạn'} />
              </div>
              <div>
                <label htmlFor="support-content" className="mb-1.5 block text-sm font-semibold">{category === 'grade_appeal' ? 'Lý do phúc khảo' : 'Nội dung'}</label>
                <textarea id="support-content" className={`${fieldClass} min-h-32 resize-y`} value={content} onChange={event => setContent(event.target.value)} maxLength={8000} required placeholder={placeholder} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Hủy</button>
                <button type="submit" disabled={sending || loading || (category === 'grade_appeal' && !appealOptions.length)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-50">{sending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
              </div>
            </form>
          ) : loading && !data ? <p className="py-12 text-center text-sm text-slate-500">Đang tải yêu cầu…</p> : !data?.tickets.length ? <div className="rounded-xl bg-slate-50 p-10 text-center dark:bg-slate-950"><p className="font-semibold">Bạn chưa có yêu cầu nào.</p><button type="button" onClick={() => setActiveTab('submit')} className="mt-3 font-semibold text-primary">Gửi yêu cầu đầu tiên</button></div> : (
            <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
              <div className="space-y-2">
                <h3 className="mb-2 text-sm font-semibold">Yêu cầu của tôi ({data.tickets.length})</h3>
                {data.tickets.map(ticket => <button key={ticket.id} type="button" onClick={() => setSelectedCode(ticket.ticketCode)} className={`w-full rounded-xl border p-3 text-left ${selectedTicket?.id === ticket.id ? 'border-primary bg-red-50/50 dark:bg-red-950/20' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}>
                  <span className="flex items-center justify-between gap-2"><strong className="font-mono text-xs">{ticket.ticketCode}</strong><span className="text-[11px] text-slate-500">{statusLabels[ticket.status]}</span></span>
                  <span className="mt-1 block truncate text-sm font-semibold">{ticket.subject}</span>
                  <span className="mt-1 block text-xs text-slate-500">{categoryLabels[ticket.category]} · {dateLabel(ticket.createdAt)}</span>
                </button>)}
              </div>
              {selectedTicket && <article className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800"><div><p className="font-mono text-xs font-bold text-primary">{selectedTicket.ticketCode}</p><h3 className="mt-1 text-lg font-bold">{selectedTicket.subject}</h3><p className="mt-1 text-xs text-slate-500">{categoryLabels[selectedTicket.category]} · Gửi {dateLabel(selectedTicket.createdAt)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{statusLabels[selectedTicket.status]}</span></header>
                <div><p className="text-xs font-semibold text-slate-500">Nội dung</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{selectedTicket.content}</p></div>
                {selectedTicket.appealScores && <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950/30"><p className="font-semibold">Điểm tại thời điểm gửi phúc khảo</p><p className="mt-1">Tổng kết {selectedTicket.appealScores.final} ({selectedTicket.appealScores.letter})</p></div>}
                {selectedTicket.adminResponse && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Phản hồi {selectedTicket.adminHandlerName ? `· ${selectedTicket.adminHandlerName}` : ''}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{selectedTicket.adminResponse}</p></div>}
              </article>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
