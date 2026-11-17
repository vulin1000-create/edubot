/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  initialUsers,
  initialSubjects,
  initialTopics,
  initialLessons,
  initialExercises,
  initialClasses,
  initialAssignments,
  initialSubmissions,
  initialDrafts,
  initialAuditLogs,
  initialKnowledgeNodes
} from './server/data.ts';
import {
  User,
  UserRole,
  CurriculumSubject,
  CurriculumTopic,
  Lesson,
  ExerciseSet,
  ClassRoom,
  Assignment,
  StudentSubmission,
  AiDraftItem,
  AuditLog,
  KnowledgeNode,
  SystemSettings,
  AiChatMessage
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ----------------- SECURITY & CRYPTO HELPERS -----------------
const TOKEN_SECRET = process.env.SESSION_SECRET || 'edubot-ai-session-secret-2026';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function hashPassword(password: string, salt?: string): string {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return `${usedSalt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface TokenPayload {
  sub: string;
  role: UserRole;
  exp: number;
  jti: string;
}

function signToken(user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
    jti: crypto.randomUUID(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

const revokedTokenIds = new Set<string>();

function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || !payload.exp || Date.now() > payload.exp) return null;
    if (revokedTokenIds.has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user: User): User {
  const { ...safe } = user;
  return safe;
}

interface AuthenticatedRequest extends Request {
  authUser?: User;
  tokenPayload?: TokenPayload;
}

// In-Memory Database Store (explicitly volatile without Firebase/Cloud SQL)
let users: User[] = initialUsers.map((u) => ({ ...u }));
const passwordHashes = new Map<string, string>();
const DEFAULT_DEMO_PASSWORDS: Record<string, string> = {
  'admin@edubot.edu.vn': process.env.DEMO_ADMIN_PASSWORD || 'edubot2026',
  'comai@edubot.edu.vn': process.env.DEMO_TEACHER_PASSWORD || 'edubot2026',
  'tuan.nh@edubot.edu.vn': process.env.DEMO_STUDENT_PASSWORD || 'edubot2026',
};
for (const u of users) {
  const initialPw = DEFAULT_DEMO_PASSWORDS[u.email.toLowerCase()] || 'edubot2026';
  passwordHashes.set(u.id, hashPassword(initialPw));
}

const otpStore = new Map<string, { code: string; expiresAt: number }>();
const studentChatHistories = new Map<string, AiChatMessage[]>();

let subjects: CurriculumSubject[] = [...initialSubjects];
let topics: CurriculumTopic[] = [...initialTopics];
let lessons: Lesson[] = [...initialLessons];
let exercises: ExerciseSet[] = [...initialExercises];
let classes: ClassRoom[] = initialClasses.map((c) => ({ ...c, students: [...c.students] }));
let assignments: Assignment[] = [...initialAssignments];
let submissions: StudentSubmission[] = [...initialSubmissions];
let aiDrafts: AiDraftItem[] = [...initialDrafts];
let auditLogs: AuditLog[] = [...initialAuditLogs];
let knowledgeNodes: KnowledgeNode[] = [...initialKnowledgeNodes];
let systemSettings: SystemSettings = {
  childSafetyFilterEnabled: true,
  parentalConsentRequired: true,
  dataRetentionDays: 365,
  aiMaxTokensPerDay: 50000,
  curriculumStandard: 'Thông tư 32/2018/TT-BGDĐT & TT 17/2025/TT-BGDĐT',
  curriculumVersionYear: 2026,
  maintenanceMode: false
};

// Authentication & RBAC Middleware
function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để truy cập tài nguyên này.' });
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
  }
  const user = users.find((u) => u.id === payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại trong hệ thống.' });
  }
  req.authUser = user;
  req.tokenPayload = payload;
  next();
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Chưa xác thực người dùng.' });
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        error: `Bạn không có quyền thực hiện thao tác này (Yêu cầu vai trò: ${allowedRoles.join(', ')}).`
      });
    }
    next();
  };
}

// Gemini AI Client Initialization (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function addAuditLog(
  action: string,
  user: string,
  role: string,
  details: string,
  status: 'success' | 'warning' | 'info' = 'info'
) {
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action,
    user,
    role,
    details,
    timestamp: new Date().toISOString(),
    status
  });
}

// ----------------- AUTHENTICATION ROUTES -----------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
  }

  const user = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  const storedHash = passwordHashes.get(user.id);
  if (!storedHash || !verifyPassword(String(password), storedHash)) {
    addAuditLog(
      'Đăng nhập thất bại',
      user.email,
      user.role,
      'Nhập sai mật khẩu khi đăng nhập.',
      'warning'
    );
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
  }

  const token = signToken(user);
  addAuditLog('Đăng nhập hệ thống', user.email, user.role, `Người dùng ${user.name} đăng nhập thành công.`, 'info');
  res.json({ success: true, user: sanitizeUser(user), token });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, grade, school } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  // Prevent self-registration as admin
  const safeRole: UserRole = role === 'teacher' ? 'teacher' : 'student';

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email này đã được đăng ký tài khoản.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    role: safeRole,
    grade: safeRole === 'student' ? Math.min(5, Math.max(1, Number(grade) || 4)) : undefined,
    school: school ? String(school).trim() : 'Trường Tiểu học Thăng Long',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(String(name))}`,
    xp: safeRole === 'student' ? 100 : undefined,
    streakDays: safeRole === 'student' ? 1 : undefined,
    badges: safeRole === 'student' ? ['Tân binh EduBot'] : undefined,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  passwordHashes.set(newUser.id, hashPassword(String(password)));

  const token = signToken(newUser);
  addAuditLog(
    'Đăng ký tài khoản mới',
    newUser.email,
    newUser.role,
    `Người dùng ${newUser.name} đã đăng ký tài khoản vai trò ${newUser.role}`,
    'success'
  );

  res.status(201).json({ success: true, user: sanitizeUser(newUser), token });
});

