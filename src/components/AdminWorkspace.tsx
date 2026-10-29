'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiFetch';
import { AcademicWorkspace } from '@/components/AcademicWorkspace';
import { SupportInbox } from '@/components/SupportInbox';
export type AdminSection = 'accounts' | 'support' | 'settings' | 'audit';
export function AdminWorkspace({ section }: { section: AdminSection }) {
  const { role } = useAuth();
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState<{ isConfigured: boolean; maskedKey: string; updatedAt?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const loadConfig = useCallback(async () => {
    setLoading(true); setNotice(null);
    try { const response = await apiFetch('/api/admin/ai-config', { cache: 'no-store' }); const json = await response.json(); if (!response.ok || json.status !== 'success') throw new Error(json.message || 'Không tải được cấu hình.'); setConfig(json.data); }
    catch (error) { setNotice({ error: true, text: error instanceof Error ? error.message : 'Không tải được cấu hình.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (role === 'admin' && section === 'settings') void loadConfig(); }, [role, section, loadConfig]);
  async function update(testOnly: boolean) {
    if (!key.trim()) { setNotice({ error: true, text: 'Nhập API key trước khi tiếp tục.' }); return; }
    setBusy(true); setNotice(null);
    try { const response = await apiFetch('/api/admin/ai-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ geminiKey: key.trim(), testOnly }) }); const json = await response.json(); if (!response.ok || json.status !== 'success') throw new Error(json.message || 'Không xử lý được cấu hình.'); if (!testOnly) { setKey(''); await loadConfig(); } setNotice({ error: false, text: json.message }); }
    catch (error) { setNotice({ error: true, text: error instanceof Error ? error.message : 'Không xử lý được cấu hình.' }); }
    finally { setBusy(false); }
  }
  if (role !== 'admin') return null;
  return <div className="space-y-5">
    {section === 'accounts' && <AcademicWorkspace onlyTab="users" />}
    {section === 'support' && <SupportInbox />}
    {section === 'audit' && <AcademicWorkspace onlyTab="audit" />}
    {section === 'settings' && <><header className="border-b border-slate-200 pb-4 dark:border-slate-800"><h1 className="text-2xl font-bold">Cấu hình hệ thống</h1><p className="mt-2 text-sm text-slate-500">Thiết lập dịch vụ hỗ trợ tra cứu.</p></header><section className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-bold">Cấu hình trợ lý</h2><p className="text-sm leading-6 text-slate-500">Tiện ích hỗ trợ tra cứu. Người dùng thực hiện đăng ký, nhập điểm và xử lý yêu cầu tại các màn hình nghiệp vụ.</p>
      {loading ? <p className="text-sm text-slate-500">Đang tải cấu hình…</p> : config && <p className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950">{config.isConfigured ? 'Đã lưu API key: ' + config.maskedKey : 'Chưa có API key. Trợ lý sử dụng nội dung hỗ trợ có sẵn khi phù hợp.'}{config.updatedAt && <span className="mt-1 block text-xs text-slate-500">Cập nhật: {new Date(config.updatedAt).toLocaleString('vi-VN')}</span>}</p>}
      {notice && <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-sm text-red-700 dark:text-red-300' : 'text-sm text-emerald-700 dark:text-emerald-300'}>{notice.text}</p>}
      <form onSubmit={event => { event.preventDefault(); void update(false); }} className="space-y-3"><label htmlFor="ai-key" className="block text-sm font-semibold">API key Gemini</label><div className="flex gap-2"><input id="ai-key" type={showKey ? 'text' : 'password'} value={key} onChange={event => setKey(event.target.value)} maxLength={512} autoComplete="off" placeholder="Nhập key mới nếu muốn cập nhật" className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" disabled={busy} /><button type="button" onClick={() => setShowKey(value => !value)} className="rounded-xl border px-3 py-2 text-sm">{showKey ? 'Ẩn' : 'Hiện'}</button></div><p className="text-xs text-slate-500">Kiểm tra kết nối sẽ gửi key đến dịch vụ Gemini. Trạng thái đã lưu không đồng nghĩa kết nối đang hoạt động.</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !key.trim()} onClick={() => void update(true)} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">Kiểm tra kết nối</button><button type="submit" disabled={busy || !key.trim()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang xử lý…' : 'Lưu cấu hình'}</button><button type="button" disabled={loading || busy} onClick={() => void loadConfig()} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50">Tải lại</button></div></form>
    </section></>}
  </div>;
}
