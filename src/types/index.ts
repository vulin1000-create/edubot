/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: number; // 1 to 5 for students
  avatar?: string;
  school?: string;
  classCode?: string;
  xp?: number;
  streakDays?: number;
  badges?: string[];
  createdAt: string;
}

export type ResourceStatus = 'verified' | 'pending' | 'unverified' | 'ai_draft';

export interface CurriculumSubject {
  id: string;
  name: string;
  code: string;
  grades: number[]; // e.g. [1, 2, 3, 4, 5]
  category: 'compulsory' | 'elective' | 'integrated';
  icon: string;
  color: string;
  description: string;
}

export interface CurriculumTopic {
  id: string;
  subjectId: string;
  grade: number;
  semester: 1 | 2;
  title: string;
  order: number;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  subjectId: string;
  grade: number;
  semester: 1 | 2;
  title: string;
  lessonCode: string;
  order: number;
  objectives: string[]; // Yêu cầu cần đạt
  coreKnowledge: string[]; // Kiến thức trọng tâm
  termsAndDefinitions: { term: string; definition: string }[];
  illustrations: string[];
  commonMisconceptions: string[]; // Lỗi sai học sinh thường gặp
  summary: string;
  officialReference: {
    docNumber: string; // e.g. "TT 32/2018/TT-BGDĐT", "TT 17/2025/TT-BGDĐT"
    issueDate: string;
    sourceUrl?: string;
    curriculumVersion: string;
  };
  status: ResourceStatus;
  interactiveContent?: {
    sections: {
      title: string;
      content: string;
      example?: string;
      checkpointQuestion?: {
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      };
    }[];
  };
}

export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'step_math'
  | 'short_answer';

export interface Question {
  id: string;
  lessonId: string;
  subjectId: string;
  grade: number;
  type: QuestionType;
  difficulty: 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';
  questionText: string;
  options?: string[]; // For single_choice, multi_choice
  correctAnswer: any; // number | number[] | boolean | string | Record<string, string>
  explanation: string;
  pedagogicalHint: string;
  learningOutcomeId?: string;
  pairs?: { left: string; right: string }[]; // For matching
  steps?: { stepNumber: number; instruction: string; formula?: string; solution: string }[]; // For step_math
}

export interface KnowledgeNode {
  id: string;
  title: string;
  subjectId: string;
  grade: number;
  lessonId: string;
  prerequisites: string[]; // ids of prerequisite nodes
  nextNodes: string[];
  status: 'locked' | 'available' | 'mastered';
  masteryPercentage: number;
  description: string;
  order: number;
}

export interface ExerciseSet {
  id: string;
  title: string;
  subjectId: string;
  grade: number;
  lessonId?: string;
  questions: Question[];
  durationMinutes: number;
  totalPoints: number;
}

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  students: { id: string; name: string; email: string; xp: number; progress: number }[];
  academicYear: string;
}

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  exerciseSetId: string;
  title: string;
  subjectId: string;
  grade: number;
  deadline: string;
  assignedBy: string;
  maxAttempts: number;
  status: 'active' | 'closed';
  completedCount: number;
  totalStudents: number;
}

export interface StudentSubmission {
  id: string;
  assignmentId?: string;
  exerciseSetId: string;
  studentId: string;
  studentName: string;
  grade: number;
  answers: Record<string, any>;
  score: number; // 0 - 10
  totalCorrect: number;
  totalQuestions: number;
  completedAt: string;
  timeSpentSeconds: number;
  feedback: string;
  misconceptionTags: string[];
}

export interface AiChatMessage {
  id: string;
  sender: 'student' | 'edubot';
  text: string;
  timestamp: string;
  referencedLessons?: string[];
  suggestedPrompts?: string[];
  robotExpression?: 'happy' | 'thinking' | 'explaining' | 'celebrating';
}

export interface AiDraftItem {
  id: string;
  type: 'lesson_plan' | 'standardized_knowledge' | 'quiz_matrix';
  title: string;
  subjectId: string;
  grade: number;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'approved' | 'rejected' | 'published';
  content: any;
  teacherNotes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  details: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}