app.post('/api/auth/logout', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  if (req.tokenPayload?.jti) {
    revokedTokenIds.add(req.tokenPayload.jti);
  }
  if (req.authUser) {
    addAuditLog('Đăng xuất hệ thống', req.authUser.email, req.authUser.role, 'Đã kết thúc phiên làm việc an toàn.', 'info');
  }
  res.json({ success: true });
});

app.get('/api/auth/me', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: sanitizeUser(req.authUser!) });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Vui lòng nhập email tài khoản.' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này trong hệ thống.' });
  }

  const code = String(crypto.randomInt(100000, 999999));
  otpStore.set(normalizedEmail, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

  addAuditLog(
    'Yêu cầu đặt lại mật khẩu',
    user.email,
    user.role,
    `Đã tạo mã OTP xác thực đặt lại mật khẩu cho ${user.email}`,
    'info'
  );

  res.json({
    success: true,
    message: `Hệ thống đã tạo mã OTP xác thực cho ${normalizedEmail}. (Môi trường thử nghiệm chưa kết nối máy chủ SMTP — Mã OTP của bạn: ${code})`,
    devOtpPreview: process.env.NODE_ENV !== 'production' ? code : undefined
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, otpCode, newPassword } = req.body;
  if (!email || !otpCode || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email, mã OTP và mật khẩu mới.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (!record || Date.now() > record.expiresAt || record.code !== String(otpCode).trim()) {
    return res.status(400).json({ error: 'Mã OTP không chính xác hoặc đã hết hạn.' });
  }

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'Tài khoản không tồn tại.' });
  }

  passwordHashes.set(user.id, hashPassword(String(newPassword)));
  otpStore.delete(normalizedEmail);

  addAuditLog(
    'Đặt lại mật khẩu thành công',
    user.email,
    user.role,
    `Người dùng ${user.email} đã đặt lại mật khẩu bằng OTP hợp lệ.`,
    'success'
  );

  res.json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.' });
});

app.get('/api/auth/users', authenticateRequest, requireRole('admin', 'teacher'), (req: AuthenticatedRequest, res: Response) => {
  if (req.authUser!.role === 'teacher') {
    // Teachers see only student directory entries needed for class rosters
    return res.json(users.filter((u) => u.role === 'student').map(sanitizeUser));
  }
  res.json(users.map(sanitizeUser));
});

app.put('/api/auth/users/:id/role', authenticateRequest, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, grade } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  }
  const target = users.find((u) => u.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }
  if (target.id === req.authUser!.id && role !== 'admin') {
    return res.status(400).json({ error: 'Không thể tự hạ quyền tài khoản Quản trị viên đang đăng nhập.' });
  }

  const prevRole = target.role;
  target.role = role;
  if (role === 'student') {
    target.grade = Math.min(5, Math.max(1, Number(grade) || target.grade || 4));
    target.xp = target.xp ?? 100;
    target.streakDays = target.streakDays ?? 1;
  }

  addAuditLog(
    'Phân quyền tài khoản',
    req.authUser!.email,
    'admin',
    `Thay đổi vai trò của ${target.email} từ "${prevRole}" sang "${role}".`,
    'warning'
  );

  res.json({ success: true, user: sanitizeUser(target) });
});

// ----------------- KNOWLEDGE MAP ROUTE -----------------
app.get('/api/knowledge-map', (req: Request, res: Response) => {
  const { grade, subjectId } = req.query;
  let list = knowledgeNodes;
  if (grade) list = list.filter((k) => k.grade === Number(grade));
  if (subjectId) list = list.filter((k) => k.subjectId === subjectId);
  res.json(list);
});

// ----------------- SYSTEM SETTINGS & PRIVACY -----------------
app.get('/api/system/settings', authenticateRequest, requireRole('admin'), (_req: Request, res: Response) => {
  res.json(systemSettings);
});

app.put('/api/system/settings', authenticateRequest, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const allowedKeys: (keyof SystemSettings)[] = [
    'childSafetyFilterEnabled',
    'parentalConsentRequired',
    'dataRetentionDays',
    'aiMaxTokensPerDay',
    'curriculumStandard',
    'curriculumVersionYear',
    'maintenanceMode'
  ];

  const updates: Partial<SystemSettings> = {};
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  systemSettings = { ...systemSettings, ...updates };
  addAuditLog(
    'Cập nhật cấu hình hệ thống',
    req.authUser!.email,
    'admin',
    `Đã cập nhật chính sách an toàn trẻ em & cấu hình hệ thống (${Object.keys(updates).join(', ') || 'không đổi'}).`,
    'warning'
  );
  res.json({ success: true, settings: systemSettings });
});

