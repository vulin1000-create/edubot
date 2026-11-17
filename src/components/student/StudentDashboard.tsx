/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, CurriculumSubject, Assignment, Lesson } from '../../types/index.ts';
import { EduBotMascot } from '../EduBotMascot.tsx';
import {
  Flame,
  Zap,
  Award,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  Play,
  Sparkles,
  Calculator,
  Compass,
  Cpu
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  subjects: CurriculumSubject[];
  assignments: Assignment[];
  lessons: Lesson[];
  onSelectSubject: (subjectId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenExercise: (exerciseSetId: string, assignmentId?: string) => void;
  onOpenTutor: () => void;
  onOpenJourney: () => void;
  onOpenKnowledgeMap?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  subjects,
  assignments,
  lessons,
  onSelectSubject,
  onOpenLesson,
  onOpenExercise,
  onOpenTutor,
  onOpenJourney,
  onOpenKnowledgeMap,
}) => {
  const heroImage = '/src/assets/images/future_learning_space_1793780439282.jpg';

  const activeAssignments = assignments.filter((a) => a.status === 'active');
  const recentLesson = lessons[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 text-white min-h-[320px] flex flex-col justify-end">
        {/* Background visual asset */}
        <img
          src={heroImage}
          alt="Future Learning Space"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        {/* High-contrast gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        {/* Content Area */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            {/* Clean unboxed metadata separator */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-cyan-300">
              <span>Học kỳ II</span>
              <span aria-hidden="true">·</span>
              <span>Lớp {user.grade || 4}</span>
              <span aria-hidden="true">·</span>
              <span>Trường TH Thăng Long</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white">
              Chào mừng <span className="text-cyan-400">{user.name}</span> trở lại vũ trụ tri thức!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Hôm nay EduBot đã chuẩn bị bài học mới về <strong>Phân số bằng nhau</strong> và 2 thử thách tính nhanh.
              Bạn đã sẵn sàng tích lũy thêm điểm kinh nghiệm chưa?
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {recentLesson && (
                <button
                  onClick={() => onOpenLesson(recentLesson.id)}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md shadow-cyan-500/25 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Tiếp tục học bài gần nhất</span>
                </button>
              )}

              <button
                onClick={onOpenTutor}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors border border-white/10 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Trò chuyện cùng EduBot</span>
              </button>

              {onOpenKnowledgeMap && (
                <button
                  onClick={onOpenKnowledgeMap}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors border border-white/10 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>Bản đồ tri thức</span>
                </button>
              )}
            </div>
          </div>

          {/* EduBot 3D Robot Interactive Mascot */}
          <div className="shrink-0">
            <EduBotMascot
              expression="celebrating"
              size="lg"
              message={`Chào bạn Tuấn! Chuỗi học ${user.streakDays || 7} ngày liên tục thật cừ khôi! 🚀`}
              onTalkClick={onOpenTutor}
            />
          </div>
        </div>
      </div>

      {/* Gamification Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {user.streakDays || 7} Ngày
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chuỗi học kiên trì</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {user.xp || 850} XP
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Năng lượng khám phá</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {user.badges?.length || 3} Huy hiệu
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chiến công đạt được</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              14 Bài học
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đã hoàn thành xuất sắc</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Assignments & Subject Universe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Active Assignments & Recommended Quests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              <span>Nhiệm vụ cô giáo giao cần nộp</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {activeAssignments.length} nhiệm vụ đang mở
            </span>
          </div>

          <div className="space-y-3">
            {activeAssignments.map((assign) => (
              <div
                key={assign.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                      {assign.subjectId === 'toan' ? 'Toán học' : 'Tiếng Việt'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{assign.assignedBy}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Hạn: 15/11/2026
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {assign.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Đã có {assign.completedCount}/{assign.totalStudents} bạn trong lớp hoàn thành.
                  </p>
                </div>

                <button
                  onClick={() => onOpenExercise(assign.exerciseSetId, assign.id)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                >
                  <span>Làm bài ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Subjects Grid */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Các môn học Lớp {user.grade || 4} theo chuẩn GDPT 2026
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onSelectSubject(sub.id)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: sub.color }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {sub.category === 'compulsory' ? 'Bắt buộc' : 'Tự chọn'}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {sub.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    <span>Vào kho bài giảng</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Knowledge Constellation Map & Companion Hub */}
        <div className="space-y-6">
          {/* Roadmap Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Bản đồ sao tri thức
              </span>
              <span className="text-xs font-mono text-indigo-300">Cấp độ 4</span>
            </div>

            <h3 className="text-lg font-bold font-display text-white">
              Hành trình Thám hiểm Vũ trụ EduBot
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn đang ở chòm sao <strong>Phân số huyền bí</strong>. Hoàn thành thêm 2 bài tập để mở khóa trạm không gian tiếp theo!
            </p>

            {/* Constellation visual mini-diagram */}
            <div className="relative h-28 bg-black/40 rounded-xl border border-white/10 flex items-center justify-around px-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950 font-bold text-[10px] ring-4 ring-cyan-400/30">
                  ✓
                </div>
                <span className="text-[10px] text-slate-300">Khái niệm</span>
              </div>
              <div className="w-12 h-0.5 bg-cyan-400" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs ring-4 ring-amber-400/30 animate-pulse">
                  4
                </div>
                <span className="text-[10px] text-amber-300 font-semibold">Hiện tại</span>
              </div>
              <div className="w-12 h-0.5 bg-slate-700" />
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">
                  5
                </div>
                <span className="text-[10px] text-slate-500">Quy đồng</span>
              </div>
            </div>

            <button
              onClick={onOpenJourney}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Xem toàn bộ bản đồ sao</span>
            </button>
          </div>

          {/* EduBot AI Quick Help Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Gia sư AI 24/7 của bạn
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hỏi bất kỳ bài học nào bạn chưa hiểu
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              "EduBot ơi, tại sao khi nhân cả tử và mẫu với 2 thì phân số lại bằng nhau?"
            </p>

            <button
              onClick={onOpenTutor}
              className="w-full py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Mở phòng hỏi đáp với EduBot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
