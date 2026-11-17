/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../../types/index.ts';
import { EduBotMascot } from '../EduBotMascot.tsx';
import {
  Sparkles,
  Award,
  Flame,
  Zap,
  Star,
  CheckCircle2,
  Lock,
  Compass,
  Layers,
  ChevronRight
} from 'lucide-react';

interface GamificationJourneyProps {
  user: User;
  onStartQuest: (questId: string) => void;
}

export const GamificationJourney: React.FC<GamificationJourneyProps> = ({
  user,
  onStartQuest,
}) => {
  const currentLevel = Math.floor((user.xp || 850) / 200) + 1;
  const currentLevelXp = (user.xp || 850) % 200;

  const milestones = [
    { id: 'm1', title: 'Hành tinh Số tự nhiên', grade: 'Lớp 4', status: 'completed', stars: 3 },
    { id: 'm2', title: 'Trạm vũ trụ Phân số', grade: 'Lớp 4', status: 'active', stars: 2 },
    { id: 'm3', title: 'Chòm sao Hình học & Đo lường', grade: 'Lớp 4', status: 'locked', stars: 0 },
    { id: 'm4', title: 'Dải ngân hà Thống kê & Dữ liệu', grade: 'Lớp 4', status: 'locked', stars: 0 },
  ];

  const badgesList = [
    {
      id: 'b1',
      title: 'Toán học thần tốc',
      description: 'Hoàn thành 5 bài toán đúng 100% trong thời gian dưới 5 phút.',
      unlocked: true,
      color: 'from-amber-400 to-orange-500',
    },
    {
      id: 'b2',
      title: 'Nhà thám hiểm sao',
      description: 'Duy trì chuỗi học tập 7 ngày liên tục không nghỉ.',
      unlocked: true,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      id: 'b3',
      title: 'Trợ thủ EduBot',
      description: 'Hỏi và cùng EduBot giải quyết 10 câu hỏi tư duy sâu.',
      unlocked: true,
      color: 'from-purple-400 to-pink-500',
    },
    {
      id: 'b4',
      title: 'Vua Tiếng Việt',
      description: 'Đạt điểm 10 ở tất cả bài luyện từ và câu về Danh từ, Động từ.',
      unlocked: false,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'b5',
      title: 'Kỹ sư Robot nhí',
      description: 'Lập trình xong kịch bản Scratch đầu tiên trong môn Tin học.',
      unlocked: false,
      color: 'from-indigo-400 to-violet-500',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-cyan-300">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>HÀNH TRÌNH KHÁM PHÁ VŨ TRỤ TRI THỨC</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            Thuyền trưởng <span className="text-cyan-400">{user.name}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Cấp bậc hiện tại: <strong className="text-amber-400">Nhà thám hiểm Cấp {currentLevel}</strong>
          </p>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-2 max-w-md">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300 font-semibold">{user.xp || 850} XP</span>
              <span className="text-slate-400">Mục tiêu cấp tiếp theo: {currentLevel * 200} XP</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentLevelXp / 200) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mascot */}
        <EduBotMascot
          size="md"
          expression="celebrating"
          message="Bạn đã mở khóa 3 huy hiệu danh giá rồi đấy!"
        />
      </div>

      {/* Constellation Milestones Roadmap */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-500" />
            <span>Bản đồ các chòm sao môn Toán Lớp 4</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Bám sát CTGDPT 2026</span>
        </div>

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8">
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'completed';
            const isActive = m.status === 'active';
            return (
              <div key={m.id} className="relative group">
                {/* Node icon on line */}
                <div
                  className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : isActive
                      ? 'bg-cyan-500 border-cyan-300 text-white ring-4 ring-cyan-500/20 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isActive ? idx + 1 : <Lock className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-800 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">
                        {m.grade} · {isCompleted ? 'Đã chinh phục' : isActive ? 'Đang thực hiện' : 'Chưa mở'}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {m.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx <= m.stars ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Huy hiệu chiến công đã đạt</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {badgesList.filter((b) => b.unlocked).length}/{badgesList.length} Huy hiệu
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badgesList.map((badge) => (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center shadow-md ${
                    badge.unlocked ? '' : 'grayscale'
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-semibold">
                {badge.unlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã sở hữu</span>
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cần hoàn thành nhiệm vụ</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
