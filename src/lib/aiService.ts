import { getChatbotResponse, cleanFormattedText } from './chatbotKnowledge';
import { Language } from './translations';

export interface UserChatContext {
  role?: 'student' | 'lecturer' | 'admin' | 'academic';
  name?: string;
  studentCode?: string;
  lecturerCode?: string;
  class?: string;
  faculty?: string;
  department?: string;
  major?: string;
  academicYear?: string;
  gpa?: number;
}

export type StudentContext = UserChatContext;

export interface ChatHistoryMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface AiResponse {
  reply: string;
  modelName: string;
  provider: 'gemini' | 'groq' | 'openrouter' | 'local';
  isFallback: boolean;
  fallbackReason?: string;
}

function buildSystemPrompt(ctx?: UserChatContext, lang: Language = 'vi'): string {
  const isLecturer = ctx?.role === 'lecturer';

  return `Bạn là "PTITHAH AI" - Trợ lý số thông minh chính thức của Học viện Công nghệ Bưu chính Viễn thông (PTIT).
Thông tin cơ sở đào tạo:
- Tên trường: Học viện Công nghệ Bưu chính Viễn thông (PTIT)
- Địa chỉ: 96A Trần Phú, Quận Hà Đông, Hà Nội (Cơ sở 1) và Số 11 Nguyễn Du, Quận 1, TP.HCM (Cơ sở 2).
- Cổng quản lý đào tạo & khảo thí: qldt.ptit.edu.vn | Hotline Giáo vụ: (024) 3352 8122

${isLecturer ? `Thông tin Giảng viên đang làm việc:
- Họ và tên: ${ctx?.name || 'Chưa có thông tin'}
- Mã cán bộ/giảng viên: ${ctx?.lecturerCode || 'Chưa có thông tin'}
- Đơn vị công tác: ${ctx?.department || 'Chưa có thông tin'}
- Khoa quản lý: ${ctx?.faculty || 'Chưa có thông tin'}

Phong thái và nghiệp vụ hỗ trợ Giảng viên:
1. Xưng hô trân trọng, chuẩn mực môi trường học thuật đại học ("Kính chào Thầy/Cô", "Tôi xin phép hỗ trợ Thầy/Cô...", "Theo quy định đào tạo và khảo thí của Học viện...").
2. Nắm vững nghiệp vụ giảng dạy: Quy định vào điểm quá trình (chuyên cần 10%, giữa kỳ 30%), quy định nộp bảng điểm thi kết thúc học phần (trong 7 ngày làm việc), quy trình xin điều chỉnh điểm sau khóa sổ, quy chế coi thi và lập biên bản xử lý vi phạm.
3. Hỗ trợ thông tin chi tiết về Khung chương trình đào tạo theo đúng ngành và khóa được cung cấp, đề cương chi tiết học phần, chuẩn đầu ra.` : `Thông tin Sinh viên đang đăng nhập:
- Họ và tên: ${ctx?.name || 'Chưa có thông tin'}
- Mã sinh viên: ${ctx?.studentCode || 'Chưa có thông tin'}
- Lớp học phần: ${ctx?.class || 'Chưa có thông tin'}
- Khoa quản lý: ${ctx?.faculty || 'Chưa có thông tin'}
- Ngành học: ${ctx?.major || 'Chưa có thông tin'} (không suy đoán tổng tín chỉ khi chưa có dữ liệu chương trình)
- Khóa học: ${ctx?.academicYear || 'Chưa có thông tin'}

Phong thái và nghiệp vụ hỗ trợ Sinh viên:
1. Xưng hô lịch thiệp, ân cần, nhiệt tình, uy tín như Cố vấn học tập PTIT ("Chào bạn", "Tôi có thể hỗ trợ bạn...", "Theo quy chế đào tạo tín chỉ của Học viện...").
2. Nắm vững quy chế đào tạo tín chỉ PTIT: thang điểm 4, điểm chữ (A+, A, B+, B, C+, C, D+, D, F), cách tính GPA/CPA tích lũy, điều kiện xét học bổng khuyến khích, quy trình đăng ký/rút học phần trên qldt, nộp học phí VNPay, xem lịch thi và phòng thi.
3. Hướng dẫn kiến thức chuyên ngành Điện tử Viễn thông, Công nghệ thông tin, bài tập toán cao cấp, xử lý tín hiệu một cách mạch lạc, dễ hiểu.`}

Nếu thiếu thông tin tài khoản, chương trình hoặc kết quả học tập, nói rõ chưa có dữ liệu; không tự tạo tên người, mã, điểm, tổng tín chỉ hoặc khẳng định đã thực hiện thao tác nghiệp vụ.

Quy chuẩn trình bày và phong thái:
- Trình bày câu trả lời lịch sự, chuyên nghiệp, chuẩn mực văn phong công sở hành chính.
- TUYỆT ĐỐI KHÔNG sử dụng các ký tự định dạng markdown như: dấu hoa thị (** hoặc *), dấu thăng (### hoặc #), dấu gạch dưới (__), hoặc dấu nháy ngược. Trình bày hoàn toàn bằng văn bản thuần túy sạch sẽ, không chứa ký tự rác.
- Khi liệt kê các bước hoặc danh mục, chỉ sử dụng số thứ tự (1., 2., 3.) hoặc dấu gạch ngang đầu dòng chuẩn (- ).
- TUYỆT ĐỐI KHÔNG nhắc đến các từ ngữ kỹ thuật máy móc như "fallback", "quota", "API key", "tầng 1/2".
- Trả lời bằng ngôn ngữ người dùng yêu cầu (Mã ngôn ngữ hiện tại: ${lang}).`;
}

