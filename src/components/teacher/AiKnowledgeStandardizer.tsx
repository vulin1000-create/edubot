/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, FileCheck, CheckCircle2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { AiDraftItem } from '../../types/index.ts';

interface AiKnowledgeStandardizerProps {
  onDraftCreated: (draft: AiDraftItem) => void;
}

export const AiKnowledgeStandardizer: React.FC<AiKnowledgeStandardizerProps> = ({ onDraftCreated }) => {
  const [grade, setGrade] = useState(4);
  const [subject, setSubject] = useState('toan');
  const [lessonTitle, setLessonTitle] = useState('Rút gọn phân số và phân số tối giản');
  const [rawContent, setRawContent] = useState(
    'Rút gọn phân số là chia tử và mẫu cho một ước chung để phân số nhỏ đi. Phân số tối giản là phân số không chia được nữa.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleStandardize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/teacher/standardize-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent,
          grade,
          subject,
          lessonTitle,
        }),
      });

      const data = await res.json();
      if (data.success && data.draft) {
        setAnalysisResult(data.draft.content.analysis);
        onDraftCreated(data.draft);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-blue-800/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <FileCheck className="w-4 h-4" />
          <span>EDUBOT KNOWLEDGE AUDIT & STANDARDIZATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
          AI Chuẩn Hóa Tri Thức & Thẩm Định Kiến Thức
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Đối chiếu học liệu tự biên soạn với chuẩn CTGDPT 2018 (TT 32/2018 & TT 17/2025/TT-BGDĐT), phát hiện lỗi diễn đạt hàn lâm, mâu thuẫn khái niệm và gợi ý bảng đối chiếu sư phạm.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Nội dung cần thẩm định
          </h2>

          <form onSubmit={handleStandardize} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Khối lớp:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Môn học:
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="toan">Toán</option>
                  <option value="tieng-viet">Tiếng Việt</option>
                  <option value="khoa-hoc">Khoa học</option>
                  <option value="tin-hoc">Tin học</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tên bài học / Chủ đề:
              </label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Văn bản gốc cần kiểm tra & chuẩn hóa:
              </label>
              <textarea
                rows={6}
                required
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Dán nội dung giáo viên tự soạn hoặc trích dẫn vào đây..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang thẩm định văn bản...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Chuẩn hóa & Báo cáo đối chiếu</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Display (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Báo cáo đối chiếu chuẩn hóa EduBot AI</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              CTGDPT 2018 - 2026
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto">
            {analysisResult ? (
              analysisResult
            ) : (
              <div className="text-slate-400 py-12 text-center font-sans space-y-2">
                <FileCheck className="w-8 h-8 mx-auto text-slate-300" />
                <div>Nhập nội dung vào form bên trái để AI tiến hành đối chiếu và xuất báo cáo.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
