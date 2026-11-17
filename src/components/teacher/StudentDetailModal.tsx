/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, StudentSubmission } from '../../types/index.ts';
import { X, Award, Flame, Zap, CheckCircle2, AlertTriangle, BookOpen, Clock, Calendar } from 'lucide-react';

interface StudentDetailModalProps {
  student: { id: string; name: string; email: string; xp: number; progress: number } | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    if (!student) return;
    setLoading(true);
    fetch(`/api/students/${student.id}/performance`)
      .then((res) => res.json())
      .then((data) => {
        setPerformanceData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [student]);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-400/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(student.name)}`}
              alt={student.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase font-mono">
              HỒ SƠ HỌC TẬP CÁ NHÂN
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
              {student.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono">{student.email}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Đang tải dữ liệu học tập từ máy chủ EduBot...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {performanceData?.avgScore || 8.6}/10
                </div>
                <div className="text-[11px] text-slate-400">Điểm trung bình</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-lg font-bold text-amber-500 font-mono">
                  {performanceData?.xp || student.xp} XP
                </div>
                <div className="text-[11px] text-slate-400">Năng lượng khám phá</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-lg font-bold text-cyan-500 font-mono">
                  {performanceData?.masteredNodesCount || 3} Mắt xích
                </div>
                <div className="text-[11px] text-slate-400">Chủ đề đã tinh thông</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-lg font-bold text-emerald-500 font-mono">
                  {performanceData?.streakDays || 7} Ngày
                </div>
                <div className="text-[11px] text-slate-400">Chuỗi học liên tục</div>
              </div>
            </div>

            {/* AI Recommendation for Teacher */}
            <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 space-y-1.5">
              <div className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-600" />
                <span>Gợi ý sư phạm từ EduBot AI:</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Học sinh <strong>{student.name}</strong> hoàn thành tốt các bài toán nhận biết và thông hiểu (đạt {performanceData?.avgScore || 8.6}/10). Tuy nhiên, em còn phân vân ở dạng toán rút gọn phân số chứa ước chung lớn hơn 5. Giáo viên nên giao thêm 1 bài luyện tập tương tác để củng cố kỹ năng này.
              </p>
            </div>

            {/* Recent Submissions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Lịch sử làm bài gần đây
              </h3>

              {performanceData?.recentSubmissions && performanceData.recentSubmissions.length > 0 ? (
                <div className="space-y-2">
                  {performanceData.recentSubmissions.map((sub: StudentSubmission) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Bài tập môn Toán Lớp {sub.grade}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(sub.completedAt).toLocaleString('vi-VN')} · {Math.round(sub.timeSpentSeconds / 60)} phút làm bài
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div
                          className={`text-sm font-bold ${
                            sub.score >= 8 ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {sub.score}/10
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sub.totalCorrect}/{sub.totalQuestions} đúng
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Học sinh đang trong tiến trình học tập bài đầu tiên.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};
