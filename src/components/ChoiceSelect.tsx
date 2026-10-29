'use client';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { sortChoices } from '@/lib/portal/choice-order';
export interface ChoiceOption { value: string; label: string; disabled?: boolean }
interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: ChoiceOption[]; emptyLabel: string; label: string; containerClassName?: string;
  order?: 'label' | 'preserve';
}
export function ChoiceSelect({ options, emptyLabel, label, containerClassName, order = 'preserve', ...props }: Props) {
  const [search, setSearch] = useState('');
  const id = useId();
  const optionSet = options.map(option => option.value).join('\u0000');
  useEffect(() => { setSearch(''); }, [optionSet]);
  const visible = useMemo(() => {
    const matched = options.filter(option => option.value === String(props.value ?? '') || option.label.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
    return order === 'label' ? sortChoices(matched) : matched;
  }, [options, props.value, search, order]);
  return <div className={containerClassName || 'min-w-0'}>
    {options.length > 8 && <input type="search" aria-label={`Tìm trong ${label.toLocaleLowerCase('vi')}`} aria-controls={props.id || id} placeholder={`Tìm ${label.toLocaleLowerCase('vi')}…`} value={search} onChange={event => setSearch(event.target.value)} disabled={props.disabled} className="mb-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />}
    <select {...props} id={props.id || id} aria-label={props['aria-label'] || label}>
      <option value="">{emptyLabel}</option>
      {visible.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      {!visible.length && search && <option disabled>Không tìm thấy lựa chọn phù hợp</option>}
    </select>
  </div>;
}