// ----------------- STUDENT PERFORMANCE DETAIL -----------------
app.get('/api/students/:id/performance', authenticateRequest, requireRole('student', 'teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (req.authUser!.role === 'student' && req.authUser!.id !== id) {
    return res.status(403).json({ error: 'Học sinh chỉ có quyền xem hồ sơ học tập của chính mình.' });
  }

  const student = users.find((u) => u.id === id);
  const rosterStudent = classes.flatMap((c) => c.students).find((s) => s.id === id);

  if (!student && !rosterStudent) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const studentSubmissions = submissions.filter((s) => s.studentId === id);
  const avgScore = studentSubmissions.length > 0
    ? Number((studentSubmissions.reduce((a, b) => a + b.score, 0) / studentSubmissions.length).toFixed(1))
    : null;

  const masteredNodes = knowledgeNodes.filter((k) => k.status === 'mastered');
  const availableNodes = knowledgeNodes.filter((k) => k.status === 'available');
  const studentGrade = student?.grade || 4;

  res.json({
    student: student ? sanitizeUser(student) : rosterStudent,
    totalSubmissions: studentSubmissions.length,
    avgScore: avgScore ?? 0,
    hasSubmissions: studentSubmissions.length > 0,
    xp: student?.xp ?? rosterStudent?.xp ?? 0,
    streakDays: student?.streakDays ?? 1,
    badges: student?.badges ?? [],
    masteredNodesCount: masteredNodes.length,
    inProgressNodesCount: availableNodes.length,
    recentSubmissions: studentSubmissions.slice(0, 5),
    recommendedNextLesson: lessons.find((l) => l.grade === studentGrade)?.title || 'Phân số bằng nhau'
  });
});

// ----------------- CURRICULUM ROUTES -----------------
app.get('/api/curriculum/subjects', (req: Request, res: Response) => {
  const grade = req.query.grade ? Number(req.query.grade) : null;
  if (grade) {
    const filtered = subjects.filter((s) => s.grades.includes(grade));
    return res.json(filtered);
  }
  res.json(subjects);
});

app.get('/api/curriculum/topics', (req: Request, res: Response) => {
  const { subjectId, grade } = req.query;
  let list = topics;
  if (subjectId) list = list.filter((t) => t.subjectId === subjectId);
  if (grade) list = list.filter((t) => t.grade === Number(grade));
  res.json(list);
});

app.get('/api/curriculum/lessons', (req: Request, res: Response) => {
  const { subjectId, grade, status } = req.query;
  let list = lessons;
  if (subjectId) list = list.filter((l) => l.subjectId === subjectId);
  if (grade) list = list.filter((l) => l.grade === Number(grade));
  if (status) list = list.filter((l) => l.status === status);
  res.json(list);
});

app.get('/api/curriculum/lessons/:id', (req: Request, res: Response) => {
  const lesson = lessons.find((l) => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ error: 'Không tìm thấy bài học' });
  }
  res.json(lesson);
});

app.put('/api/curriculum/lessons/:id/status', authenticateRequest, requireRole('admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['verified', 'pending', 'unverified', 'ai_draft'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái bài học không hợp lệ.' });
  }
  const lessonIndex = lessons.findIndex((l) => l.id === id);
  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Bài học không tồn tại' });
  }
  lessons[lessonIndex].status = status;
  addAuditLog(
    'Thẩm định bài học',
    req.authUser!.email,
    'admin',
    `Đổi trạng thái bài học "${lessons[lessonIndex].title}" thành "${status}"`,
    'success'
  );
  res.json({ success: true, lesson: lessons[lessonIndex] });
});

// ----------------- EXERCISES & ASSIGNMENTS ROUTES -----------------
app.get('/api/exercises', (req: Request, res: Response) => {
  const { subjectId, grade, lessonId } = req.query;
  let list = exercises;
  if (subjectId) list = list.filter((e) => e.subjectId === subjectId);
  if (grade) list = list.filter((e) => e.grade === Number(grade));
  if (lessonId) list = list.filter((e) => e.lessonId === lessonId);
  res.json(list);
});

app.get('/api/exercises/:id', (req: Request, res: Response) => {
  const exercise = exercises.find((e) => e.id === req.params.id);
  if (!exercise) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }
  res.json(exercise);
});

