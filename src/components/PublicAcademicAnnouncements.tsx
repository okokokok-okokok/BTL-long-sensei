'use client';

import { useAnnouncements } from '@/context/AnnouncementContext';
import { formatAnnouncementDate } from '@/lib/announcement-format';

export function PublicAcademicAnnouncements() {
  const { announcements, isLoading, error, refreshAnnouncements, allAnnouncementsUrl } = useAnnouncements();
  const latest = announcements.slice(0, 5);
  return <section aria-labelledby="login-announcements-title" className="relative z-10 min-w-0 rounded-2xl border border-white/20 bg-white/10 text-white">
    <h2 id="login-announcements-title" className="border-b border-white/15 px-5 py-3 font-bold">Thông báo Giáo vụ</h2>
    <div aria-busy={isLoading} className="max-h-64 overflow-y-auto overscroll-contain px-5 py-2 sm:max-h-72">
      {isLoading && !latest.length && <p role="status" className="py-5 text-sm text-white/85">Đang tải thông báo…</p>}
      {error && <div role="alert" className="my-2 rounded-lg border border-white/20 bg-black/10 p-3 text-sm"><p>Chưa tải được thông báo Giáo vụ.</p><button type="button" onClick={() => void refreshAnnouncements()} disabled={isLoading} className="mt-2 font-semibold underline underline-offset-4 disabled:opacity-50">{isLoading ? 'Đang tải…' : 'Thử lại'}</button></div>}
      {!isLoading && !error && !latest.length && <p className="py-5 text-sm text-white/85">Chưa có thông báo công khai.</p>}
      <ul className="divide-y divide-white/15">{latest.map(item => <li key={item.id} className="py-3">
        <h3 className="line-clamp-2 break-words text-sm font-semibold leading-5" title={item.title}>{item.title}</h3>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs"><time dateTime={item.date} className="text-white/75">{formatAnnouncementDate(item.date)}</time><a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`Xem chi tiết: ${item.title}`} className="shrink-0 font-semibold underline underline-offset-4 hover:text-white/80 focus-visible:outline focus-visible:outline-2">Xem chi tiết <span aria-hidden="true">↗</span></a></div>
      </li>)}</ul>
    </div>
    <div className="border-t border-white/15 px-5 py-3">{allAnnouncementsUrl ? <a href={allAnnouncementsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline underline-offset-4 hover:text-white/80">Xem tất cả thông báo <span aria-hidden="true">↗</span></a> : <p className="text-xs text-white/75">Chưa có liên kết Giáo vụ hợp lệ.</p>}</div>
  </section>;
}
