/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lesson, ResourceStatus } from '../../types/index.ts';
import { EduBotMascot } from '../EduBotMascot.tsx';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Bot,
  PlayCircle,
  HelpCircle,
  FileCheck2,
  Share2
} from 'lucide-react';

interface LessonViewerProps {
  lesson: Lesson;
  onBack: () => void;
  onOpenExercise: (lessonId: string) => void;
  onAskAi: (lessonTitle: string, lessonId: string) => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  lesson,
  onBack,
  onOpenExercise,
  onAskAi,
}) => {
  const [activeCheckpointAnswer, setActiveCheckpointAnswer] = useState<number | null>(null);
  const [showCheckpointFeedback, setShowCheckpointFeedback] = useState(false);

  const checkpoint = lesson.interactiveContent?.sections[0]?.checkpointQuestion;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài</span>
        </button>

        {/* Verification Status Banner */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Đã thẩm định - {lesson.officialReference.docNumber}</span>
          </span>
        </div>
      </div>

      {/* Lesson Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{lesson.lessonCode}</span>
          <span aria-hidden="true">·</span>
          <span>Khối {lesson.grade}</span>
          <span aria-hidden="true">·</span>
          <span>Học kỳ {lesson.semester}</span>
          <span aria-hidden="true">·</span>
          <span>Phiên bản: {lesson.officialReference.curriculumVersion}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
          {lesson.title}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {lesson.summary}
        </p>

        {/* Quick action buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenExercise(lesson.id)}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Làm bài tập luyện tập</span>
          </button>

          <button
            onClick={() => onAskAi(lesson.title, lesson.id)}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-cyan-500" />
            <span>Hỏi EduBot về bài này</span>
          </button>
        </div>
      </div>

      {/* 1. Yêu cầu cần đạt (Objectives) */}
      <div className="bg-cyan-50/70 dark:bg-cyan-950/20 p-6 rounded-3xl border border-cyan-100 dark:border-cyan-900/40 space-y-3">
        <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-300 font-bold text-sm">
          <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          <span>Yêu cầu cần đạt sau bài học (Theo chuẩn BGD&ĐT)</span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-cyan-950 dark:text-cyan-200 list-disc list-inside leading-relaxed">
          {lesson.objectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </div>

      {/* 2. Interactive Discovery Sections */}
      {lesson.interactiveContent?.sections.map((sec, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            {sec.title}
          </h2>

          <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {sec.content}
          </div>

          {sec.example && (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Ví dụ gần gũi:</strong>
                {sec.example}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 3. Checkpoint Mini Quiz */}
      {checkpoint && (
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-cyan-500/40 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Thử thách nhanh cùng EduBot</span>
          </div>

          <h3 className="text-base font-bold text-white">
            {checkpoint.question}
          </h3>

          <div className="space-y-2 pt-1">
            {checkpoint.options.map((opt, oIdx) => (
              <button
                key={oIdx}
                onClick={() => {
                  setActiveCheckpointAnswer(oIdx);
                  setShowCheckpointFeedback(true);
                }}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all ${
                  activeCheckpointAnswer === oIdx
                    ? oIdx === checkpoint.correctAnswer
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                      : 'bg-red-500/20 border-red-400 text-red-200 font-semibold'
                    : 'bg-slate-800/80 border-slate-700 hover:border-cyan-400 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt}</span>
                </div>
              </button>
            ))}
          </div>

          {showCheckpointFeedback && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm border ${
                activeCheckpointAnswer === checkpoint.correctAnswer
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border-red-800 text-red-300'
              }`}
            >
              <strong>
                {activeCheckpointAnswer === checkpoint.correctAnswer ? '🎉 Chính xác!' : '💡 Gợi ý của EduBot:'}
              </strong>{' '}
              {checkpoint.explanation}
            </div>
          )}
        </div>
      )}

      {/* 4. Common Misconceptions (Lỗi sai thường gặp) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Những lỗi học sinh hay mắc phải khi học bài này</span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
          {lesson.commonMisconceptions.map((mis, i) => (
            <li key={i}>{mis}</li>
          ))}
        </ul>
      </div>

      {/* 5. Terms & Definitions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
          Thuật ngữ & Khái niệm cốt lõi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lesson.termsAndDefinitions.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1"
            >
              <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                {item.term}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {item.definition}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
