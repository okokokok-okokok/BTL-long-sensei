'use client';

import { apiFetch } from '@/lib/apiFetch';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { PTIT_FAQS, getChatbotResponse, cleanFormattedText, ChatMessage } from '@/lib/chatbotKnowledge';

interface ChatbotWidgetProps {
  isLoginPage?: boolean;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ isLoginPage = false }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLecturer = user?.role === 'lecturer';

  const getGreetingText = useCallback((lang: string, lecturer: boolean): string => {
    if (lecturer) {
      const lecturerGreetings: Record<string, string> = {
        vi: `Kính chào ${user?.name ? user.name : 'Thầy/Cô'}! Tôi là PTITHAH AI - Trợ lý số Học viện Công nghệ Bưu chính Viễn thông. Tôi sẵn sàng hỗ trợ Thầy/Cô về quy chế khảo thí, nhập điểm học phần trên qldt, thời hạn nộp bảng điểm, quy định coi thi và chương trình đào tạo Khoa Viễn thông 1.`,
        en: `Greetings Professor ${user?.name || ''}! I am PTITHAH AI - Digital Academic Assistant of PTIT Academy. I am here to assist you with grading regulations, score submissions on qldt, invigilation protocols, and academic affairs.`,
        zh: `尊敬的 ${user?.name || '老师'} 您好！我是 PTITHAH AI - 邮电通信学院官方智能教学教务助教。随时为您提供成绩录入、监考守则、教务规章及培养方案查询服务。`,
        ko: `안녕하십니까 교수님! 저는 PTITHAH AI - 우전통신대학(PTIT) 교수용 스마트 학사 도우미입니다. 성적 입력 및 제출 규정, 시험 감독 지침 및 학사 일정을 안내해 드립니다.`,
        ja: `先生、こんにちは！PTITHAH AI - 郵電通信学院（PTIT）教員向けデジタルアシスタントです。成績入力規定、提出期限、試験監督規則やカリキュラムに関するご案内をいたします。`,
      };
      return lecturerGreetings[lang] || lecturerGreetings.vi;
    }

    const studentGreetings: Record<string, string> = {
      vi: `Xin chào ${user?.name ? user.name : 'bạn'}! Tôi là PTITHAH AI - Trợ lý số thông minh của Học viện Công nghệ Bưu chính Viễn thông. Tôi có thể hỗ trợ bạn tra cứu lịch thi & phòng thi, cách tính GPA/CPA, đăng ký tín chỉ, nộp học phí VNPay và quy chế đào tạo Khoa Viễn thông 1. Bạn cần giải đáp gì hôm nay?`,
      en: `Hello ${user?.name || 'there'}! I am PTITHAH AI - Official Academic Assistant of PTIT Academy. I can help you with exam schedules, GPA calculation, course registration, tuition payments, and academy regulations!`,
      zh: `同学你好！我是 PTITHAH AI - 邮电通信学院智能学业助教。我可以为您解答考试日程与考场、GPA计算、选课流程、VNPay学费缴纳以及电信一系的各项教学规章！`,
      ko: `안녕하세요! 저는 PTITHAH AI - 우전통신대학(PTIT) 공식 학사 인공지능 도우미입니다. 시험 일정 및 고사장, GPA 학점 계산, 수강 신청, 등록금 납부 및 학사 규정에 대해 친절히 안내해 드립니다.`,
      ja: `こんにちは！PTITHAH AI - 郵電通信学院（PTIT）公式デジタルアシスタントです。試験日程・教室、GPA計算、履修登録、学費納入や学院規定についてご案内いたします。`,
    };
    return studentGreetings[lang] || studentGreetings.vi;
  }, [user?.name]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: getGreetingText(language, isLecturer),
      timestamp: 'Vừa xong',
      modelName: 'PTITHAH AI',
    },
  ]);

  // Update greeting when language or user role switches
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'init-1') {
        return [
          {
            id: 'init-1',
            sender: 'bot',
            text: getGreetingText(language, isLecturer),
            timestamp: 'Vừa xong',
            modelName: 'PTITHAH AI',
          },
        ];
      }
      return prev;
    });
  }, [language, isLecturer, getGreetingText]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          studentContext: user
            ? {
                role: user.role,
                name: user.name,
                studentCode: (user as any).studentCode || (user.role === 'student' ? user.username : undefined),
                lecturerCode: (user as any).lecturerCode || (user.role === 'lecturer' ? user.username : undefined),
                class: (user as any).class || (user as any).className,
                faculty: (user as any).faculty || 'Khoa Viễn thông 1',
                department: (user as any).department || 'Khoa Viễn thông 1',
                major: (user as any).major || 'Kỹ thuật Điện tử Viễn thông',
                academicYear: (user as any).academicYear || '2023 - 2027',
              }
            : undefined,
          language,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          const { reply, modelName } = json.data;
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: cleanFormattedText(reply),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelName: modelName || 'PTITHAH AI',
            isFallback: false,
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('API response invalid');
    } catch (err) {
      console.warn('[PTITHAH AI] API chat fallback notice', err);
      const responseText = getChatbotResponse(text, language);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: cleanFormattedText(responseText),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelName: 'PTITHAH AI',
        isFallback: false,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: getGreetingText(language, isLecturer),
        timestamp: 'Vừa xong',
        modelName: 'PTITHAH AI',
      },
    ]);
  };

  // Suggestion chips tailored by role
  const quickChips = isLecturer
    ? [
        'Quy định và thời hạn nhập điểm học phần của Giảng viên?',
        'Quy định coi thi và xử lý vi phạm quy chế thi đối với Cán bộ coi thi?',
        'Quy trình xin điều chỉnh điểm học phần sau khi đã khóa sổ điểm?',
        'Khung chương trình đào tạo ngành ĐTVT 150 tín chỉ?',
      ]
    : [
        'Lịch thi và phòng thi xem ở đâu?',
        'Quy chế tính điểm môn học và GPA thế nào?',
        'Tiêu chuẩn xét học bổng khuyến khích học tập PTIT?',
        'Quy trình đăng ký học phần tín chỉ như thế nào?',
      ];

  return (
    <div data-chatbot-widget className="fixed z-50 bottom-6 right-6 flex flex-col items-end transition-all">
      {/* Expanded Chatbot Modal Window */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[430px] max-w-[calc(100vw-2.5rem)] h-[580px] max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary/20 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-ptit-red-dark text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-lg shadow-inner">
                🎓
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5 font-hanken">
                  PTITHAH AI
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-white/85 mt-1 flex items-center gap-1.5">
                  <span>Trợ lý học tập</span>
                  <span className="bg-emerald-500/25 border border-emerald-400/30 px-1.5 py-0.2 rounded text-[8px] font-medium tracking-wide">
                    Hỗ trợ tra cứu
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {user?.role === 'admin' && (
                <a
                  href="/admin?tab=ai"
                  title="Cấu hình PTITHAH AI (Chỉ Quản trị viên)"
                  className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white/90"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                </a>
              )}
              <button
                onClick={clearChat}
                title="Xóa lịch sử chat"
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white/90"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ trợ lý"
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors text-white/90"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-red-950/60 border border-primary/20 flex items-center justify-center text-xs shrink-0 mb-1">
                    🎓
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-800 text-on-surface dark:text-gray-200 rounded-bl-xs border border-surface-gray dark:border-slate-700/60'
                  }`}
                >
                  {msg.sender === 'bot' ? cleanFormattedText(msg.text) : msg.text}

                  {/* Elegant Brand Tag */}
                  {msg.sender === 'bot' && (
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-red-50 dark:bg-red-950/40 text-primary dark:text-red-300 border border-primary/15">
                        <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                        PTITHAH AI
                      </span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-500">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <span className="block text-[9px] mt-1 text-right text-white/70">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-gray-400 dark:text-gray-500 text-[11px] italic pl-8">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>PTITHAH AI đang suy nghĩ và phản hồi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          <div className="p-2 border-t border-surface-gray dark:border-slate-800 bg-white/90 dark:bg-slate-900/90">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase px-1 mb-1.5 flex items-center justify-between">
              <span>{isLecturer ? 'Gợi ý nghiệp vụ Giảng viên:' : 'Gợi ý câu hỏi nhanh:'}</span>
              <span className="text-[9px] text-primary dark:text-red-400 font-normal">Chạm để hỏi</span>
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-slate-800 hover:bg-primary/10 dark:hover:bg-red-950/40 text-on-surface dark:text-gray-300 hover:text-primary dark:hover:text-red-400 border border-surface-gray dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap text-[10.5px]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-2.5 border-t border-surface-gray dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isLecturer
                  ? 'Hỏi về quy chế nhập điểm, coi thi, chuẩn đầu ra...'
                  : 'Hỏi về lịch thi, GPA, ngành ĐTVT, quy chế...'
              }
              className="flex-1 bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary border border-surface-gray dark:border-slate-700"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-ptit-red-dark disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 shrink-0 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Circular Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isLecturer ? 'Hỏi đáp PTITHAH AI (Dành cho Giảng viên)' : 'Trợ lý học tập PTITHAH AI'}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-ptit-red-dark text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all relative border-2 border-white/20 group"
      >
        <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-12">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-white text-[8px] font-bold text-white items-center justify-center">
              AI
            </span>
          </span>
        )}
      </button>
    </div>
  );
};
