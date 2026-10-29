import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ status: 'error', message: 'Dùng npm run db:upgrade để cập nhật có sao lưu. Không khởi tạo database qua URL.' }, { status: 405 }); }
export const POST = GET;
