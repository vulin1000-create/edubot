/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import { Bot, Moon, Sun, Shield, GraduationCap, School, Check, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onRoleSwitch: (role: UserRole, grade?: number) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedGrade: number;
  onGradeChange: (grade: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleSwitch,
  activeTab,
  onTabChange,
  selectedGrade,
  onGradeChange,
  darkMode,
  onToggleDarkMode,
  onOpenAuth,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Nav links based on current role
  const getNavLinks = () => {
    if (currentUser.role === 'student') {
      return [
        { id: 'dashboard', label: 'Trang chủ' },
        { id: 'lessons', label: 'Kho bài giảng' },
        { id: 'exercises', label: 'Luyện tập' },
        { id: 'knowledge-map', label: 'Bản đồ tri thức' },
        { id: 'tutor', label: 'Gia sư EduBot' },
        { id: 'journey', label: 'Hành trình' },
        { id: 'landing', label: 'Giới thiệu' },
      ];
    } else if (currentUser.role === 'teacher') {
      return [
        { id: 'teacher-overview', label: 'Tổng quan' },
        { id: 'ai-planner', label: 'Soạn bài AI' },
        { id: 'ai-standardize', label: 'Chuẩn hóa' },
        { id: 'ai-quiz', label: 'Tạo đề thi' },
        { id: 'assignment-manager', label: 'Quản lý bài' },
        { id: 'review-drafts', label: 'Duyệt học liệu' },
        { id: 'landing', label: 'Giới thiệu' },
      ];
    } else {
      return [
        { id: 'admin-overview', label: 'Bảng điều khiển' },
        { id: 'curriculum-manager', label: 'Khung GDPT 2026' },
        { id: 'learning-resources', label: 'Kho thẩm định' },
        { id: 'audit-logs', label: 'Nhật ký bảo mật' },
        { id: 'landing', label: 'Giới thiệu' },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        
        {/* Zone 1: Single text element brand wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onTabChange(currentUser.role === 'student' ? 'dashboard' : currentUser.role === 'teacher' ? 'teacher-overview' : 'admin-overview');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/30 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
            EduBot <span className="text-cyan-500">AI</span>
          </span>
        </a>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-500'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + role & theme triggers */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Grade Selector for Student */}
          {currentUser.role === 'student' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => onGradeChange(g)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    selectedGrade === g
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Chuyển chế độ sáng/tối"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              {currentUser.role === 'student' && <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />}
              {currentUser.role === 'teacher' && <School className="w-3.5 h-3.5 text-emerald-500" />}
              {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-500" />}
              
              <span className="hidden sm:inline">
                {currentUser.role === 'student' ? `Học sinh (Lớp ${selectedGrade})` : currentUser.role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Chuyển vai trò thử nghiệm
                </div>

                {/* Option 1: Student */}
                <button
                  onClick={() => {
                    onRoleSwitch('student', 4);
                    setShowRoleMenu(false);
                    onTabChange('dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    currentUser.role === 'student' ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-cyan-500" />
                    <div>
                      <div>Học sinh (Em Hoàng Tuấn - Lớp 4)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Học bài, làm bài, chat AI EduBot</div>
                    </div>
                  </div>
                  {currentUser.role === 'student' && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                </button>

                {/* Option 2: Teacher */}
                <button
                  onClick={() => {
                    onRoleSwitch('teacher');
                    setShowRoleMenu(false);
                    onTabChange('teacher-overview');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    currentUser.role === 'teacher' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div>Giáo viên (Cô Nguyễn Mai)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Soạn giáo án AI, tạo đề, giao bài</div>
                    </div>
                  </div>
                  {currentUser.role === 'teacher' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                {/* Option 3: Admin */}
                <button
                  onClick={() => {
                    onRoleSwitch('admin');
                    setShowRoleMenu(false);
                    onTabChange('admin-overview');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    currentUser.role === 'admin' ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <div>
                      <div>Quản trị viên (Admin GDPT 2026)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Cấu trúc CTGDPT, thẩm định học liệu</div>
                    </div>
                  </div>
                  {currentUser.role === 'admin' && <Check className="w-3.5 h-3.5 text-purple-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Auth Modal Trigger Button */}
          {onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="hidden lg:inline-flex px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              Đăng nhập / Đổi nick
            </button>
          )}

          {/* Primary Action Button */}
          {currentUser.role === 'student' ? (
            <button
              onClick={() => onTabChange('tutor')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Hỏi EduBot</span>
            </button>
          ) : currentUser.role === 'teacher' ? (
            <button
              onClick={() => onTabChange('ai-planner')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Soạn bài mới
            </button>
          ) : (
            <button
              onClick={() => onTabChange('learning-resources')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap shrink-0"
            >
              Thẩm định học liệu
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 no-scrollbar">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onTabChange(link.id)}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === link.id
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold border-b-2 border-cyan-500'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
