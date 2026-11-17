/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AiChatMessage, Lesson } from '../../types/index.ts';
import { EduBotMascot } from '../EduBotMascot.tsx';
import { Send, Bot, Sparkles, BookOpen, ShieldCheck, RefreshCw } from 'lucide-react';

interface EduBotTutorChatProps {
  grade: number;
  lessons: Lesson[];
  initialLessonTitle?: string;
  initialLessonId?: string;
}

export const EduBotTutorChat: React.FC<EduBotTutorChatProps> = ({
  grade,
  lessons,
  initialLessonTitle,
  initialLessonId,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-1',
      sender: 'edubot',
      text: `Xin chào bạn nhỏ! 🤖 Tớ là EduBot - người bạn Robot gia sư của bạn. Tớ có thể giúp bạn giải thích các bài học Lớp ${grade}, gợi ý cách giải bài tập hoặc cùng bạn giải các câu đố vui toán học và khoa học. Hôm nay bạn muốn tìm hiểu điều gì nào?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      robotExpression: 'happy',
      suggestedPrompts: [
        'EduBot ơi, tại sao phân số cần có mẫu số khác 0?',
        'Cho tớ một ví dụ vui về phân số bằng nhau!',
        'Đố tớ một câu đố vui Lớp 4 đi EduBot!',
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpression, setCurrentExpression] = useState<'happy' | 'thinking' | 'explaining' | 'celebrating'>('happy');
  const [selectedSubject, setSelectedSubject] = useState('toan');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setCurrentExpression('thinking');

    try {
      const response = await fetch('/api/ai/student-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          grade,
          subject: selectedSubject,
          currentLessonId: initialLessonId,
        }),
      });

      const data = await response.json();

      const botReply: AiChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'edubot',
        text: data.text || 'EduBot đã nhận được câu hỏi!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedLessons: data.referencedLessons,
        suggestedPrompts: data.suggestedPrompts,
        robotExpression: data.robotExpression || 'explaining',
      };

      setMessages((prev) => [...prev, botReply]);
      setCurrentExpression(data.robotExpression || 'happy');
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'edubot',
          text: '🤖 EduBot đang tối ưu lại đường truyền dữ liệu không gian. Bạn nhỏ thử hỏi lại một lần nữa nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          robotExpression: 'thinking',
        },
      ]);
      setCurrentExpression('happy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Banner with Mascot Avatar & Safety Notice */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <EduBotMascot size="sm" expression={currentExpression} interactive={false} />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>Gia sư AI Thông minh</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Không gian an toàn cho trẻ em</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-white">
              Phòng trò chuyện cùng EduBot
            </h1>
            <p className="text-xs text-slate-300">
              Bám sát Chương trình GDPT 2018 & Thông tư 17/2025/TT-BGDĐT
            </p>
          </div>
        </div>

        {/* Subject filter for RAG retrieval */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
          <span className="text-slate-400 px-2 font-medium">Môn:</span>
          {['toan', 'tieng-viet', 'khoa-hoc'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedSubject === sub
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {sub === 'toan' ? 'Toán' : sub === 'tieng-viet' ? 'Tiếng Việt' : 'Khoa học'}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isBot = m.sender === 'edubot';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-400 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-lg rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* RAG Reference badge if available */}
                  {m.referencedLessons && m.referencedLessons.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Căn cứ bài học: {m.referencedLessons.join(', ')}</span>
                    </div>
                  )}

                  {/* Suggested Prompts buttons */}
                  {m.suggestedPrompts && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                      {m.suggestedPrompts.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(p)}
                          className="text-[11px] bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-slate-600 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-slate-600 transition-colors text-left"
                        >
                          ⚡ {p}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right font-mono ${
                      isBot ? 'text-slate-400' : 'text-cyan-200'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-400 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                <span>EduBot đang suy nghĩ và tra cứu kiến thức chuẩn...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
          <input
            type="text"
            placeholder="Hỏi EduBot bất kỳ câu hỏi nào về bài học..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <span>Gửi</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
