/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AiDraftItem } from '../../types/index.ts';
import { CheckCircle2, XCircle, Send, MessageSquare } from 'lucide-react';

interface ContentReviewerProps {
  drafts: AiDraftItem[];
  onDraftStatusChange: (draftId: string, status: 'approved' | 'rejected' | 'published', notes?: string) => void;
}

export const ContentReviewer: React.FC<ContentReviewerProps> = ({ drafts, onDraftStatusChange }) => {
  const [selectedDraftId, setSelectedDraftId] = useState<string>(drafts[0]?.id || '');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'rejected' | 'published'>('all');

  const filteredDrafts = drafts.filter((d) => (statusFilter === 'all' ? true : d.status === statusFilter));
  const activeDraft = filteredDrafts.find((d) => d.id === selectedDraftId) || filteredDrafts[0];

  useEffect(() => {
    setTeacherNotes(activeDraft?.teacherNotes || '');
  }, [activeDraft?.id]);

  const handleReviewAction = (status: 'approved' | 'rejected' | 'published') => {
    if (!activeDraft) return;
    onDraftStatusChange(activeDraft.id, status, teacherNotes);
  };

  const getStatusBadge = (status: AiDraftItem['status']) => {
    switch (status) {
      case 'approved':
        return { cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40', label: 'Đã duyệt' };
      case 'published':
        return { cls: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40', label: 'Đã xuất bản' };
      case 'rejected':
        return { cls: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40', label: 'Bị từ chối' };
      default:
        return { cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40', label: 'Chờ duyệt' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
          Hàng Đợi Kiểm Duyệt Học Liệu AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Quy trình bắt buộc: Mọi sản phẩm do AI tạo ra (Giáo án, Chuẩn hóa kiến thức, Câu hỏi) phải được giáo viên thẩm định trước khi xuất bản.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'Tất cả bản ghi' },
            { id: 'draft', label: 'Chờ duyệt' },
            { id: 'approved', label: 'Đã duyệt' },
            { id: 'published', label: 'Đã xuất bản' },
            { id: 'rejected', label: 'Bị từ chối' },
          ] as const
        ).map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === st.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          {filteredDrafts.length > 0 ? (
            filteredDrafts.map((d) => {
              const isSelected = d.id === activeDraft?.id;
              const badge = getStatusBadge(d.status);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDraftId(d.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Khối {d.grade} · {d.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {d.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                    <span>{d.createdBy}</span>
                    <span className="font-mono">{new Date(d.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Không có bản ghi nào ở trạng thái này.
            </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {activeDraft ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Mã bản thảo: {activeDraft.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tạo bởi: {activeDraft.createdBy}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-display">
                    {activeDraft.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(activeDraft.status === 'draft' || activeDraft.status === 'rejected') && (
                    <>
                      <button
                        onClick={() => handleReviewAction('approved')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Phê duyệt</span>
                      </button>

                      {activeDraft.status !== 'rejected' && (
                        <button
                          onClick={() => handleReviewAction('rejected')}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Yêu cầu sửa lại</span>
                        </button>
                      )}
                    </>
                  )}

                  {activeDraft.status === 'approved' && (
                    <button
                      onClick={() => handleReviewAction('published')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Xuất bản cho học sinh</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[420px] overflow-y-auto">
                {activeDraft.content.text ||
                  activeDraft.content.analysis ||
                  JSON.stringify(activeDraft.content, null, 2)}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Ý kiến chuyên môn & Ghi chú điều chỉnh của giáo viên:</span>
                </label>
                <textarea
                  rows={2}
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder="Nhập nhận xét hoặc phương án điều chỉnh sư phạm trước khi phê duyệt..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Không có bản ghi nào được chọn.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
