/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lesson, AuditLog, ResourceStatus, CurriculumSubject } from '../../types/index.ts';
import {
  Shield,
  FileCheck2,
  AlertTriangle,
  History,
  CheckCircle,
  Database,
  Lock,
  Cpu,
  Layers
} from 'lucide-react';

interface AdminDashboardProps {
  lessons: Lesson[];
  subjects: CurriculumSubject[];
  auditLogs: AuditLog[];
  onUpdateLessonStatus: (lessonId: string, status: ResourceStatus) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lessons,
  subjects,
  auditLogs,
  onUpdateLessonStatus,
}) => {
  const [selectedTab, setSelectedTab] = useState<'curriculum' | 'audit' | 'security'>('curriculum');

  const verifiedCount = lessons.filter((l) => l.status === 'verified').length;
  const pendingCount = lessons.filter((l) => l.status === 'pending').length;
  const unverifiedCount = lessons.filter((l) => l.status === 'unverified').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Admin Cockpit Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
            <Shield className="w-4 h-4" />
            <span>HỆ THỐNG QUẢN TRỊ TRUNG ƯƠNG EDUBOT AI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Quản Trị Chương Trình GDPT & An Toàn Dữ Liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Căn cứ pháp lý: Thông tư 32/2018/TT-BGDĐT, Thông tư 17/2025/TT-BGDĐT và chuẩn thẩm định học liệu số Lớp 1-5 năm 2026.
          </p>
        </div>

        {/* AI & System Status */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Trạng thái AI Gateway:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sẵn sàng (Gemini 3.8)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Khung CTGDPT:</span>
            <span className="text-cyan-300 font-bold">2018/2026-v2</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Bảo vệ dữ liệu trẻ em:</span>
            <span className="text-purple-300 font-bold">Tuân thủ triệt để</span>
          </div>
        </div>
      </div>

      {/* Navigation segmented buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedTab('curriculum')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            selectedTab === 'curriculum'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Thẩm định Khung bài học ({lessons.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            selectedTab === 'audit'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký kiểm toán hệ thống ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            selectedTab === 'security'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Chính sách An toàn Trẻ em & RAG</span>
        </button>
      </div>

      {/* Tab 1: Curriculum & Resource Verification */}
      {selectedTab === 'curriculum' && (
        <div className="space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {verifiedCount} Bài
                </div>
                <div className="text-xs text-slate-500">Đã thẩm định chính thức</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  {pendingCount} Bài
                </div>
                <div className="text-xs text-slate-500">Đang chờ rà soát nguồn</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                  8 Môn học
                </div>
                <div className="text-xs text-slate-500">Đồng bộ chuẩn 2026</div>
              </div>
            </div>
          </div>

          {/* Lessons Table with Status Modification */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Danh sách bài học trong Kho dữ liệu chuẩn GDPT
              </h2>
              <span className="text-xs text-slate-400">Quyền Admin: Cập nhật tình trạng pháp lý</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Mã & Tên bài</th>
                    <th className="px-5 py-3.5">Khối & Môn</th>
                    <th className="px-5 py-3.5">Văn bản căn cứ</th>
                    <th className="px-5 py-3.5">Trạng thái thẩm định</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lessons.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{l.title}</div>
                        <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{l.lessonCode}</div>
                      </td>
                      <td className="px-5 py-4">
                        Lớp {l.grade} · {l.subjectId.toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <div>{l.officialReference.docNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{l.officialReference.curriculumVersion}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold inline-block ${
                            l.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                              : l.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {l.status === 'verified'
                            ? 'Đã thẩm định'
                            : l.status === 'pending'
                            ? 'Chờ duyệt'
                            : 'Chưa xác minh – cần bổ sung nguồn'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-1.5">
                          {l.status !== 'verified' && (
                            <button
                              onClick={() => onUpdateLessonStatus(l.id, 'verified')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                            >
                              Thẩm định
                            </button>
                          )}
                          {l.status !== 'unverified' && (
                            <button
                              onClick={() => onUpdateLessonStatus(l.id, 'unverified')}
                              className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
                            >
                              Gắn nhãn chưa xác minh
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {selectedTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Nhật ký kiểm toán hoạt động hệ thống (Audit Trail)
            </h2>
            <span className="text-xs font-mono text-slate-400">Lưu vết an toàn 24/7</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5">Người thực hiện</th>
                  <th className="px-5 py-3.5">Vai trò</th>
                  <th className="px-5 py-3.5">Chi tiết</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-5 py-4">{log.user}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-sm text-slate-700 dark:text-slate-300">
                      {log.details}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Child Safety Policy */}
      {selectedTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-display">
              <Lock className="w-4 h-4 text-purple-500" />
              <span>Chính sách Bảo vệ Dữ liệu Cá nhân Trẻ em</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed list-disc list-inside">
              <li>Tuân thủ Luật Trẻ em Việt Nam và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</li>
              <li>Không thu thập và lưu trữ thông tin nhạy cảm của học sinh (địa chỉ nhà riêng, thông tin tài chính phụ huynh, mật khẩu dạng thô).</li>
              <li>Bộ lọc AI tự động phát hiện và chặn các nội dung bạo lực, nguy hại hoặc không phù hợp lứa tuổi.</li>
              <li>Dữ liệu học tập của học sinh tuyệt đối không được dùng để huấn luyện mô hình bên ngoài trái phép.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-display">
              <Cpu className="w-4 h-4 text-cyan-500" />
              <span>Kiến trúc RAG & Giới hạn Thẩm định</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed list-disc list-inside">
              <li>Gia sư AI EduBot chỉ truy xuất từ kho tài liệu đã được thẩm định (verified).</li>
              <li>Nếu không tìm thấy tài liệu phù hợp trong kho kiến thức chuẩn, AI sẽ thông báo giới hạn và hướng dẫn hỏi thầy cô.</li>
              <li>Ghi nhật ký kiểm toán cho mọi thao tác cập nhật cấu trúc CTGDPT và phân quyền người dùng.</li>
              <li>Hỗ trợ chuyển đổi phiên bản chương trình khi Bộ GD&ĐT ban hành văn bản mới mà không làm gián đoạn hệ thống.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
