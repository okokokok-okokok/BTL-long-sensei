import { NextResponse } from 'next/server';
import { getPublicAnnouncementFeed } from '@/lib/giaovu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // This endpoint has always been public. It serves only published public
    // articles, never portal state, personal notifications or support replies.
    const feed = await getPublicAnnouncementFeed();
    return NextResponse.json({
      status: 'success',
      ...feed,
      count: feed.data.length,
      timestamp: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Chưa tải được thông báo Giáo vụ. Vui lòng thử lại.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

