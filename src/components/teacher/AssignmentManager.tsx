/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Assignment, ClassRoom, ExerciseSet, StudentSubmission } from '../../types/index.ts';
import { Plus, CheckCircle, Clock, Calendar, AlertCircle, ArrowRight } from 'lucide-react';

interface AssignmentManagerProps {
  classes: ClassRoom[];
  assignments: Assignment[];
  exercises: ExerciseSet[];
  submissions: StudentSubmission[];
  onAssignCreated: (assignment: Assignment) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  classes,
  assignments,
  exercises,
  submissions,
  onAssignCreated,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedExId, setSelectedExId] = useState(exercises[0]?.id || '');
  const [deadline, setDeadline] = useState('2026-11-20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          exerciseSetId: selectedExId,
          deadline: new Date(deadline).toISOString(),
          assignedBy: 'Cô Nguyễn Mai',
        }),
      });
      const data = await res.json();
      if (data.success && data.assignment) {
        onAssignCreated(data.assignment);
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
            Quản lý Bài tập & Chấm điểm
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Giao bài theo lớp, theo dõi tiến độ nộp và phân loại lỗi sai tự động của học sinh.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Giao bài tập mới</span>
        </button>
      </div>

      {/* Active Assignments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Các bài tập đang giao
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {assignments.length} Nhiệm vụ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tiêu đề bài tập</th>
                <th className="px-5 py-3.5">Lớp áp dụng</th>
                <th className="px-5 py-3.5">Hạn nộp</th>
                <th className="px-5 py-3.5">Tiến độ nộp</th>
                <th className="px-5 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    {a.title}
                  </td>
                  <td className="px-5 py-4">{a.className}</td>
                  <td className="px-5 py-4 font-mono">
                    {new Date(a.deadline).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full"
                          style={{ width: `${(a.completedCount / a.totalStudents) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px]">
                        {a.completedCount}/{a.totalStudents}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      Đang mở
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submissions & Error Diagnosis Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Kết quả làm bài học sinh & Chẩn đoán EduBot
            </h2>
            <p className="text-xs text-slate-400">
              Chấm tự động theo thời gian thực kết hợp phân tích nguyên nhân lỗi sai.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {submissions.length} Bài nộp
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Học sinh</th>
                <th className="px-5 py-3.5">Điểm số</th>
                <th className="px-5 py-3.5">Thời gian làm</th>
                <th className="px-5 py-3.5">Nhận xét của EduBot</th>
                <th className="px-5 py-3.5">Thời điểm nộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                    {s.studentName}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`font-mono font-bold text-sm ${
                        s.score >= 8 ? 'text-emerald-500' : s.score >= 5 ? 'text-amber-500' : 'text-rose-500'
                      }`}
                    >
                      {s.score}/10
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono">
                    {Math.round(s.timeSpentSeconds / 60)} phút
                  </td>
                  <td className="px-5 py-4 max-w-xs text-slate-700 dark:text-slate-300">
                    {s.feedback}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-400">
                    {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(s.completedAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Giao bài tập */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Giao bài tập cho Lớp
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn Lớp học:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chọn Bộ bài tập:
                </label>
                <select
                  value={selectedExId}
                  onChange={(e) => setSelectedExId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} (Khối {ex.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hạn hoàn thành:
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang giao...' : 'Xác nhận giao bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
