'use client';
import type React from 'react';
import { ChoiceSelect } from './ChoiceSelect';
import { getFormFields, updateFormValue, type FormState } from '@/lib/portal/form-model';
import type { PortalView } from '@/lib/portal/types';

export function AdminAccountForm({ data, form, busy, error, onChange, onClose, onSubmit, onCreateProfile }: {
  data: PortalView; form: FormState; busy: boolean; error?: string;
  onChange: (form: FormState) => void; onClose: () => void; onSubmit: (values: Record<string, unknown>) => void;
  onCreateProfile: () => void;
}) {
  const fields = getFormFields(data, form);
  const linked = ['student', 'lecturer'].includes(String(form.values.role));
  const summary = fields.filter(field => field.disabled);
  const editable = fields.filter(field => !field.disabled && !(form.values.id && field.key === 'password')).map(field => field.key === 'active' ? { ...field, label: 'Trạng thái tài khoản', options: [{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Đã khóa' }] } : field);
  const order = ['role', 'studentProfileId', 'lecturerProfileId', 'username'];
  editable.sort((a, b) => (order.includes(a.key) ? order.indexOf(a.key) : 10) - (order.includes(b.key) ? order.indexOf(b.key) : 10));
  const control = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950';
  function trap(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return;
    const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled])'));
    if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
  }
  return <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="account-form-title" onKeyDown={trap} className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-900">
      <header className="flex shrink-0 items-center justify-between border-b p-5 dark:border-slate-700"><h2 id="account-form-title" className="text-xl font-bold">{form.title}</h2><button type="button" aria-label="Đóng" disabled={busy} onClick={onClose} className="rounded-lg border px-3 py-2">✕</button></header>
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={e => { e.preventDefault(); onSubmit({ ...form.values, active: String(form.values.active) === 'true' }); }}>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <p className="text-xs text-slate-500">Các trường có dấu * là bắt buộc.</p>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {editable.map((field, index) => <div key={field.key}>
            <label htmlFor={`account-${field.key}`} className="mb-1.5 block text-sm font-semibold">{field.label}{field.required ? ' *' : ''}</label>
            {field.type === 'select' ? <ChoiceSelect id={`account-${field.key}`} name={field.key} autoFocus={index === 0} className={control} required={field.required} disabled={busy} value={String(form.values[field.key] ?? '')} onChange={e => onChange(updateFormValue(data, form, field.key, e.target.value))} label={field.label} emptyLabel={field.placeholder || 'Chọn…'} options={field.options || []} />
              : <input id={`account-${field.key}`} name={field.key} type={field.type || 'text'} className={control} required={field.required} disabled={busy} value={String(form.values[field.key] ?? '')} minLength={field.type === 'password' ? field.min : undefined} maxLength={field.type === 'password' ? field.max : 250} autoComplete={field.type === 'password' ? 'new-password' : 'off'} onChange={e => onChange(updateFormValue(data, form, field.key, e.target.value))} />}
            {['studentProfileId', 'lecturerProfileId'].includes(field.key) && <>
              <p className="mt-2 text-xs text-slate-500">Mỗi hồ sơ chỉ liên kết với một tài khoản. Danh tính lấy từ hồ sơ đã chọn.</p>
              <button type="button" disabled={busy} onClick={onCreateProfile} className="mt-1 text-xs font-semibold text-primary underline">{form.values.role === 'student' ? 'Chưa có hồ sơ? Tạo hồ sơ sinh viên trước' : 'Chưa có hồ sơ? Tạo hồ sơ giảng viên trước'}</button>
              <dl aria-label="Thông tin hồ sơ liên kết" className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">{summary.map(item => <div key={item.key} className="contents"><dt className="text-slate-500">{item.label.replace(' từ hồ sơ', '')}</dt><dd data-profile-field={item.key} className="break-words font-medium">{String(form.values[item.key] || '—')}</dd></div>)}</dl>
            </>}
          </div>)}
          {!!form.values.id && <p className="text-xs text-slate-500">Đổi mật khẩu tại “Thao tác → Đặt lại mật khẩu” trong danh sách tài khoản.</p>}
          <p className="text-xs text-slate-500">Khóa tài khoản chỉ chặn đăng nhập{linked ? ', không đổi tình trạng hồ sơ' : ''}.</p>
        </div>
        <footer className="flex shrink-0 gap-3 border-t bg-white p-5 dark:border-slate-700 dark:bg-slate-900"><button type="submit" disabled={busy} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu…' : form.values.id ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Hủy</button></footer>
      </form>
    </section>
  </div>;
}
