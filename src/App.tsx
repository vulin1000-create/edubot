/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  CurriculumSubject,
  Lesson,
  ExerciseSet,
  ClassRoom,
  Assignment,
  StudentSubmission,
  AiDraftItem,
  AuditLog,
  ResourceStatus,
  KnowledgeNode,
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { LessonViewer } from './components/student/LessonViewer.tsx';
import { ExerciseRunner } from './components/student/ExerciseRunner.tsx';
import { EduBotTutorChat } from './components/student/EduBotTutorChat.tsx';
import { GamificationJourney } from './components/student/GamificationJourney.tsx';
import { KnowledgeMap } from './components/student/KnowledgeMap.tsx';
import { TeacherDashboard } from './components/teacher/TeacherDashboard.tsx';
import { AiLessonPlanner } from './components/teacher/AiLessonPlanner.tsx';
import { AiKnowledgeStandardizer } from './components/teacher/AiKnowledgeStandardizer.tsx';
import { AiQuizGenerator } from './components/teacher/AiQuizGenerator.tsx';
import { AssignmentManager } from './components/teacher/AssignmentManager.tsx';
import { ContentReviewer } from './components/teacher/ContentReviewer.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import {
  ArrowRight,
  PlayCircle,
  FileCheck2,
  Lock,
  Search,
  LogIn,
  BookOpen,
  AlertCircle
} from 'lucide-react';

