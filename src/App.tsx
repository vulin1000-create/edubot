/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  BookOpen,
  ArrowRight,
  Sparkles,
  Bot,
  PlayCircle,
  FileCheck2,
  Lock,
  Layers,
  ChevronRight,
  Shield,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-student-1',
    name: 'Em Hoàng Tuấn',
    email: 'tuan.nh@edubot.edu.vn',
    role: 'student',
    grade: 4,
    school: 'Lớp 4A1 - TH Thăng Long',
    classCode: 'EDU-4A1',
    xp: 850,
    streakDays: 7,
    badges: ['Nhà thám hiểm sao', 'Toán học thần tốc', 'Trợ thủ EduBot'],
    createdAt: '2026-02-01T14:00:00Z',
  });

  const [selectedGrade, setSelectedGrade] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  // Initial data loading
  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, lesRes, exRes, clsRes, assRes, submsRes, drfRes, audRes, knwRes] = await Promise.all([
          fetch(`/api/curriculum/subjects?grade=${selectedGrade}`),
          fetch(`/api/curriculum/lessons?grade=${selectedGrade}`),
          fetch(`/api/exercises?grade=${selectedGrade}`),
          fetch('/api/classes'),
          fetch(`/api/assignments?grade=${selectedGrade}`),
          fetch('/api/submissions'),
          fetch('/api/ai/drafts'),
          fetch('/api/audit-logs'),
          fetch('/api/knowledge-map'),
        ]);

        if (subRes.ok) setSubjects(await subRes.json());
        if (lesRes.ok) setLessons(await lesRes.json());
        if (exRes.ok) setExercises(await exRes.json());
        if (clsRes.ok) setClasses(await clsRes.json());
        if (assRes.ok) setAssignments(await assRes.json());
        if (submsRes.ok) setSubmissions(await submsRes.json());
        if (drfRes.ok) setDrafts(await drfRes.json());
        if (audRes.ok) setAuditLogs(await audRes.json());
        if (knwRes.ok) setKnowledgeNodes(await knwRes.json());
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    }
    loadData();
  }, [selectedGrade]);

  const handleRoleSwitch = async (role: UserRole, grade?: number) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, grade: grade || selectedGrade }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.user.grade) {
          setSelectedGrade(data.user.grade);
        }
        if (role === 'student') setActiveTab('dashboard');
        else if (role === 'teacher') setActiveTab('teacher-overview');
        else setActiveTab('admin-overview');
      }
    } catch (e) {
      console.error(e);
    }
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
    setActiveTab('tutor');
  };

  const handleCreateClass = async (name: string, grade: number) => {
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          grade,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.class) {
        setClasses((prev) => [data.class, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLessonStatus = async (lessonId: string, status: ResourceStatus) => {
    try {
      const res = await fetch(`/api/curriculum/lessons/${lessonId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: currentUser.name }),
      });
      const data = await res.json();
      if (data.success && data.lesson) {
        setLessons((prev) => prev.map((l) => (l.id === lessonId ? data.lesson : l)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDraftStatusChange = async (
    draftId: string,
    status: 'approved' | 'rejected' | 'published',
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, teacherNotes: notes, reviewer: currentUser.name }),
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? data.draft : d)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const activeExercise = exercises.find((e) => e.id === activeExerciseSetId) || exercises[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar Navigation */}
      <Navbar
        currentUser={currentUser}
        onRoleSwitch={handleRoleSwitch}
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
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setShowAuthModal(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {/* ================= LANDING PAGE VIEW ================= */}
        {activeTab === 'landing' && (
          <LandingPage
            onEnterRole={(role, grade) => {
              handleRoleSwitch(role, grade);
            }}
            onOpenAuth={(mode) => {
              setAuthMode(mode || 'login');
              setShowAuthModal(true);
            }}
            onExploreCurriculum={() => {
              setActiveTab('lessons');
            }}
          />
        )}
        
        {/* ================= STUDENT VIEWS ================= */}
        {currentUser.role === 'student' && (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                user={currentUser}
                subjects={subjects}
                assignments={assignments}
                lessons={lessons}
                onSelectSubject={(_subId) => setActiveTab('lessons')}
                onOpenLesson={handleOpenLesson}
                onOpenExercise={handleOpenExercise}
                onOpenTutor={() => setActiveTab('tutor')}
                onOpenJourney={() => setActiveTab('journey')}
                onOpenKnowledgeMap={() => setActiveTab('knowledge-map')}
              />
            )}

            {activeTab === 'lessons' && (
              <div className="max-w-4xl mx-auto space-y-6 pb-16">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                    Kho Bài Giảng & Học Liệu Lớp {selectedGrade}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Nội dung chuẩn hóa theo Chương trình GDPT 2018 và Thông tư 17/2025/TT-BGDĐT.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lessons.map((les) => (
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
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Đã thẩm định</span>
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
              </div>
            )}

            {activeTab === 'lesson-detail' && activeLesson && (
              <LessonViewer
                lesson={activeLesson}
                onBack={() => setActiveTab('lessons')}
                onOpenExercise={(lId) => {
                  const matched = exercises.find((e) => e.lessonId === lId);
                  handleOpenExercise(matched ? matched.id : exercises[0]?.id);
                }}
                onAskAi={handleAskAiAboutLesson}
              />
            )}

            {activeTab === 'exercises' && (
              <div className="max-w-4xl mx-auto space-y-6 pb-16">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">
                    Kho Bài Tập Tương Tác & Luyện Thi
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Tự động chấm điểm, hiển thị lời giải từng bước và nạp điểm năng lượng XP vào Robot EduBot.
                  </p>
                </div>

                <div className="space-y-4">
                  {exercises.map((ex) => (
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
              </div>
            )}

            {activeTab === 'exercise-runner' && activeExercise && (
              <ExerciseRunner
                exercise={activeExercise}
                assignmentId={activeAssignmentId}
                studentId={currentUser.id}
                studentName={currentUser.name}
                grade={selectedGrade}
                onBack={() => setActiveTab('exercises')}
                onSubmittedSuccess={(_sub, _xp) => {
                  setCurrentUser((u) => ({ ...u, xp: (u.xp || 850) + _xp }));
                }}
              />
            )}

            {activeTab === 'tutor' && (
              <EduBotTutorChat
                grade={selectedGrade}
                lessons={lessons}
                initialLessonId={tutorInitialLesson.id}
                initialLessonTitle={tutorInitialLesson.title}
              />
            )}

            {activeTab === 'journey' && (
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
          </>
        )}

        {/* ================= TEACHER VIEWS ================= */}
        {currentUser.role === 'teacher' && (
          <>
            {activeTab === 'teacher-overview' && (
              <TeacherDashboard
                user={currentUser}
                classes={classes}
                assignments={assignments}
                drafts={drafts}
                onNavigate={(t) => setActiveTab(t)}
                onCreateClass={handleCreateClass}
              />
            )}

            {activeTab === 'ai-planner' && (
              <AiLessonPlanner
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'ai-standardize' && (
              <AiKnowledgeStandardizer
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'ai-quiz' && (
              <AiQuizGenerator
                onDraftCreated={(newDraft) => setDrafts((prev) => [newDraft, ...prev])}
              />
            )}

            {activeTab === 'assignment-manager' && (
              <AssignmentManager
                classes={classes}
                assignments={assignments}
                exercises={exercises}
                submissions={submissions}
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
        {currentUser.role === 'admin' && (
          <AdminDashboard
            lessons={lessons}
            subjects={subjects}
            auditLogs={auditLogs}
            onUpdateLessonStatus={handleUpdateLessonStatus}
          />
        )}
      </main>

      {/* Quiet domain-compliant footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">EduBot AI</span>
            <span>– Future Learning Ecosystem (Lớp 1-5)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Căn cứ TT 32/2018 & TT 17/2025/TT-BGDĐT</span>
            <span aria-hidden="true">·</span>
            <span>Bảo vệ quyền riêng tư học sinh</span>
            <span aria-hidden="true">·</span>
            <span>Năm học 2025 - 2026</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user.grade) {
            setSelectedGrade(user.grade);
          }
        }}
        initialMode={authMode}
      />
    </div>
  );
}
