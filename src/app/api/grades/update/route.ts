import { NextRequest } from 'next/server';
import { compat } from '@/lib/portal/compat';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) { return compat(request, 'update-grade'); }
