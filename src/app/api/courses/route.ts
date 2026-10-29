import { NextRequest } from 'next/server';
import { compat } from '@/lib/portal/compat';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) { return compat(request, 'courses'); }
export async function POST(request: NextRequest) { return compat(request, 'courses'); }
