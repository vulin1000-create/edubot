/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ClassRoom, Assignment, AiDraftItem } from '../../types/index.ts';
import { StudentDetailModal } from './StudentDetailModal.tsx';
import {
  Users,
  BookOpen,
  FileText,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Share2,
  GraduationCap,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface TeacherDashboardProps {
  user: User;
  classes: ClassRoom[];
  assignments: Assignment[];
  drafts: AiDraftItem[];
  onNavigate: (tab: string) => void;
  onCreateClass: (name: string, grade: number) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  classes,
  assignments,
  drafts,
  onNavigate,
  onCreateClass,
}) => {
  const teacherImage = '/src/assets/images/edubot_teacher_studio_1793780438619.jpg';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(4);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<{ id: string; name: string; email: string; xp: number; progress: number } | null>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data: User[]) => {
        setStudents(data.filter((u) => u.role === 'student'));
      })
      .catch((err) => console.error(err));
  }, []);

  const pendingDrafts = drafts.filter((d) => d.status === 'draft');
  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onCreateClass(newClassName.trim(), newClassGrade);
    setNewClassName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Teacher Cockpit Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900 text-white min-h-[300px] flex flex-col justify-end">
        <img
          src={teacherImage}
          alt="Teacher Studio"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span>Không gian Giáo viên EduBot Teacher AI</span>
              <span aria-hidden="true">·</span>
              <span>Chuẩn CTGDPT 2018 & TT 17/2025</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Chào mừng {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Trường Tiểu học Thăng Long · Phụ trách Lớp 4A1 & Lớp 3B. Hãy cùng trợ lý AI tiết kiệm 70% thời gian soạn giáo án và tạo đề kiểm tra chuẩn hóa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('ai-planner')}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Soạn KHBD bằng AI</span>
            </button>

            <button
              onClick={() => onNavigate('ai-quiz')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-colors border border-white/10"
            >
              Tạo đề kiểm tra ma trận
            </button>
          </div>
        </div>
      </div>

      {/* Metric KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Học sinh quản lý</span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {totalStudents} Em
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Trong {classes.length} lớp học</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ lệ nộp bài tập</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            87.4%
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Tăng 5.2% tuần này</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Điểm trung bình lớp</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            8.6/10
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Toán & Tiếng Việt</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bản nháp AI chờ duyệt</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {pendingDrafts.length}
          </div>
          <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">Cần thẩm định trước khi dùng</div>
        </div>
      </div>

      {/* Main Grid: Classrooms & AI Quick Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Classrooms list & Active Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Danh sách Lớp học phụ trách</span>
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo lớp mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map((c) => {
              const isSelected = selectedClassId === c.id;
              return (
                <div
                  key={c.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all shadow-sm space-y-3 ${
                    isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400">Khối {c.grade} · Năm {c.academicYear}</span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.name}</h3>
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                      {c.code}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedClassId(isSelected ? null : c.id)}
                      className="text-slate-700 dark:text-slate-300 hover:text-cyan-600 font-semibold flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{c.studentCount} Học sinh ({isSelected ? 'Thu gọn' : 'Xem danh sách'})</span>
                    </button>
                    <button
                      onClick={() => onNavigate('assignment-manager')}
                      className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Giao bài</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Class Roster */}
          {selectedClassId && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-cyan-400/40 dark:border-cyan-800/60 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-500" />
                    <span>Danh sách học sinh lớp {classes.find(c => c.id === selectedClassId)?.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bấm vào từng học sinh để xem hồ sơ năng lực, điểm số chi tiết và gợi ý sư phạm AI.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClassId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Đóng danh sách
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {students.map((st) => (
                  <div
                    key={st.id}
                    onClick={() =>
                      setSelectedStudentForModal({
                        id: st.id,
                        name: st.name,
                        email: st.email,
                        xp: st.xp || 850,
                        progress: 85,
                      })
                    }
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 flex items-center justify-center text-xs font-bold font-mono text-cyan-600">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                          {st.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Khối {st.grade || 4} · {st.xp || 850} XP
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Assignments Progress */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Bài tập đã giao đang mở
              </h2>
              <button
                onClick={() => onNavigate('assignment-manager')}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Xem tất cả ({assignments.length})
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-400">
                      {a.className} · Hạn nộp: {new Date(a.deadline).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {a.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {a.completedCount}/{a.totalStudents} Nộp
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({Math.round((a.completedCount / a.totalStudents) * 100)}%)
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('assignment-manager')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Studio Shortcuts & Misconceptions Radar */}
        <div className="space-y-6">
          {/* AI Module Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-900/60 shadow-xl space-y-4">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              EduBot Teacher AI Toolkit
            </span>
            <h3 className="text-lg font-bold font-display text-white">
              Trợ lý sư phạm đa năng
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tất cả sản phẩm do AI tạo ra đều ở trạng thái bản nháp. Thầy cô toàn quyền kiểm duyệt và tinh chỉnh trước khi công bố.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate('ai-planner')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-xs font-semibold flex items-center justify-between"
              >
                <span>1. Soạn Kế hoạch bài dạy (KHBD)</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
              </button>

              <button
                onClick={() => onNavigate('ai-standardize')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-xs font-semibold flex items-center justify-between"
              >
                <span>2. Chuẩn hóa & Thẩm định kiến thức</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
              </button>

              <button
                onClick={() => onNavigate('ai-quiz')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-xs font-semibold flex items-center justify-between"
              >
                <span>3. Tạo câu hỏi & Ma trận đề kiểm tra</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
              </button>

              <button
                onClick={() => onNavigate('review-drafts')}
                className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors text-xs font-semibold flex items-center justify-between text-amber-300"
              >
                <span>4. Hàng đợi duyệt bản nháp ({pendingDrafts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Class Misconception Radar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Phân tích lỗi sai thường gặp của học sinh</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dựa trên kết quả nộp bài tự động được hệ thống thống kê:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200">
                <strong>Nhầm lẫn rút gọn phân số:</strong> 34% học sinh quên chia mẫu số khi chia tử số.
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                <strong>Viết hoa danh từ riêng:</strong> 18% học sinh chưa viết hoa chữ cái đầu của địa danh ghép.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Tạo Lớp học mới
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tên lớp học:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp 4A2 - Sao Băng"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Khối lớp:
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-cyan-500"
                >
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors"
                >
                  Tạo lớp & Cấp mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Performance Profile Modal */}
      {selectedStudentForModal && (
        <StudentDetailModal
          student={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}
    </div>
  );
};
