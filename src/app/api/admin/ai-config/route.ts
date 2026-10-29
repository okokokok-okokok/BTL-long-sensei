import { guard } from '@/lib/portal/compat';
import { apiError, readBody } from '@/lib/portal/session';
import { NextRequest, NextResponse } from 'next/server';
import { getSystemAiConfig, setSystemAiConfig } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentActor = await guard(request, ['admin']);
    const config = await getSystemAiConfig();
    const key = config.geminiKey || '';
    const isConfigured = key.length >= 10;
    const maskedKey = isConfigured
      ? `${key.slice(0, 7)}••••••••${key.slice(-4)}`
      : '';

    return NextResponse.json({
      status: 'success',
      data: {
        isConfigured,
        maskedKey,
        updatedAt: config.updatedAt,
        botName: 'PTITHAH AI',
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return apiError(error);
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      { status: 'error', message: 'Không thể lấy cấu hình AI' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentActor = await guard(request, ['admin']);
    const body = await readBody(request);
    const { geminiKey, testOnly } = body;

    if (!geminiKey || typeof geminiKey !== 'string' || geminiKey.length > 512) {
      return NextResponse.json(
        { status: 'error', message: 'API Key không hợp lệ' },
        { status: 400 }
      );
    }

    const cleanKey = geminiKey.trim().replace(/^["']|["']$/g, '');

    // Test connection with Google Gemini
    let testSuccess = false;
    let testMessage = '';
    let modelsCount = 0;

    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        modelsCount = Array.isArray(data?.models) ? data.models.length : 0;
        testSuccess = true;
        testMessage = `Kết nối Google AI thành công! Tìm thấy ${modelsCount} mô hình AI khả dụng.`;
      } else {
        const errText = await res.text();
        let parsed = errText;
        try {
          const j = JSON.parse(errText);
          if (j?.error?.message) parsed = j.error.message;
        } catch {}
        testSuccess = false;
        testMessage = `Lỗi kiểm tra Google AI (${res.status}): ${parsed}`;
      }
    } catch (err: any) {
      testSuccess = false;
      testMessage = `Không thể kết nối đến máy chủ Google: ${err?.message || 'Lỗi mạng hoặc hết thời gian chờ'}`;
    }

    if (testOnly) {
      return NextResponse.json({
        status: testSuccess ? 'success' : 'error',
        message: testMessage,
        data: { testSuccess, modelsCount },
      });
    }

    // Save to database
    const saved = await setSystemAiConfig(cleanKey);
    if (!saved) {
      return NextResponse.json(
        { status: 'error', message: 'Không thể lưu API Key vào cơ sở dữ liệu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: testSuccess
        ? `Lưu cấu hình PTITHAH AI thành công! ${testMessage}`
        : `Đã lưu API Key vào hệ thống (Cảnh báo kiểm tra: ${testMessage})`,
      data: {
        testSuccess,
        modelsCount,
        isConfigured: true,
      },
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return apiError(error);
    console.error('Error saving AI config:', error);
    return NextResponse.json(
      { status: 'error', message: 'Lỗi máy chủ khi lưu cấu hình AI' },
      { status: 500 }
    );
  }
}
