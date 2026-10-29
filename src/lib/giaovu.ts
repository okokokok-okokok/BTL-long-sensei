import type { PublicAnnouncement, PublicAnnouncementFeed } from '@/types/public-announcements';

// Decode HTML entities and clean markup
export function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\[&hellip;\]/g, '...')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => {
      const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export { formatTimeAgo } from './announcement-format';

export function giaovuSiteUrl(value = process.env.GIAOVU_SITE_URL || 'https://giaovu.ptit.edu.vn/') {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public announcement source');
  url.search = ''; url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

interface PublicPost {
  id?: unknown; status?: unknown; type?: unknown; password?: unknown;
  date?: unknown; date_gmt?: unknown; link?: unknown;
  title?: { rendered?: unknown }; excerpt?: { rendered?: unknown; protected?: unknown }; content?: { protected?: unknown };
}

export function normalizePublicAnnouncements(posts: unknown[], siteUrl: string, now = Date.now()): PublicAnnouncement[] {
  const site = new URL(siteUrl);
  const normalized: PublicAnnouncement[] = [];
  for (const value of posts) {
    if (!value || typeof value !== 'object') continue;
    const post = value as PublicPost;
    if (post.status !== 'publish' || (post.type && post.type !== 'post') || post.password || post.excerpt?.protected || post.content?.protected) continue;
    if (!Number.isSafeInteger(post.id) || Number(post.id) <= 0 || typeof post.link !== 'string' || typeof post.title?.rendered !== 'string') continue;
    const title = cleanHtml(post.title.rendered);
    if (!title) continue;
    let link: URL;
    try { link = new URL(post.link, site); } catch { continue; }
    if (!['https:', 'http:'].includes(link.protocol) || link.origin !== site.origin || link.username || link.password || !link.pathname.startsWith(site.pathname)) continue;
    link.hash = '';
    for (const key of [...link.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) link.searchParams.delete(key);
    const rawDate = typeof post.date_gmt === 'string' && post.date_gmt ? post.date_gmt : post.date;
    if (typeof rawDate !== 'string') continue;
    const withZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(rawDate) ? rawDate : rawDate + (rawDate === post.date_gmt ? 'Z' : '+07:00');
    const date = new Date(withZone);
    if (!Number.isFinite(date.getTime()) || date.getTime() > now) continue;
    normalized.push({
      id: `giaovu-${post.id}`, title,
      content: typeof post.excerpt?.rendered === 'string' ? cleanHtml(post.excerpt.rendered) : '',
      date: date.toISOString(), link: link.toString(), source: site.hostname,
      isUrgent: /kế hoạch thi|lịch thi|tốt nghiệp|học phí|hạn nộp|khẩn|nghỉ học/i.test(title) || now - date.getTime() < 3 * 86400000,
    });
  }
  const ids = new Set<string>(), links = new Set<string>();
  return normalized.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).filter(item => {
    if (ids.has(item.id) || links.has(item.link)) return false;
    ids.add(item.id); links.add(item.link); return true;
  });
}

// One cache and one pending request serve both the login panel and the bell.
// Only the anonymous WordPress published-post feed is read; no database fallback.
export function createPublicAnnouncementFeed(siteUrl: string, fetcher: typeof fetch = fetch, clock = Date.now) {
  const site = giaovuSiteUrl(siteUrl);
  let cache: { at: number; value: PublicAnnouncementFeed } | null = null;
  let pending: Promise<PublicAnnouncementFeed> | null = null;
  return async (): Promise<PublicAnnouncementFeed> => {
    if (cache && clock() - cache.at < 60000) return structuredClone(cache.value);
    if (!pending) pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const url = new URL('wp-json/wp/v2/posts', site);
        url.search = new URLSearchParams({ per_page: '20', status: 'publish', orderby: 'date', order: 'desc', _fields: 'id,status,type,date,date_gmt,title,excerpt,content.protected,link' }).toString();
        const response = await fetcher(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Public announcement source unavailable');
        const posts: unknown = await response.json();
        if (!Array.isArray(posts)) throw new Error('Invalid public announcement feed');
        const data = normalizePublicAnnouncements(posts, site, clock()).slice(0, 10);
        const value = { data, source: new URL(site).hostname, allAnnouncementsUrl: site };
        cache = { at: clock(), value };
        return value;
      } finally { clearTimeout(timeout); }
    })().finally(() => { pending = null; });
    return structuredClone(await pending);
  };
}

let configuredSite = '';
let readFeed: ReturnType<typeof createPublicAnnouncementFeed> | undefined;
export function getPublicAnnouncementFeed() {
  const site = giaovuSiteUrl();
  if (!readFeed || configuredSite !== site) { configuredSite = site; readFeed = createPublicAnnouncementFeed(site); }
  return readFeed();
}

export async function fetchGiaovuAnnouncements(limit = 10) {
  return (await getPublicAnnouncementFeed()).data.slice(0, Math.max(0, limit));
}
