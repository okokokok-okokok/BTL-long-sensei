const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
export function compareVietnamese(left: string, right: string) {
  return collator.compare(left.normalize('NFKC').trim(), right.normalize('NFKC').trim()) || left.localeCompare(right, 'vi', { numeric: true });
}

export function sortChoices<T extends { label: string; value: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => compareVietnamese(a.label, b.label) || compareVietnamese(a.value, b.value));
}