// 1. Gemini Caller
async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data?.models)) {
      const generateModels = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''));
      return generateModels;
    }
  } catch (e) {
    console.warn('Failed to fetch Gemini models list:', e);
  }
  return [];
}

async function callGemini(
  model: string,
  apiKey: string,
  query: string,
  history: ChatHistoryMessage[],
  systemPrompt: string
): Promise<string> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const cleanModel = model.replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;

  // Gemini requires turns to strictly start with role: 'user' and alternate roles
  const validTurns: { role: 'user' | 'model'; parts: [{ text: string }] }[] = [];

  for (const msg of history.slice(-6)) {
    const role = msg.sender === 'user' ? 'user' : 'model';
    // Skip leading model turns (greeting etc.)
    if (validTurns.length === 0 && role === 'model') {
      continue;
    }
    // Skip duplicate consecutive identical roles
    if (validTurns.length > 0 && validTurns[validTurns.length - 1].role === role) {
      continue;
    }
    validTurns.push({
      role,
      parts: [{ text: msg.text }],
    });
  }

  // Append user's current query
  if (validTurns.length > 0 && validTurns[validTurns.length - 1].role === 'user') {
    validTurns[validTurns.length - 1] = {
      role: 'user',
      parts: [{ text: `${validTurns[validTurns.length - 1].parts[0].text}\n${query}` }],
    };
  } else {
    validTurns.push({
      role: 'user',
      parts: [{ text: query }],
    });
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: validTurns,
    generationConfig: {
      maxOutputTokens: 1000,
    },
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // Try v1 API endpoint if v1beta returned 404
  if (response.status === 404) {
    const v1Url = `https://generativelanguage.googleapis.com/v1/models/${cleanModel}:generateContent?key=${cleanKey}`;
    const v1Res = await fetch(v1Url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (v1Res.ok) {
      response = v1Res;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMsg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson?.error?.message) {
        parsedMsg = errJson.error.message;
      }
    } catch {}
    const error = new Error(`Gemini ${cleanModel} Error (${response.status}): ${parsedMsg}`);
    (error as any).status = response.status;
    (error as any).details = parsedMsg;
    throw error;
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const nonThoughtParts = parts.filter((p: any) => !p.thought);
  const text = (nonThoughtParts.length > 0 ? nonThoughtParts : parts)
    .map((p: any) => p.text || '')
    .filter(Boolean)
    .join('\n');

  if (!text) {
    throw new Error(`Gemini ${cleanModel} returned empty response`);
  }
  return text.trim();
}

// 2. Groq Caller (OpenAI-compatible)
async function callGroq(
  model: string,
  apiKey: string,
  query: string,
  history: ChatHistoryMessage[],
  systemPrompt: string
): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: query },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Groq ${model} Error (${response.status}): ${errorText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`Groq ${model} returned empty response`);
  }
  return text.trim();
}