const TOKEN_STORAGE_KEY = 'edubot_token';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(Boolean(authToken));

  const [selectedGrade, setSelectedGrade] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [lessonSearch, setLessonSearch] = useState<string>('');

  // Backend state
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [drafts, setDrafts] = useState<AiDraftItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [suggestedRole, setSuggestedRole] = useState<UserRole | undefined>(undefined);
  const [appBannerError, setAppBannerError] = useState<string>('');

  // Navigation targets
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeExerciseSetId, setActiveExerciseSetId] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | undefined>(undefined);
  const [tutorInitialLesson, setTutorInitialLesson] = useState<{ id?: string; title?: string }>({});

  // Sync dark mode class with root html
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Restore session from stored token on mount
  useEffect(() => {
    if (!authToken) {
      setIsRestoringSession(false);
      return;
    }
    let cancelled = false;
    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          throw new Error('Phiên đăng nhập không hợp lệ');
        }
        const data = await res.json();
        if (!cancelled && data.user) {
          setCurrentUser(data.user);
          if (data.user.grade) {
            setSelectedGrade(data.user.grade);
          }
          setActiveTab(
            data.user.role === 'student'
              ? 'dashboard'
              : data.user.role === 'teacher'
              ? 'teacher-overview'
              : 'admin-overview'
          );
        }
      } catch {
        if (!cancelled) {
          try {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          } catch {
            // ignore storage errors
          }
          setAuthToken(null);
          setCurrentUser(null);
          setActiveTab('landing');
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount; login/logout update state explicitly

  // Public curriculum & exercise loading
  useEffect(() => {
    const isStaff = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
    const gradeQuery = isStaff ? '' : `?grade=${selectedGrade}`;

    async function loadPublicData() {
      try {
        const [subRes, lesRes, exRes, knwRes] = await Promise.all([
          fetch(`/api/curriculum/subjects${gradeQuery}`),
          fetch(`/api/curriculum/lessons${gradeQuery}`),
          fetch(`/api/exercises${gradeQuery}`),
          fetch('/api/knowledge-map'),
        ]);

        if (subRes.ok) setSubjects(await subRes.json());
        if (lesRes.ok) setLessons(await lesRes.json());
        if (exRes.ok) setExercises(await exRes.json());
        if (knwRes.ok) setKnowledgeNodes(await knwRes.json());
      } catch (err) {
        console.error('Failed to load public curriculum data:', err);
      }
    }
    loadPublicData();
  }, [selectedGrade, currentUser?.role]);

  // Authenticated role-scoped loading
  const loadAuthenticatedData = useCallback(async () => {
    if (!authToken || !currentUser) {
      setClasses([]);
      setAssignments([]);
      setSubmissions([]);
      setDrafts([]);
      setAuditLogs([]);
      return;
    }

    const headers = { Authorization: `Bearer ${authToken}` };
    const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';
    const assignQuery = isStaff ? '' : `?grade=${selectedGrade}`;

    try {
      const requests: Promise<Response>[] = [
        fetch('/api/classes', { headers }),
        fetch(`/api/assignments${assignQuery}`, { headers }),
        fetch('/api/submissions', { headers }),
      ];

      if (isStaff) {
        requests.push(fetch('/api/ai/drafts', { headers }));
      }
      if (currentUser.role === 'admin') {
        requests.push(fetch('/api/audit-logs', { headers }));
      }

      const responses = await Promise.all(requests);
      if (responses[0].ok) setClasses(await responses[0].json());
      if (responses[1].ok) setAssignments(await responses[1].json());
      if (responses[2].ok) setSubmissions(await responses[2].json());
      if (isStaff && responses[3]?.ok) {
        setDrafts(await responses[3].json());
      } else {
        setDrafts([]);
      }
      if (currentUser.role === 'admin') {
        const auditRes = responses[4];
        if (auditRes?.ok) setAuditLogs(await auditRes.json());
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch authenticated data:', err);
    }
  }, [authToken, currentUser, selectedGrade]);

  useEffect(() => {
    loadAuthenticatedData();
  }, [loadAuthenticatedData]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', roleHint?: UserRole) => {
    setAuthMode(mode);
    setSuggestedRole(roleHint);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: User, token: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // ignore storage failure
    }
    setAuthToken(token);
    setCurrentUser(user);
    setAppBannerError('');
    if (user.grade) {
      setSelectedGrade(user.grade);
    }
    if (user.role === 'student') setActiveTab('dashboard');
    else if (user.role === 'teacher') setActiveTab('teacher-overview');
    else setActiveTab('admin-overview');
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Proceed with client logout regardless
      }
    }
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAuthToken(null);
    setCurrentUser(null);
    setClasses([]);
    setAssignments([]);
    setSubmissions([]);
    setDrafts([]);
    setAuditLogs([]);
    setActiveTab('landing');
  };

  const handleLandingEnterRole = (role: UserRole, grade?: number) => {
    if (currentUser && currentUser.role === role) {
      if (role === 'student' && grade) {
        setSelectedGrade(grade);
      }
      setActiveTab(
        role === 'student' ? 'dashboard' : role === 'teacher' ? 'teacher-overview' : 'admin-overview'
      );
      return;
    }
    if (role === 'student' && grade) {
      setSelectedGrade(grade);
    }
    handleOpenAuth('login', role);
  };

  const handleOpenLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setActiveTab('lesson-detail');
  };

  const handleOpenExercise = (exerciseSetId: string, assignmentId?: string) => {
    setActiveExerciseSetId(exerciseSetId);
    setActiveAssignmentId(assignmentId);
    setActiveTab('exercise-runner');
  };

  const handleAskAiAboutLesson = (title: string, id: string) => {
    setTutorInitialLesson({ id, title });
    if (!currentUser) {
      handleOpenAuth('login', 'student');
      return;
    }
    setActiveTab('tutor');
  };

  const handleCreateClass = async (name: string, grade: number) => {
    if (!authToken) return;
    setAppBannerError('');
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, grade }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppBannerError(data.error || 'Không thể tạo lớp học mới.');
        return;
      }
      if (data.success && data.class) {
        setClasses((prev) => [data.class, ...prev]);
      }
    } catch {
      setAppBannerError('Lỗi kết nối máy chủ khi tạo lớp học.');
    }
  };

  const handleUpdateLessonStatus = async (lessonId: string, status: ResourceStatus) => {
    if (!authToken) return;
    setAppBannerError('');
    try {
      const res = await fetch(`/api/curriculum/lessons/${lessonId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppBannerError(data.error || 'Không thể cập nhật trạng thái bài học.');
        return;
      }
      if (data.success && data.lesson) {
        setLessons((prev) => prev.map((l) => (l.id === lessonId ? data.lesson : l)));
        if (currentUser?.role === 'admin') {
          const audRes = await fetch('/api/audit-logs', {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (audRes.ok) setAuditLogs(await audRes.json());
        }
      }
    } catch {
      setAppBannerError('Lỗi kết nối máy chủ khi thẩm định bài học.');
    }
  };

  const handleDraftStatusChange = async (
    draftId: string,
    status: 'approved' | 'rejected' | 'published',
    notes?: string
  ) => {
    if (!authToken) return;
    setAppBannerError('');
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status, teacherNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppBannerError(data.error || 'Không thể cập nhật kiểm duyệt bản nháp.');
        return;
      }
      if (data.success && data.draft) {
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? data.draft : d)));
      }
    } catch {
      setAppBannerError('Lỗi kết nối máy chủ khi duyệt bản nháp AI.');
    }
  };

  const refreshAuditLogs = useCallback(async () => {
    if (!authToken || currentUser?.role !== 'admin') return;
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setAuditLogs(await res.json());
      }
    } catch {
      // ignore
    }
  }, [authToken, currentUser?.role]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const activeExercise = exercises.find((e) => e.id === activeExerciseSetId) || exercises[0];

  const filteredLessons = lessons.filter((les) => {
    const matchSubject = selectedSubjectFilter === 'all' || les.subjectId === selectedSubjectFilter;
    const matchQuery =
      !lessonSearch.trim() ||
      les.title.toLowerCase().includes(lessonSearch.trim().toLowerCase()) ||
      les.lessonCode.toLowerCase().includes(lessonSearch.trim().toLowerCase());
    return matchSubject && matchQuery;
  });

  const filteredExercises = exercises.filter(
    (ex) => selectedSubjectFilter === 'all' || ex.subjectId === selectedSubjectFilter
  );

  const canViewLearningHub = !currentUser || currentUser.role === 'student';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Navigation */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'lessons') setActiveLessonId(null);
          if (tab === 'exercises') setActiveExerciseSetId(null);
        }}
        selectedGrade={selectedGrade}
        onGradeChange={(g) => setSelectedGrade(g)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {appBannerError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{appBannerError}</span>
            </div>
            <button
              onClick={() => setAppBannerError('')}
              className="font-semibold underline hover:no-underline"
            >
              Đóng
            </button>
          </div>
        )}

        {isRestoringSession && (
          <div className="py-12 text-center text-xs text-slate-500">
            Đang khôi phục phiên làm việc an toàn...
          </div>
        )}

        {/* ================= LANDING PAGE VIEW ================= */}
        {!isRestoringSession && activeTab === 'landing' && (
          <LandingPage
            onEnterRole={handleLandingEnterRole}
            onOpenAuth={handleOpenAuth}
            onExploreCurriculum={() => {
              setSelectedSubjectFilter('all');
              setActiveTab('lessons');
            }}
          />
        )}

        {/* ================= GUEST / STUDENT LEARNING VIEWS ================= */}
        {!isRestoringSession && canViewLearningHub && (
          <>
            {activeTab === 'dashboard' && currentUser && (
              <StudentDashboard
                user={currentUser}
                subjects={subjects}
                assignments={assignments}
                lessons={lessons}
                submissions={submissions}
                onSelectSubject={(subId) => {
                  setSelectedSubjectFilter(subId);
                  setActiveTab('lessons');
                }}
                onOpenLesson={handleOpenLesson}
                onOpenExercise={handleOpenExercise}
                onOpenTutor={() => setActiveTab('tutor')}
                onOpenJourney={() => setActiveTab('journey')}
                onOpenKnowledgeMap={() => setActiveTab('knowledge-map')}
              />
            )}

            {activeTab === 'lessons' && (
              <div className="max-w-4xl mx-auto space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                      Kho Bài Giảng & Học Liệu Lớp {selectedGrade}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Nội dung chuẩn hóa theo Chương trình GDPT 2018 và Thông tư 17/2025/TT-BGDĐT.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      placeholder="Tìm tên bài hoặc mã bài..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Subject Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Tất cả môn ({lessons.length})
                  </button>
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubjectFilter(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        selectedSubjectFilter === sub.id
                          ? 'bg-cyan-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Chưa có bài học phù hợp bộ lọc
                    </div>
                    <p className="text-xs text-slate-500">
                      Hãy thử đổi khối lớp, chọn &ldquo;Tất cả môn&rdquo; hoặc xóa từ khóa tìm kiếm.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredLessons.map((les) => (
                      <div
                        key={les.id}
                        onClick={() => handleOpenLesson(les.id)}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all cursor-pointer shadow-sm group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                              {les.lessonCode}
                            </span>
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                les.status === 'verified'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : les.status === 'pending'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>
                                {les.status === 'verified'
                                  ? 'Đã thẩm định'
                                  : les.status === 'pending'
                                  ? 'Chờ duyệt'
                                  : 'Chưa xác minh'}
                              </span>
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {les.title}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {les.summary}
                          </p>
                        </div>

                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                          <span>Học bài ngay</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lesson-detail' && activeLesson && (
              <LessonViewer
                lesson={activeLesson}
                hasMatchingExercise={Boolean(exercises.find((e) => e.lessonId === activeLesson.id))}
                onBack={() => setActiveTab('lessons')}
                onOpenExercise={(lId) => {
                  const matched = exercises.find((e) => e.lessonId === lId);
                  if (matched) {
                    handleOpenExercise(matched.id);
                  } else {
                    setActiveTab('exercises');
                  }
                }}
                onAskAi={handleAskAiAboutLesson}
              />
            )}

            {activeTab === 'exercises' && (
              <div className="max-w-4xl mx-auto space-y-6 pb-16">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                    Kho Bài Tập Tương Tác & Luyện Thi (Lớp {selectedGrade})
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Tự động chấm điểm, hiển thị lời giải từng bước và nạp điểm năng lượng XP vào Robot EduBot.
                  </p>
                </div>

                {!currentUser && (
                  <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-900 dark:text-cyan-200">
                    <span>Bạn có thể xem thử và làm bài, nhưng cần đăng nhập tài khoản Học sinh để nộp bài và lưu điểm XP.</span>
                    <button
                      onClick={() => handleOpenAuth('login', 'student')}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Đăng nhập Học sinh</span>
                    </button>
                  </div>
                )}

                {filteredExercises.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Chưa có bộ bài tập cho Khối {selectedGrade}
                    </div>
                    <p className="text-xs text-slate-500">
                      Hãy chuyển sang khối lớp khác hoặc nhấn &ldquo;Tất cả môn&rdquo; ở Kho bài giảng.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredExercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
                              {ex.subjectId}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Khối {ex.grade}</span>
                            <span aria-hidden="true">·</span>
                            <span>Thời lượng: {ex.durationMinutes} phút</span>
                            <span aria-hidden="true">·</span>
                            <span>{ex.questions.length} câu hỏi</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {ex.title}
                          </h3>
                        </div>

                        <button
                          onClick={() => handleOpenExercise(ex.id)}
                          className="px-5 py-2.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Bắt đầu làm bài</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exercise-runner' && activeExercise && (
              <ExerciseRunner
                exercise={activeExercise}
                assignmentId={activeAssignmentId}
                studentId={currentUser?.id || 'guest'}
                studentName={currentUser?.name || 'Khách'}
                grade={selectedGrade}
                authToken={authToken}
                onRequireAuth={() => handleOpenAuth('login', 'student')}
                onBack={() => setActiveTab('exercises')}
                onSubmittedSuccess={(sub, xp) => {
                  setSubmissions((prev) => [sub, ...prev]);
                  setCurrentUser((u) => (u ? { ...u, xp: (u.xp || 0) + xp } : u));
                }}
              />
            )}

            {activeTab === 'tutor' && currentUser && (
              <EduBotTutorChat
                grade={selectedGrade}
                lessons={lessons}
                initialLessonId={tutorInitialLesson.id}
                initialLessonTitle={tutorInitialLesson.title}
                authToken={authToken}
                onRequireAuth={() => handleOpenAuth('login', 'student')}
              />
            )}

            {activeTab === 'journey' && currentUser && (
              <GamificationJourney
                user={currentUser}
                onStartQuest={(_qId) => setActiveTab('exercises')}
              />
            )}

            {activeTab === 'knowledge-map' && (
              <KnowledgeMap
                nodes={knowledgeNodes}
                lessons={lessons}
                onOpenLesson={handleOpenLesson}
                onAskTutor={(title) => handleAskAiAboutLesson(title, '')}
              />
            )}

            {!currentUser && (activeTab === 'dashboard' || activeTab === 'tutor' || activeTab === 'journey') && (
              <div className="max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <Lock className="w-10 h-10 text-cyan-500 mx-auto" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Vui lòng đăng nhập để sử dụng tính năng này
                </h2>
                <p className="text-xs text-slate-500">
                  Hồ sơ học tập, Gia sư AI EduBot và Hành trình XP được bảo vệ và lưu trữ theo từng tài khoản học sinh.
                </p>
                <button
                  onClick={() => handleOpenAuth('login', 'student')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ================= TEACHER VIEWS ================= */}
        {!isRestoringSession && currentUser?.role === 'teacher' && (
          <>
            {activeTab === 'teacher-overview' && (
              <TeacherDashboard
                user={currentUser}
                classes={classes}
                assignments={assignments}
                submissions={submissions}
                drafts={drafts}
                authToken={authToken}
                onNavigate={(t) => setActiveTab(t)}
                onCreateClass={handleCreateClass}
                onClassUpdated={(updatedClass) =>
                  setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)))
                }
              />
            )}

            {activeTab === 'ai-planner' && (
              <AiLessonPlanner
                authToken={authToken}
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'ai-standardize' && (
              <AiKnowledgeStandardizer
                authToken={authToken}
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'ai-quiz' && (
              <AiQuizGenerator
                authToken={authToken}
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'assignment-manager' && (
              <AssignmentManager
                classes={classes}
                assignments={assignments}
                exercises={exercises}
                submissions={submissions}
                currentUserName={currentUser.name}
                authToken={authToken}
                onAssignCreated={(newAssign) => setAssignments((prev) => [newAssign, ...prev])}
              />
            )}

            {activeTab === 'review-drafts' && (
              <ContentReviewer
                drafts={drafts}
                onDraftStatusChange={handleDraftStatusChange}
              />
            )}
          </>
        )}

        {/* ================= ADMIN VIEWS ================= */}
        {!isRestoringSession && currentUser?.role === 'admin' && activeTab !== 'landing' && (
          <AdminDashboard
            lessons={lessons}
            subjects={subjects}
            auditLogs={auditLogs}
            activeNavbarTab={activeTab}
            authToken={authToken}
            onUpdateLessonStatus={handleUpdateLessonStatus}
            onAuditLogsRefresh={refreshAuditLogs}
          />
        )}
      </main>

      {/* Quiet domain-compliant footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">EduBot AI</span>
            <span>– Future Learning Ecosystem (Lớp 1–5)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Căn cứ TT 32/2018 & TT 17/2025/TT-BGDĐT</span>
            <span aria-hidden="true">·</span>
            <span>Bảo vệ quyền riêng tư học sinh</span>
            <span aria-hidden="true">·</span>
            <span>Năm học 2025 – 2026</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
        suggestedRole={suggestedRole}
      />
    </div>
  );
}
