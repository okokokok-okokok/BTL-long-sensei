import { guard } from '@/lib/portal/compat';
import { apiError } from '@/lib/portal/session';
import { NextRequest, NextResponse } from 'next/server';
import { getAiResponseWithFallback, StudentContext, ChatHistoryMessage } from '@/lib/aiService';
import { Language } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const currentActor = await guard(request);
    const body = await request.json();
    const { query, history, studentContext, language, customKeys } = body as {
      query: string;
      history?: ChatHistoryMessage[];
      studentContext?: StudentContext;
      language?: Language;
      customKeys?: { geminiKey?: string; groqKey?: string; openRouterKey?: string };
    };

    if (!query || !query.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Query string is required' },
        { status: 400 }
      );
    }

    const result = await getAiResponseWithFallback(
      query.trim(),
      history || [],
      studentContext,
      language || 'vi',
      customKeys
    );

    return NextResponse.json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof Error && "status" in error) return apiError(error);
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Internal AI Server Error' },
      { status: 500 }
    );
  }
}