app.post('/api/exercises/submit', authenticateRequest, requireRole('student', 'teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { exerciseSetId, grade, answers, timeSpentSeconds, assignmentId } = req.body;
  if (!exerciseSetId || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Dữ liệu bài nộp không hợp lệ.' });
  }

  const exercise = exercises.find((e) => e.id === exerciseSetId);
  if (!exercise) {
    return res.status(404).json({ error: 'Bài tập không hợp lệ' });
  }

  const actualStudentId = req.authUser!.role === 'student' ? req.authUser!.id : (req.body.studentId || req.authUser!.id);
  const actualStudentName = req.authUser!.role === 'student' ? req.authUser!.name : (req.body.studentName || req.authUser!.name);

  let totalCorrect = 0;
  const misconceptionTags: string[] = [];

  exercise.questions.forEach((q) => {
    const studentAns = answers[q.id];
    let isCorrect = false;

    if (q.type === 'single_choice') {
      isCorrect = studentAns !== undefined && studentAns !== null && Number(studentAns) === Number(q.correctAnswer);
    } else if (q.type === 'multi_choice') {
      if (Array.isArray(studentAns) && Array.isArray(q.correctAnswer)) {
        const sSorted = [...studentAns].map(Number).sort((a, b) => a - b);
        const cSorted = [...q.correctAnswer].map(Number).sort((a, b) => a - b);
        isCorrect = sSorted.length === cSorted.length && sSorted.every((v, idx) => v === cSorted[idx]);
      }
    } else if (q.type === 'true_false') {
      isCorrect = typeof studentAns === 'boolean' && studentAns === Boolean(q.correctAnswer);
    } else if (q.type === 'fill_blank' || q.type === 'step_math' || q.type === 'short_answer') {
      const cleanStudent = String(studentAns || '').trim().toLowerCase().replace(/\s+/g, '');
      const cleanCorrect = String(q.correctAnswer || '').trim().toLowerCase().replace(/\s+/g, '');
      isCorrect = cleanStudent.length > 0 && cleanStudent === cleanCorrect;
    } else if (q.type === 'matching') {
      if (typeof studentAns === 'object' && studentAns !== null) {
        const correctMap = q.correctAnswer as Record<string, string>;
        isCorrect = Object.keys(correctMap).every((key) => studentAns[key] === correctMap[key]);
      }
    }

    if (isCorrect) {
      totalCorrect += 1;
    } else {
      if (q.difficulty === 'van_dung' || q.difficulty === 'van_dung_cao') {
        misconceptionTags.push(`Vận dụng quy tắc: ${q.pedagogicalHint}`);
      } else {
        misconceptionTags.push(`Khái niệm cơ bản: ${q.pedagogicalHint}`);
      }
    }
  });

  const totalQuestions = exercise.questions.length;
  const score = totalQuestions > 0 ? Number(((totalCorrect / totalQuestions) * 10).toFixed(1)) : 10;
  const xpEarned = totalCorrect * 20 + 30;

  // Update student XP & sync into classrooms
  const student = users.find((u) => u.id === actualStudentId);
  if (student) {
    student.xp = (student.xp || 0) + xpEarned;
    for (const cls of classes) {
      const member = cls.students.find((s) => s.id === actualStudentId);
      if (member) {
        member.xp = student.xp;
      }
    }
  }

  // Update assignment completedCount only once per student per assignment
  if (assignmentId) {
    const alreadySubmittedAssignment = submissions.some(
      (s) => s.assignmentId === assignmentId && s.studentId === actualStudentId
    );
    const assign = assignments.find((a) => a.id === assignmentId);
    if (assign && !alreadySubmittedAssignment && assign.completedCount < assign.totalStudents) {
      assign.completedCount += 1;
    }
  }

  // Update Knowledge Node Mastery & Prerequisites Unlock
  if (exercise.lessonId) {
    const matchedNode = knowledgeNodes.find((k) => k.lessonId === exercise.lessonId);
    if (matchedNode) {
      matchedNode.masteryPercentage = Math.min(100, Math.max(matchedNode.masteryPercentage, Math.round(score * 10)));
      if (score >= 7) {
        matchedNode.status = 'mastered';
        matchedNode.nextNodes.forEach((nxtId) => {
          const nxtNode = knowledgeNodes.find((k) => k.id === nxtId);
          if (nxtNode && nxtNode.status === 'locked') {
            nxtNode.status = 'available';
          }
        });
      }
    }
  }

  let feedback = 'Làm bài rất tốt!';
  if (score === 10) {
    feedback = 'Tuyệt đối 10/10! Bạn là một bậc thầy nhỏ tuổi, Robot EduBot rất tự hào về bạn! 🌟';
  } else if (score >= 8) {
    feedback = `Khá xuất sắc (${score}/10)! Em đã nắm vững phần lớn kiến thức, hãy xem lại các lỗi nhỏ để đạt điểm tuyệt đối nhé!`;
  } else if (score >= 5) {
    feedback = `Cố gắng lắm (${score}/10)! EduBot đã ghi nhận nỗ lực của em. Cùng EduBot ôn tập lại các khái niệm chưa hiểu nhé!`;
  } else {
    feedback = `Không sao cả (${score}/10), thất bại là mẹ thành công! EduBot sẵn sàng cùng em luyện tập lại từng bước một.`;
  }

  const submission: StudentSubmission = {
    id: `sub-${Date.now()}`,
    assignmentId,
    exerciseSetId,
    studentId: actualStudentId,
    studentName: actualStudentName,
    grade: Number(grade) || exercise.grade,
    answers,
    score,
    totalCorrect,
    totalQuestions,
    completedAt: new Date().toISOString(),
    timeSpentSeconds: timeSpentSeconds || 60,
    feedback,
    misconceptionTags
  };

  submissions.unshift(submission);

  addAuditLog(
    'Nộp bài tập',
    req.authUser!.email,
    req.authUser!.role,
    `Hoàn thành bài tập "${exercise.title}" - Điểm: ${score}/10, nhận +${xpEarned} XP.`,
    'success'
  );

  res.json({
    success: true,
    submission,
    xpEarned,
    updatedXp: student?.xp
  });
});

// ----------------- CLASS & ASSIGNMENTS ROUTES -----------------
app.get('/api/classes', authenticateRequest, (_req: Request, res: Response) => {
  res.json(classes);
});

app.post('/api/classes', authenticateRequest, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { name, grade } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tên lớp học.' });
  }
  const numericGrade = Math.min(5, Math.max(1, Number(grade) || 4));
  const newClass: ClassRoom = {
    id: `class-${Date.now()}`,
    code: `EDU-${numericGrade}${String.fromCharCode(65 + Math.floor(Math.random() * 4))}${Math.floor(Math.random() * 9 + 1)}`,
    name: String(name).trim(),
    grade: numericGrade,
    teacherId: req.authUser!.id,
    teacherName: req.authUser!.name,
    studentCount: 0,
    academicYear: '2025 - 2026',
    students: []
  };
  classes.unshift(newClass);
  addAuditLog('Tạo lớp học', req.authUser!.email, req.authUser!.role, `Đã tạo lớp ${newClass.name} (Mã: ${newClass.code})`, 'success');
  res.status(201).json({ success: true, class: newClass });
});