// 3. OpenRouter Free Caller
async function callOpenRouter(
  model: string,
  apiKey: string,
  query: string,
  history: ChatHistoryMessage[],
  systemPrompt: string
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: query },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'PTIT Student Portal',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`OpenRouter ${model} Error (${response.status}): ${errorText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`OpenRouter ${model} returned empty response`);
  }
  return text.trim();
}

/**
 * Multi-Tier Fallback Cascade Engine:
 * 1. Gemini 1.5 Flash (Tier 1)
 * 2. Gemini 1.5 Flash 8B (Tier 2)
 * 3. Gemini 2.0 Flash (Tier 3)
 * 4. Groq Llama 3.3 70B (Tier 4)
 * 5. Groq Llama 3.1 8B (Tier 5)
 * 6. OpenRouter Free (Tier 6)
 * 7. Local PTIT Rule-based Knowledge Base (Tier 7 - 100% Offline Safeguard)
 */
export interface CustomApiKeys {
  geminiKey?: string;
  groqKey?: string;
  openRouterKey?: string;
}

export async function getAiResponseWithFallback(
  query: string,
  history: ChatHistoryMessage[] = [],
  studentContext?: StudentContext,
  language: Language = 'vi',
  customKeys?: CustomApiKeys
): Promise<AiResponse> {
  let geminiKey = (customKeys?.geminiKey?.trim().replace(/^["']|["']$/g, '') || process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()) || '';
  const groqKey = (customKeys?.groqKey?.trim().replace(/^["']|["']$/g, '') || process.env.GROQ_API_KEY?.trim() || process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim()) || '';
  const openRouterKey = (customKeys?.openRouterKey?.trim().replace(/^["']|["']$/g, '') || process.env.OPENROUTER_API_KEY?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.trim()) || '';

  // Auto-resolve Admin-configured key from system_settings if not passed
  if (!geminiKey || geminiKey.length < 10) {
    try {
      const { getSystemAiConfig } = await import('@/lib/neon');
      const sysConfig = await getSystemAiConfig();
      if (sysConfig?.geminiKey && sysConfig.geminiKey.length >= 10) {
        geminiKey = sysConfig.geminiKey.trim().replace(/^["']|["']$/g, '');
      }
    } catch (e) {
      console.warn('[PTITHAH AI] System config load notice:', e);
    }
  }

  const systemPrompt = buildSystemPrompt(studentContext, language);

  interface TierCandidate {
    name: string;
    provider: 'gemini' | 'groq' | 'openrouter';
    runner: () => Promise<string>;
  }

  const candidates: TierCandidate[] = [];

  // Add Gemini models if API Key exists and valid
  if (geminiKey && geminiKey.length >= 10) {
    const liveModels = await getAvailableGeminiModels(geminiKey);
    const preferredOrder = [
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-3.6-pro',
      'gemini-1.5-pro',
    ];

    const sortedModels: string[] = [];
    if (liveModels.length > 0) {
      for (const pref of preferredOrder) {
        if (liveModels.includes(pref) && !sortedModels.includes(pref)) {
          sortedModels.push(pref);
        }
      }
      for (const m of liveModels) {
        if (!sortedModels.includes(m) && (m.includes('flash') || m.includes('pro') || m.includes('gemini'))) {
          sortedModels.push(m);
        }
      }
    }

    // Fallback model list if ListModels was empty
    if (sortedModels.length === 0) {
      sortedModels.push('gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash');
    }

    for (const model of sortedModels.slice(0, 4)) {
      candidates.push({
        name: `Gemini ${model}`,
        provider: 'gemini',
        runner: () => callGemini(model, geminiKey, query, history, systemPrompt),
      });
    }
  }

  // Add Groq models if API Key exists and valid
  if (groqKey && groqKey.length >= 10) {
    candidates.push(
      {
        name: 'Llama 3.3 70B',
        provider: 'groq',
        runner: () => callGroq('llama-3.3-70b-versatile', groqKey, query, history, systemPrompt),
      },
      {
        name: 'Llama 3.1 8B',
        provider: 'groq',
        runner: () => callGroq('llama-3.1-8b-instant', groqKey, query, history, systemPrompt),
      }
    );
  }

  // Add OpenRouter models if API Key exists and valid
  if (openRouterKey && openRouterKey.length >= 10 && openRouterKey.startsWith('sk-or-')) {
    candidates.push({
      name: 'Llama 3.3 Free',
      provider: 'openrouter',
      runner: () =>
        callOpenRouter('meta-llama/llama-3.3-70b-instruct:free', openRouterKey, query, history, systemPrompt),
    });
  }

  // Execute candidate runners silently
  for (const candidate of candidates) {
    try {
      console.log(`[PTITHAH AI] Processing via ${candidate.name}...`);
      const reply = await candidate.runner();
      return {
        reply: cleanFormattedText(reply),
        modelName: 'PTITHAH AI',
        provider: candidate.provider,
        isFallback: false,
      };
    } catch (err: any) {
      console.warn(`[PTITHAH AI] Candidate ${candidate.name} unavailable, trying next...`);
    }
  }

  // Safeguard: Local PTIT Academic Knowledge Base
  console.log('[PTITHAH AI] Serving response from PTIT Academic Knowledge Base');
  const localReply = getChatbotResponse(query, language);
  return {
    reply: cleanFormattedText(localReply),
    modelName: 'PTITHAH AI',
    provider: 'local',
    isFallback: false,
  };
}
