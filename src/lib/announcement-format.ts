export function formatAnnouncementDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export function formatTimeAgo(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed)) return value;
  const minutes = Math.floor(elapsed / 60000), hours = Math.floor(elapsed / 3600000), days = Math.floor(elapsed / 86400000);
  if (minutes < 5) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'Hôm qua';
  if (days <= 7) return `${days} ngày trước`;
  return formatAnnouncementDate(value);
}