app.post('/api/classes/join', authenticateRequest, requireRole('student', 'teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { code, classId, studentId, studentEmail } = req.body;
  const targetClass = classes.find((c) =>
    (classId && c.id === classId) ||
    (code && c.code.toUpperCase() === String(code).trim().toUpperCase())
  );
  if (!targetClass) {
    return res.status(404).json({ error: 'Mã lớp hoặc lớp học không hợp lệ.' });
  }

  let targetStudent: User | undefined;
  if (req.authUser!.role === 'student') {
    targetStudent = req.authUser!;
  } else if (studentId) {
    targetStudent = users.find((u) => u.id === studentId && u.role === 'student');
  } else if (studentEmail) {
    targetStudent = users.find((u) => u.email.toLowerCase() === String(studentEmail).trim().toLowerCase() && u.role === 'student');
  }

  if (!targetStudent) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản học sinh để thêm vào lớp.' });
  }

  const alreadyIn = targetClass.students.some((s) => s.id === targetStudent!.id);
  if (!alreadyIn) {
    targetClass.students.push({
      id: targetStudent.id,
      name: targetStudent.name,
      email: targetStudent.email,
      xp: targetStudent.xp || 100,
      progress: 0
    });
    targetClass.studentCount = Math.max(targetClass.studentCount, targetClass.students.length);
    addAuditLog(
      'Thêm học sinh vào lớp',
      req.authUser!.email,
      req.authUser!.role,
      `Học sinh ${targetStudent.name} đã tham gia lớp ${targetClass.name}.`,
      'info'
    );
  }

  res.json({ success: true, class: targetClass });
});

app.get('/api/assignments', authenticateRequest, (req: Request, res: Response) => {
  const { classId, grade } = req.query;
  let list = assignments;
  if (classId) list = list.filter((a) => a.classId === classId);
  if (grade) list = list.filter((a) => a.grade === Number(grade));
  res.json(list);
});

app.post('/api/assignments', authenticateRequest, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { classId, exerciseSetId, title, deadline } = req.body;
  const targetClass = classes.find((c) => c.id === classId);
  const exercise = exercises.find((e) => e.id === exerciseSetId);

  if (!targetClass || !exercise) {
    return res.status(400).json({ error: 'Thông tin lớp hoặc bộ bài tập không hợp lệ' });
  }

  const newAssignment: Assignment = {
    id: `assign-${Date.now()}`,
    classId: targetClass.id,
    className: targetClass.name,
    exerciseSetId: exercise.id,
    title: title || exercise.title,
    subjectId: exercise.subjectId,
    grade: exercise.grade,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
    assignedBy: req.authUser!.name,
    maxAttempts: 3,
    status: 'active',
    completedCount: 0,
    totalStudents: targetClass.studentCount
  };

  assignments.unshift(newAssignment);
  addAuditLog('Giao bài tập', req.authUser!.email, req.authUser!.role, `Giao bài "${newAssignment.title}" cho lớp ${targetClass.name}`, 'info');
  res.status(201).json({ success: true, assignment: newAssignment });
});

app.get('/api/submissions', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const { studentId, assignmentId } = req.query;
  let list = submissions;
  if (req.authUser!.role === 'student') {
    list = list.filter((s) => s.studentId === req.authUser!.id);
  } else if (studentId) {
    list = list.filter((s) => s.studentId === studentId);
  }
  if (assignmentId) list = list.filter((s) => s.assignmentId === assignmentId);
  res.json(list);
});

// ----------------- AI DRAFTS & CONTENT MANAGEMENT -----------------
app.get('/api/ai/drafts', authenticateRequest, requireRole('teacher', 'admin'), (_req: Request, res: Response) => {
  res.json(aiDrafts);
});

app.put('/api/ai/drafts/:id/review', authenticateRequest, requireRole('teacher', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, teacherNotes } = req.body;
  if (!['draft', 'approved', 'rejected', 'published'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái kiểm duyệt không hợp lệ.' });
  }
  const draft = aiDrafts.find((d) => d.id === id);
  if (!draft) {
    return res.status(404).json({ error: 'Bản nháp không tồn tại' });
  }
  draft.status = status;
  if (teacherNotes !== undefined) {
    draft.teacherNotes = String(teacherNotes);
  }

  addAuditLog(
    'Kiểm duyệt nội dung AI',
    req.authUser!.email,
    req.authUser!.role,
    `Đã cập nhật trạng thái "${status}" cho bản nháp "${draft.title}"`,
    status === 'rejected' ? 'warning' : 'success'
  );

  res.json({ success: true, draft });
});

// ----------------- AUDIT LOGS -----------------
app.get('/api/audit-logs', authenticateRequest, requireRole('admin'), (_req: Request, res: Response) => {
  res.json(auditLogs);
});

// ----------------- REAL GEMINI AI INTEGRATION -----------------
const GEMINI_TEXT_MODEL = 'gemini-4-hydrogen';

async function callGeminiSafe(params: { model: string; contents: any; config?: any }): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    const err: any = new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ.');
    err.statusCode = 503;
    err.isMissingKey = true;
    throw err;
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      const timeoutErr: any = new Error('Kết nối tới Gemini AI quá thời gian phản hồi.');
      timeoutErr.statusCode = 504;
      reject(timeoutErr);
    }, 25000)
  );

  const geminiPromise = (async () => {
    const res = await ai.models.generateContent(params);
    if (!res.text) {
      const emptyErr: any = new Error('Gemini AI không trả về nội dung văn bản.');
      emptyErr.statusCode = 502;
      throw emptyErr;
    }
    return res.text;
  })();

  return Promise.race([geminiPromise, timeoutPromise]);
}

