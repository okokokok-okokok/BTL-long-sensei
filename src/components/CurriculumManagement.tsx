'use client';

import React, { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { ChoiceSelect } from '@/components/ChoiceSelect';
import { curriculumVersionLabel } from '@/lib/portal/curricula';
import { catalogChoices, findCatalog } from '@/lib/portal/directories';
import { compareVietnamese } from '@/lib/portal/choice-order';
import type { CurriculumCourseEntry, CurriculumTerm, CurriculumVersion, PortalView } from '@/lib/portal/types';

const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-950 dark:text-white dark:border-slate-700';
const button = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${button} bg-primary text-white hover:bg-red-800`;
const secondary = `${button} border border-slate-200 bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700`;
const field = 'block text-xs font-semibold text-slate-600 dark:text-slate-300';

type Scope = Pick<CurriculumVersion, 'faculty' | 'major' | 'degreeSystem' | 'intakeStartYear' | 'intakeEndYear'>;
function statusName(status: CurriculumVersion['status']) { return status === 'draft' ? 'Nháp' : status === 'active' ? 'Đang áp dụng' : 'Ngừng áp dụng'; }
function yearChoices(data: PortalView) { return [...new Set(data.catalogs.filter(row => row.kind === 'intake' && row.active && row.startYear !== null).map(row => row.startYear!))].sort((a, b) => a - b); }
function scopeFields(data: PortalView, value: Scope, setValue: (value: Scope) => void) {
  const faculty = findCatalog(data, 'faculty', value.faculty);
  const years = yearChoices(data);
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <label className={field}>Khoa<select className={`${input} mt-1`} value={value.faculty} onChange={event => setValue({ ...value, faculty: event.target.value, major: '' })}><option value="">Chọn khoa…</option>{catalogChoices(data.catalogs, 'faculty', { current: value.faculty }).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
    <label className={field}>Ngành<select className={`${input} mt-1`} value={value.major} disabled={!faculty} onChange={event => setValue({ ...value, major: event.target.value })}><option value="">Chọn ngành…</option>{faculty && catalogChoices(data.catalogs, 'major', { parentId: faculty.id, current: value.major }).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
    <label className={field}>Hệ đào tạo<select className={`${input} mt-1`} value={value.degreeSystem} onChange={event => setValue({ ...value, degreeSystem: event.target.value })}><option value="">Chọn hệ đào tạo…</option>{catalogChoices(data.catalogs, 'degreeSystem', { current: value.degreeSystem }).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select></label>
    <label className={field}>Khóa tuyển sinh từ<select className={`${input} mt-1`} value={value.intakeStartYear || ''} onChange={event => setValue({ ...value, intakeStartYear: Number(event.target.value) })}><option value="">Chọn khóa…</option>{years.map(year => <option key={year} value={year}>Khóa {year}</option>)}</select></label>
    <label className={field}>Đến khóa tuyển sinh<select className={`${input} mt-1`} value={value.intakeEndYear || ''} onChange={event => setValue({ ...value, intakeEndYear: Number(event.target.value) })}><option value="">Chọn khóa…</option>{years.filter(year => year >= value.intakeStartYear).map(year => <option key={year} value={year}>Khóa {year}</option>)}</select></label>
  </div>;
}

export function CurriculumManagement({ data, onReload }: { data: PortalView; onReload: () => void }) {
  const programs = data.curriculumPrograms || [];
  const versions = data.curriculumVersions || [];
  const [query, setQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [intakeFilter, setIntakeFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [newDraft, setNewDraft] = useState({ code: '', name: '', version: '1.0', faculty: '', major: '', degreeSystem: '', intakeStartYear: 0, intakeEndYear: 0, totalCreditsRequired: 120, planStartYear: 2026, trainingTime: '4 năm' });
  const selected = versions.find(row => row.id === selectedId) || null;
  const program = selected ? programs.find(row => row.id === selected.programId) : null;
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const availableMajors = useMemo(() => {
    const faculty = findCatalog(data, 'faculty', facultyFilter);
    return faculty ? catalogChoices(data.catalogs, 'major', { parentId: faculty.id, filter: true }) : [];
  }, [data, facultyFilter]);
  const visible = versions.filter(version => {
    const owner = programs.find(row => row.id === version.programId);
    return (!query || [owner?.code, owner?.name, version.major, version.faculty, version.version].some(value => value?.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))))
      && (!facultyFilter || version.faculty === facultyFilter) && (!majorFilter || version.major === majorFilter)
      && (!statusFilter || version.status === statusFilter) && (!degreeFilter || version.degreeSystem === degreeFilter)
      && (!intakeFilter || (Number(intakeFilter) >= version.intakeStartYear && Number(intakeFilter) <= version.intakeEndYear));
  }).sort((a, b) => compareVietnamese(a.faculty, b.faculty) || compareVietnamese(a.major, b.major) || a.intakeStartYear - b.intakeStartYear || a.intakeEndYear - b.intakeEndYear || compareVietnamese(a.version, b.version));

  async function post(action: string, values: Record<string, unknown>, success: string) {
    setBusy(true); setMessage(null);
    try {
      const response = await apiFetch('/api/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...values }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Không lưu được dữ liệu.');
      setMessage({ error: false, text: success }); setCreating(false); setDraft(null); onReload();
      return true;
    } catch (error) { setMessage({ error: true, text: error instanceof Error ? error.message : 'Không lưu được dữ liệu.' }); return false; }
    finally { setBusy(false); }
  }
  function openDraft(version: CurriculumVersion) {
    setSelectedId(version.id);
    const working = structuredClone(version);
    if (working.status === 'draft' && working.electiveGroups.length) {
      working.courses = working.courses.map(course => ({ ...course, required: true, electiveGroupId: null }));
      working.electiveGroups = [];
      working.totalCreditsRequired = working.courses.reduce((sum, course) => sum + course.credits, 0) || working.totalCreditsRequired;
      setMessage({ error: false, text: 'Bản nháp cũ có nhóm tự chọn. Trên biểu mẫu, các môn đã chuyển thành môn bắt buộc; kiểm tra và lưu để áp dụng thay đổi này.' });
    } else setMessage(null);
    setDraft({ ...working, programCode: programs.find(row => row.id === version.programId)?.code || '', programName: programs.find(row => row.id === version.programId)?.name || '' });
  }
  function updateDraft(key: string, value: unknown) {
    setDraft(current => {
      if (!current) return current;
      if (key !== 'courses' || selected?.status !== 'draft') return { ...current, [key]: value };
      const courses = value as CurriculumCourseEntry[];
      const total = courses.reduce((sum, course) => sum + course.credits, 0);
      return { ...current, courses, totalCreditsRequired: total || current.totalCreditsRequired };
    });
  }
  function draftValue<T>(key: string, fallback: T): T { return (draft?.[key] as T) ?? fallback; }
  const terms = draftValue<CurriculumTerm[]>('terms', []);
  const courses = draftValue<CurriculumCourseEntry[]>('courses', []);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Chương trình đào tạo</h2><p className="mt-1 text-sm text-slate-500">Quản lý bản nháp, phạm vi áp dụng và các phiên bản đã công bố.</p></div><button type="button" className={primary} onClick={() => { setCreating(value => !value); setSelectedId(''); setDraft(null); setMessage(null); }}>+ Tạo chương trình nháp</button></div>
    {message && <div role={message.error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-sm ${message.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message.text}</div>}
    {creating && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h3 className="font-bold">Tạo bản nháp</h3><div className="grid gap-3 sm:grid-cols-2"><label className={field}>Mã chương trình<input className={`${input} mt-1`} value={newDraft.code} onChange={event => setNewDraft({ ...newDraft, code: event.target.value })} /></label><label className={field}>Tên chương trình<input className={`${input} mt-1`} value={newDraft.name} onChange={event => setNewDraft({ ...newDraft, name: event.target.value })} /></label><label className={field}>Phiên bản<input className={`${input} mt-1`} value={newDraft.version} onChange={event => setNewDraft({ ...newDraft, version: event.target.value })} /></label><label className={field}>Tổng tín chỉ yêu cầu<input type="number" min={1} max={500} className={`${input} mt-1`} value={newDraft.totalCreditsRequired} onChange={event => setNewDraft({ ...newDraft, totalCreditsRequired: Number(event.target.value) })} /></label><label className={field}>Năm bắt đầu kế hoạch<input type="number" min={1990} max={2110} className={`${input} mt-1`} value={newDraft.planStartYear} onChange={event => setNewDraft({ ...newDraft, planStartYear: Number(event.target.value) })} /></label><label className={field}>Thời gian đào tạo<input className={`${input} mt-1`} value={newDraft.trainingTime} onChange={event => setNewDraft({ ...newDraft, trainingTime: event.target.value })} /></label></div>{scopeFields(data, newDraft, value => setNewDraft(current => ({ ...current, ...value, planStartYear: current.planStartYear < value.intakeStartYear || current.planStartYear > value.intakeEndYear ? value.intakeStartYear : current.planStartYear })))}<div className="flex gap-2"><button type="button" className={primary} disabled={busy} onClick={() => void post('curriculum.create', newDraft, 'Đã tạo bản nháp chương trình.')}>{busy ? 'Đang lưu…' : 'Tạo bản nháp'}</button><button type="button" className={secondary} onClick={() => setCreating(false)} disabled={busy}>Hủy</button></div></section>}
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><input aria-label="Tìm chương trình" className={input} placeholder="Tìm mã, tên, ngành…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Lọc khoa" className={input} value={facultyFilter} onChange={event => { setFacultyFilter(event.target.value); setMajorFilter(''); }}><option value="">Tất cả khoa</option>{catalogChoices(data.catalogs, 'faculty', { filter: true }).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select><select aria-label="Lọc ngành" className={input} value={majorFilter} disabled={!facultyFilter} onChange={event => setMajorFilter(event.target.value)}><option value="">Tất cả ngành</option>{availableMajors.map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select><select aria-label="Lọc khóa tuyển sinh" className={input} value={intakeFilter} onChange={event => setIntakeFilter(event.target.value)}><option value="">Tất cả khóa</option>{yearChoices(data).map(year => <option key={year} value={year}>Khóa {year}</option>)}</select><select aria-label="Lọc hệ đào tạo" className={input} value={degreeFilter} onChange={event => setDegreeFilter(event.target.value)}><option value="">Tất cả hệ đào tạo</option>{catalogChoices(data.catalogs, 'degreeSystem', { filter: true }).map(row => <option key={row.value} value={row.value}>{row.label}</option>)}</select><select aria-label="Lọc trạng thái chương trình" className={input} value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Tất cả trạng thái</option><option value="draft">Nháp</option><option value="active">Đang áp dụng</option><option value="retired">Ngừng áp dụng</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800">{['Mã / tên chương trình', 'Ngành · khoa', 'Khóa · hệ đào tạo', 'Phiên bản', 'Tín chỉ · học kỳ', 'Trạng thái', 'Thao tác'].map(label => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map(version => { const owner = programs.find(row => row.id === version.programId); return <tr key={version.id}><td className="px-3 py-3"><strong>{owner?.code}</strong><div className="mt-1 text-xs text-slate-500">{owner?.name}</div></td><td className="px-3 py-3">{version.major}<div className="mt-1 text-xs text-slate-500">{version.faculty}</div></td><td className="px-3 py-3">{version.intakeStartYear}–{version.intakeEndYear}<div className="mt-1 text-xs text-slate-500">{version.degreeSystem}</div></td><td className="px-3 py-3">{version.version}</td><td className="px-3 py-3">{version.totalCreditsRequired} TC · {version.terms.length} kỳ</td><td className="px-3 py-3">{statusName(version.status)}</td><td className="px-3 py-3"><button className={secondary} onClick={() => openDraft(version)}>{version.status === 'draft' ? 'Sửa bản nháp' : 'Chi tiết'}</button></td></tr>; })}</tbody></table>{!visible.length && <p className="py-10 text-center text-sm text-slate-500">{versions.length ? 'Không có chương trình phù hợp bộ lọc.' : 'Chưa có chương trình đào tạo.'}</p>}</div></section>
    {selected && draft && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><header className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{selected.status === 'draft' ? 'Chỉnh sửa bản nháp' : 'Chi tiết phiên bản'}</h3><p className="mt-1 text-sm text-slate-500">{curriculumVersionLabel(selected, programs)} · {statusName(selected.status)}</p></div><div className="flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => { setSelectedId(''); setDraft(null); }}>Đóng</button>{selected.status !== 'draft' && <button type="button" className={secondary} disabled={busy} onClick={() => { const name = window.prompt('Nhập mã phiên bản mới:', `${selected.version}.1`); if (name?.trim()) void post('curriculum.version.create', { sourceVersionId: selected.id, version: name.trim() }, 'Đã tạo phiên bản nháp mới.'); }}>Tạo phiên bản mới</button>}{selected.status === 'active' && <button type="button" className={secondary} disabled={busy} onClick={() => { if (window.confirm('Ngừng áp dụng phiên bản này? Sinh viên đang gán vẫn xem được lịch sử chương trình.')) void post('curriculum.retire', { id: selected.id }, 'Đã ngừng áp dụng phiên bản.'); }}>Ngừng áp dụng</button>}{selected.status === 'draft' && <><button type="button" className={secondary} disabled={busy} onClick={() => void post('curriculum.draft.save', draft, 'Đã lưu bản nháp.')}>Lưu bản nháp</button><button type="button" className={primary} disabled={busy} onClick={async () => { if (!window.confirm('Công bố phiên bản này cho phạm vi khóa đã chọn?')) return; const saved = await post('curriculum.draft.save', draft, 'Đã lưu bản nháp.'); if (saved) await post('curriculum.publish', { id: selected.id }, 'Đã công bố chương trình.'); }}>Kiểm tra và công bố</button></>}</div></header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className={field}>Mã chương trình<input className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={String(draft.programCode || '')} onChange={event => updateDraft('programCode', event.target.value)} /></label><label className={field}>Tên chương trình<input className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={String(draft.programName || '')} onChange={event => updateDraft('programName', event.target.value)} /></label><label className={field}>Phiên bản<input className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={String(draft.version || '')} onChange={event => updateDraft('version', event.target.value)} /></label><label className={field}>Năm bắt đầu kế hoạch<input type="number" disabled={selected.status !== 'draft'} className={`${input} mt-1`} value={Number(draft.planStartYear)} onChange={event => updateDraft('planStartYear', Number(event.target.value))} /></label><label className={field}>Tổng tín chỉ yêu cầu<input type="number" min={1} max={500} disabled={selected.status !== 'draft'} className={`${input} mt-1`} value={Number(draft.totalCreditsRequired)} onChange={event => updateDraft('totalCreditsRequired', Number(event.target.value))} /></label><label className={field}>Thời gian đào tạo<input disabled={selected.status !== 'draft'} className={`${input} mt-1`} value={String(draft.trainingTime || '')} onChange={event => updateDraft('trainingTime', event.target.value)} /></label></div>
      {selected.status === 'draft' ? scopeFields(data, { faculty: String(draft.faculty || ''), major: String(draft.major || ''), degreeSystem: String(draft.degreeSystem || ''), intakeStartYear: Number(draft.intakeStartYear), intakeEndYear: Number(draft.intakeEndYear) }, value => setDraft(current => current ? { ...current, ...value } : current)) : <p className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">Phạm vi: {selected.faculty} · {selected.major} · {selected.degreeSystem} · khóa {selected.intakeStartYear}–{selected.intakeEndYear}. Phiên bản đã công bố không thể sửa cấu trúc.</p>}
      <div className="space-y-3"><div className="flex items-center justify-between"><h4 className="font-bold">Học kỳ dự kiến</h4>{selected.status === 'draft' && <button className={secondary} onClick={() => updateDraft('terms', [...terms, { id: crypto.randomUUID(), sequence: Math.max(0, ...terms.map(term => term.sequence)) + 1, name: `Kỳ ${terms.length + 1}`, yearOffset: null, termNumber: null }])}>+ Thêm học kỳ</button>}</div>{terms.map((term, index) => <div key={term.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-5 dark:border-slate-700"><div className="text-sm font-semibold sm:col-span-5">{term.name}: {courses.filter(course => course.termId === term.id).reduce((sum, course) => sum + course.credits, 0)} TC theo khung</div><label className={field}>Thứ tự<input type="number" className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={term.sequence} onChange={event => updateDraft('terms', terms.map((row, i) => i === index ? { ...row, sequence: Number(event.target.value) } : row))} /></label><label className={field}>Tên kỳ<input className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={term.name} onChange={event => updateDraft('terms', terms.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></label><label className={field}>Năm lệch từ khóa nhập học<input type="number" min={0} className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={term.yearOffset ?? ''} onChange={event => updateDraft('terms', terms.map((row, i) => i === index ? { ...row, yearOffset: event.target.value === '' ? null : Number(event.target.value) } : row))} /></label><label className={field}>Học kỳ thực tế<select className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={term.termNumber ?? ''} onChange={event => updateDraft('terms', terms.map((row, i) => i === index ? { ...row, termNumber: event.target.value ? Number(event.target.value) as 1 | 2 | 3 : null } : row))}><option value="">Chưa ánh xạ</option><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option><option value="3">Học kỳ hè</option></select></label>{selected.status === 'draft' && <button className="self-end text-sm text-red-700" onClick={() => { updateDraft('terms', terms.filter(row => row.id !== term.id)); updateDraft('courses', courses.filter(course => course.termId !== term.id)); }}>Xóa kỳ</button>}</div>)}{!terms.length && <p className="text-sm text-slate-500">Chưa có học kỳ dự kiến.</p>}</div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">Môn học trong chương trình</h4>
          {selected.status === 'draft' && <button type="button" className={secondary} disabled={!terms.length} onClick={() => {
            if (!data.subjects.some(subject => subject.active)) { setMessage({ error: true, text: 'Danh mục chưa có môn học đang hoạt động.' }); return; }
            updateDraft('courses', [...courses, { id: crypto.randomUUID(), termId: terms[0].id, subjectId: null, code: '', name: '', credits: 0, required: true, electiveGroupId: null, prerequisiteCourseIds: [] }]);
          }}>+ Thêm môn</button>}
        </div>
        {courses.map((course, index) => <div key={course.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-700">
          <div className="xl:col-span-2">{selected.status === 'draft' ? <ChoiceSelect label="Môn học" order="label" className={`${input} mt-1`} value={course.subjectId || ''} emptyLabel="Chọn môn…" options={data.subjects.filter(subject => subject.active || subject.id === course.subjectId).map(subject => ({ value: subject.id, label: `${subject.code} · ${subject.name} (${subject.credits} TC)${!subject.active ? ' · ngừng hoạt động' : ''}` }))} onChange={event => {
            const subject = data.subjects.find(row => row.id === event.target.value);
            if (subject) updateDraft('courses', courses.map((row, i) => i === index ? { ...row, subjectId: subject.id, code: subject.code, name: subject.name, credits: subject.credits } : row));
          }} /> : <div className="text-sm"><span className="font-semibold">{course.code} · {course.name}</span><span className="ml-2 text-slate-500">{course.credits} TC{course.required ? '' : ' · tự chọn trong phiên bản cũ'}</span></div>}</div>
          <label className={field}>Học kỳ<select className={`${input} mt-1`} disabled={selected.status !== 'draft'} value={course.termId} onChange={event => updateDraft('courses', courses.map((row, i) => i === index ? { ...row, termId: event.target.value } : row))}><option value="">Chọn kỳ…</option>{[...terms].sort((a, b) => a.sequence - b.sequence).map(term => <option key={term.id} value={term.id}>{term.name}</option>)}</select></label>
          <label className={field}>Môn tiên quyết<select multiple size={Math.min(Math.max(courses.length, 2), 4)} disabled={selected.status !== 'draft'} className={`${input} mt-1`} value={course.prerequisiteCourseIds} onChange={event => updateDraft('courses', courses.map((row, i) => i === index ? { ...row, prerequisiteCourseIds: [...event.target.selectedOptions].map(option => option.value) } : row))}>{[...courses].sort((a, b) => compareVietnamese(a.code, b.code)).filter(row => row.id !== course.id).map(row => <option key={row.id} value={row.id}>{row.code || 'Chưa chọn môn'}</option>)}</select></label>
          {selected.status === 'draft' && <button type="button" className="text-left text-sm text-red-700 xl:col-span-4" onClick={() => updateDraft('courses', courses.filter(row => row.id !== course.id).map(row => ({ ...row, prerequisiteCourseIds: row.prerequisiteCourseIds.filter(id => id !== course.id) })))}>Xóa môn</button>}
        </div>)}
        {!courses.length && <p className="text-sm text-slate-500">Chưa có môn được xếp vào chương trình.</p>}
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><strong>Tín chỉ các môn:</strong> {courses.reduce((sum, course) => sum + course.credits, 0)} · <strong>Tổng tín chỉ yêu cầu:</strong> {Number(draft.totalCreditsRequired)}. {selected.status === 'draft' ? 'Các môn trong bản nháp đều là môn bắt buộc.' : selected.electiveGroups.length ? 'Phiên bản cũ có môn tự chọn; cấu trúc đã công bố được giữ nguyên.' : ''}</div>
      {selected.status === 'draft' && <p className="text-xs text-slate-500">Học kỳ trong chương trình được ánh xạ theo năm lệch so với khóa nhập học; để trống ánh xạ nếu chưa cấu hình. Học kỳ thực tế và lịch sử điểm không bị thay đổi khi lưu chương trình.</p>}
      {selected.status === 'draft' && <button type="button" disabled={busy} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300" onClick={async () => { if (window.confirm(`Xóa bản nháp chương trình ${program?.code || selected.version}?`)) { if (await post('curriculum.draft.delete', { id: selected.id }, 'Đã xóa bản nháp.')) setSelectedId(''); } }}>Xóa bản nháp</button>}
    </section>}

  </div>;
}