function mapGeminiError(error: any): { status: number; message: string } {
  const status = error?.status || error?.statusCode || 502;
  const raw = String(error?.message || '');
  if (error?.isMissingKey) {
    return { status: 503, message: 'Máy chủ chưa được cấu hình GEMINI_API_KEY. Vui lòng thiết lập khóa trong Settings > Secrets.' };
  }
  if (status === 503 || raw.includes('UNAVAILABLE')) {
    return { status: 503, message: 'Dịch vụ Gemini AI tạm thời quá tải hoặc chưa khả dụng (503). Vui lòng thử lại sau ít giây.' };
  }
  if (status === 504) {
    return { status: 504, message: 'Hệ thống AI phản hồi chậm (timeout). Vui lòng thử lại sau ít giây.' };
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || status === 400 || status === 403) {
    return { status: 502, message: 'Khóa API Gemini không hợp lệ hoặc bị từ chối quyền. Vui lòng kiểm tra Settings > Secrets.' };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || status === 429) {
    return { status: 429, message: 'Đã vượt giới hạn lượt gọi Gemini AI hiện tại. Vui lòng thử lại sau ít phút.' };
  }
  return { status: 502, message: `Lỗi dịch vụ AI Gemini: ${raw || 'Không thể xử lý yêu cầu lúc này.'}` };
}

// 1. EduBot Student Tutor AI with RAG + History Persistence
app.get('/api/ai/student-chat/history', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  const history = studentChatHistories.get(req.authUser!.id) || [];
  res.json({ history });
});

app.delete('/api/ai/student-chat/history', authenticateRequest, (req: AuthenticatedRequest, res: Response) => {
  studentChatHistories.delete(req.authUser!.id);
  res.json({ success: true });
});

app.post('/api/ai/student-chat', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  const { message, grade = 4, subject = 'toan', currentLessonId } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi gửi EduBot.' });
  }

  // RAG Retrieval strictly from VERIFIED curriculum lessons when possible
  const verifiedLessons = lessons.filter((l) => l.status === 'verified');
  const relevantLessons = verifiedLessons.filter(
    (l) => l.grade === Number(grade) && (l.subjectId === subject || !subject)
  );
  const matchedLesson =
    verifiedLessons.find((l) => l.id === currentLessonId) || relevantLessons[0];

  const contextSnippet = matchedLesson
    ? `[HỌC LIỆU ĐÃ THẨM ĐỊNH - ${matchedLesson.officialReference.docNumber}]
Tên bài: ${matchedLesson.title} (Mã: ${matchedLesson.lessonCode}, Môn: ${matchedLesson.subjectId}, Lớp: ${matchedLesson.grade})
Yêu cầu cần đạt: ${matchedLesson.objectives.join('; ')}
Kiến thức cốt lõi: ${matchedLesson.coreKnowledge.join('; ')}
Lỗi học sinh thường gặp: ${matchedLesson.commonMisconceptions.join('; ')}
Nguồn thẩm định: ${matchedLesson.officialReference.docNumber} (${matchedLesson.status})`
    : 'Chưa có bài học cụ thể trong kho học liệu đã thẩm định cho môn/lớp này — nếu câu hỏi nằm ngoài tài liệu chuẩn, hãy nói rõ giới hạn và hướng dẫn em hỏi thầy cô giáo.';

  const safetyRule = systemSettings.childSafetyFilterEnabled
    ? `4. BẢO MẬT & AN TOÀN TRẺ EM (ĐANG BẬT BẮT BUỘC):
   - Nghiêm cấm hỏi hoặc yêu cầu học sinh cung cấp: họ tên thật của phụ huynh, số điện thoại, mật khẩu, địa chỉ nhà riêng.
   - Nếu học sinh hỏi chủ đề bạo lực, nguy hại hoặc không lành mạnh cho trẻ em: từ chối lịch sự và khuyên bạn nhỏ tâm sự cùng thầy cô hoặc bố mẹ.`
    : '';

  const systemInstruction = `Bạn là EduBot - Mascot Robot 3D gia sư thông minh, ấm áp và siêu đáng yêu dành cho học sinh tiểu học Việt Nam (Lớp 1 đến Lớp 5).
Nhiệm vụ: Giúp học sinh hiểu bài, ham thích học tập, tư duy độc lập và yêu mến kiến thức.

QUY TẮC SƯ PHẠM BẮT BUỘC:
1. Xưng hô: Tự xưng là "EduBot" hoặc "tớ", gọi học sinh là "bạn nhỏ" hoặc "bạn" thân mật, vui vẻ (dùng emoji robot 🤖, ngôi sao ⭐, tia chớp ⚡ phù hợp).
2. Khi học sinh hỏi bài tập: TUYỆT ĐỐI KHÔNG giải hộ hay đưa ngay đáp số! Hãy dùng phương pháp gợi mở:
   - Khen ngợi câu hỏi của bé.
   - Nêu một ví dụ đời sống thật gần gũi (chiếc bánh, cái kẹo, robot nạp năng lượng).
   - Đặt 1 câu hỏi gợi ý nhỏ để học sinh tự suy nghĩ và trả lời bước tiếp theo.
3. Khi học sinh trả lời sai hoặc chưa hiểu: Động viên nhẹ nhàng, giải thích bằng lời văn cực kỳ dễ hiểu, chia nhỏ từng bước. Không bao giờ chê bai.
${safetyRule}
5. Luôn bám sát ngữ cảnh kiến thức chuẩn được cung cấp dưới đây (trình bày ngắn gọn, rõ ràng):
${contextSnippet}`;

  const priorHistory = studentChatHistories.get(req.authUser!.id) || [];
  const recentTurns = priorHistory.slice(-6).map((m) => `${m.sender === 'student' ? 'Học sinh' : 'EduBot'}: ${m.text}`).join('\n');
  const fullPrompt = recentTurns
    ? `Lịch sử trò chuyện gần đây:\n${recentTurns}\n\nCâu hỏi mới của học sinh Lớp ${grade}:\n${String(message).trim()}`
    : String(message).trim();

  try {
    const replyText = await callGeminiSafe({
      model: GEMINI_TEXT_MODEL,
      contents: fullPrompt,
      config: { systemInstruction }
    });

    const userMsg: AiChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: String(message).trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const suggestedPrompts = matchedLesson
      ? [
          `EduBot cho tớ một ví dụ dễ hiểu hơn về "${matchedLesson.title}" nhé!`,
          'Tớ muốn làm thử một câu đố nhỏ!',
          'Tại sao lại có quy tắc này vậy EduBot?'
        ]
      : [
          'EduBot giải thích lại bước đầu tiên giúp tớ nhé!',
          'Cho tớ một ví dụ thực tế đi EduBot!'
        ];

    const botMsg: AiChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'edubot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      robotExpression: 'happy',
      referencedLessons: matchedLesson ? [matchedLesson.title] : [],
      suggestedPrompts
    };

    studentChatHistories.set(req.authUser!.id, [...priorHistory, userMsg, botMsg]);

    addAuditLog(
      'Hỏi đáp Gia sư EduBot',
      req.authUser!.email,
      req.authUser!.role,
      `Hỏi đáp môn ${subject} (Lớp ${grade})${matchedLesson ? ` - căn cứ bài "${matchedLesson.title}"` : ''}`,
      'info'
    );

    res.json({
      text: replyText,
      robotExpression: 'happy',
      referencedLessons: matchedLesson ? [matchedLesson.title] : [],
      suggestedPrompts,
      userMessage: userMsg,
      botMessage: botMsg
    });
  } catch (error: any) {
    console.error('Gemini error in student-chat:', error?.message);
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

// 2. EduBot Teacher AI - Lesson Plan Generator
app.post('/api/ai/teacher/lesson-plan', authenticateRequest, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      grade = 4,
      subject = 'toan',
      lessonName,
      duration = '35 phút',
      teachingMethod = 'Dạy học tích cực & Bàn tay nặn bột',
      objectives
    } = req.body;

    if (!lessonName || !String(lessonName).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên bài dạy.' });
    }

    const systemInstruction = `Bạn là Chuyên gia Phương pháp Dạy học Tiểu học và Trợ lý AI Giáo viên Việt Nam (EduBot Teacher AI).
Nhiệm vụ: Soạn Kế hoạch bài dạy (Giáo án) theo chuẩn Thông tư 32/2018/TT-BGDĐT và Công văn số 2345/BGDĐT-GDTH của Bộ Giáo dục và Đào tạo.

Kế hoạch bài dạy cần cấu trúc rõ ràng:
I. YÊU CẦU CẦN ĐẠT (Kiến thức cốt lõi, Năng lực chung & đặc thù môn học, Phẩm chất: chăm chỉ, trung thực, trách nhiệm)
II. ĐỒ DÙNG DẠY HỌC (Giáo viên, Học sinh, Ứng dụng công nghệ/AI EduBot)
III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:
  1. Hoạt động Khởi động (kết nối) - 5 phút
  2. Hoạt động Khám phá hình thành kiến thức mới - 12 phút
  3. Hoạt động Luyện tập, thực hành - 13 phút
  4. Hoạt động Vận dụng, trải nghiệm - 5 phút
(Mỗi hoạt động nêu rõ: Mục tiêu, Cách thức tổ chức hoạt động, Sản phẩm của học sinh, Tiêu chí đánh giá)
IV. ĐIỀU CHỈNH SAU BÀI DẠY VÀ PHƯƠNG ÁN HỖ TRỢ HỌC SINH CẦN GIÚP ĐỠ.

LƯU Ý: Đánh dấu rõ đây là BẢN NHÁP DO AI HỖ TRỢ SOẠN, giáo viên chủ động điều chỉnh phù hợp thực tế lớp học.`;

    const prompt = `Soạn Kế hoạch bài dạy chi tiết cho:
- Môn học: ${subject}
- Khối lớp: Lớp ${grade}
- Tên bài dạy: ${lessonName}
- Thời lượng: ${duration}
- Phương pháp dạy học ưu tiên: ${teachingMethod}
- Gợi ý yêu cầu cần đạt: ${objectives || 'Chuẩn CTGDPT 2018/2026'}`;

    const generatedPlan = await callGeminiSafe({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { systemInstruction }
    });

    const newDraft: AiDraftItem = {
      id: `draft-plan-${Date.now()}`,
      type: 'lesson_plan',
      title: `Kế hoạch bài dạy: ${lessonName} - Khối ${grade}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: `${req.authUser!.name} (EduBot Teacher AI)`,
      status: 'draft',
      content: {
        text: generatedPlan,
        lessonName,
        grade,
        duration,
        teachingMethod
      }
    };

    aiDrafts.unshift(newDraft);
    addAuditLog('AI Soạn bài giảng', req.authUser!.email, req.authUser!.role, `AI tạo bản nháp KHBD "${newDraft.title}"`, 'success');
    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error generating lesson plan:', error?.message);
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

// 3. EduBot Teacher AI - Knowledge Standardization
app.post('/api/ai/teacher/standardize-knowledge', authenticateRequest, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rawContent, grade = 4, subject = 'toan', lessonTitle } = req.body;
    if (!rawContent || !String(rawContent).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung cần chuẩn hóa.' });
    }

    const systemInstruction = `Bạn là Chuyên gia Thẩm định Chương trình Giáo dục Tiểu học Việt Nam.
Nhiệm vụ: Đối chiếu văn bản kiến thức do giáo viên cung cấp với Chương trình Giáo dục Phổ thông 2018 (Thông tư 32/2018/TT-BGDĐT và các văn bản cập nhật 2025/2026).
Phân tích chi tiết và trả về:
1. Thuật ngữ cốt lõi đã được chuẩn hóa theo độ tuổi học sinh Lớp ${grade}.
2. Phát hiện mâu thuẫn, lỗi diễn đạt hoặc điểm thiếu căn cứ sư phạm.
3. Bảng đối chiếu: [Nội dung gốc] | [Nội dung đề xuất chỉnh sửa] | [Lý do sư phạm & Căn cứ chuẩn].
4. Bản tóm tắt kiến thức chuẩn ngắn gọn dành cho học sinh.`;

    const prompt = `Đối chiếu và chuẩn hóa nội dung bài học:
- Tên bài: ${lessonTitle || 'Kiến thức chung'}
- Môn: ${subject}, Khối Lớp: ${grade}
- Nội dung gốc cần thẩm định:
"${rawContent}"`;

    const standardizedResult = await callGeminiSafe({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { systemInstruction }
    });

    const newDraft: AiDraftItem = {
      id: `draft-std-${Date.now()}`,
      type: 'standardized_knowledge',
      title: `Chuẩn hóa kiến thức: ${lessonTitle || 'Tài liệu học tập'}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: `${req.authUser!.name} (EduBot Standardizer)`,
      status: 'draft',
      content: {
        rawContent,
        analysis: standardizedResult,
        statusLabel: 'Chờ giáo viên duyệt áp dụng'
      }
    };

    aiDrafts.unshift(newDraft);
    addAuditLog('AI Chuẩn hóa kiến thức', req.authUser!.email, req.authUser!.role, `AI tạo báo cáo chuẩn hóa "${newDraft.title}"`, 'success');
    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error in standardize-knowledge:', error?.message);
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

// 4. EduBot Teacher AI - Question & Exam Matrix Generator
app.post('/api/ai/teacher/generate-quiz', authenticateRequest, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      grade = 4,
      subject = 'toan',
      topic = 'Phân số',
      questionCount = 4,
      cognitiveLevels = ['nhan_biet', 'thong_hieu', 'van_dung']
    } = req.body;

    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập chủ đề đề kiểm tra.' });
    }

    const systemInstruction = `Bạn là Trợ lý Khảo thí & Đánh giá Giáo dục Tiểu học EduBot.
Nhiệm vụ: Tạo ma trận đề và bộ câu hỏi đánh giá theo chuẩn 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) bám sát CTGDPT Việt Nam.
Tạo các câu hỏi trắc nghiệm khách quan và tự luận có kèm đáp án, lời giải chi tiết và gợi ý dẫn dắt sư phạm cho học sinh.`;

    const prompt = `Hãy tạo bộ ${questionCount} câu hỏi kiểm tra cho:
Môn: ${subject}, Khối: Lớp ${grade}, Chủ đề: ${topic}.
Các mức độ nhận thức cần bao phủ: ${Array.isArray(cognitiveLevels) ? cognitiveLevels.join(', ') : cognitiveLevels}.
Yêu cầu gồm câu hỏi trắc nghiệm, đúng/sai, điền khuyết và toán thực tế có lời giải từng bước.`;

    const generatedQuizText = await callGeminiSafe({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { systemInstruction }
    });

    const newDraft: AiDraftItem = {
      id: `draft-quiz-${Date.now()}`,
      type: 'quiz_matrix',
      title: `Bộ đề & Ma trận kiểm tra: ${topic} - Lớp ${grade}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: `${req.authUser!.name} (EduBot Exam Generator)`,
      status: 'draft',
      content: {
        text: generatedQuizText,
        questionCount,
        topic
      }
    };

    aiDrafts.unshift(newDraft);
    addAuditLog('AI Tạo đề kiểm tra', req.authUser!.email, req.authUser!.role, `AI tạo bộ đề "${newDraft.title}"`, 'success');
    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error in generate-quiz:', error?.message);
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

// ----------------- ANALYTICS & DASHBOARDS -----------------
app.get('/api/analytics/overview', (_req: Request, res: Response) => {
  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalTeachers = users.filter((u) => u.role === 'teacher').length;
  const totalLessons = lessons.length;
  const totalSubmissions = submissions.length;
  const avgScore = submissions.length > 0
    ? Number((submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length).toFixed(1))
    : 0;
  const pendingReviews = aiDrafts.filter((d) => d.status === 'draft').length;

  res.json({
    totalStudents,
    totalTeachers,
    totalLessons,
    totalSubmissions,
    avgScore,
    pendingReviews,
    curriculumVersion: 'CTGDPT-2018 (TT 32/2018 & TT 17/2025/TT-BGDĐT)',
    aiModel: GEMINI_TEXT_MODEL,
    aiStatus: process.env.GEMINI_API_KEY ? 'active' : 'unconfigured',
    persistenceMode: 'in_memory'
  });
});

// ----------------- VITE SERVER INTEGRATION (DEV & PROD) -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`EduBot AI server running on port ${PORT}`);
  });
}

startServer();
