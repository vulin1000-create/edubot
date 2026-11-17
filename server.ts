/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
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
  CurriculumSubject,
  CurriculumTopic,
  Lesson,
  ExerciseSet,
  ClassRoom,
  Assignment,
  StudentSubmission,
  AiDraftItem,
  AuditLog,
  KnowledgeNode
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-Memory Database Store
let users: User[] = [...initialUsers];
let subjects: CurriculumSubject[] = [...initialSubjects];
let topics: CurriculumTopic[] = [...initialTopics];
let lessons: Lesson[] = [...initialLessons];
let exercises: ExerciseSet[] = [...initialExercises];
let classes: ClassRoom[] = [...initialClasses];
let assignments: Assignment[] = [...initialAssignments];
let submissions: StudentSubmission[] = [...initialSubmissions];
let aiDrafts: AiDraftItem[] = [...initialDrafts];
let auditLogs: AuditLog[] = [...initialAuditLogs];
let knowledgeNodes: KnowledgeNode[] = [...initialKnowledgeNodes];
let systemSettings = {
  childSafetyFilterEnabled: true,
  parentalConsentRequired: true,
  dataRetentionDays: 365,
  aiMaxTokensPerDay: 50000,
  curriculumStandard: 'Thông tư 32/2018/TT-BGDĐT & TT 17/2025/TT-BGDĐT',
  curriculumVersionYear: 2026,
  maintenanceMode: false
};

// Gemini AI Client Initialization (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function addAuditLog(action: string, user: string, role: string, details: string, status: 'success' | 'warning' | 'info' = 'info') {
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
  const { email, role } = req.body;
  let user = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  
  if (!user && role) {
    // If not found, find first user with requested role or create session
    user = users.find(u => u.role === role);
  }

  if (!user) {
    user = users[1]; // default to teacher
  }

  res.json({ success: true, user });
});

app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { role, grade } = req.body;
  let targetUser = users.find(u => u.role === role);
  if (role === 'student' && grade) {
    const studentWithGrade = users.find(u => u.role === 'student' && u.grade === Number(grade));
    if (studentWithGrade) targetUser = studentWithGrade;
  }
  
  if (!targetUser) {
    targetUser = users[0];
  }
  res.json({ success: true, user: targetUser });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, grade, school } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ họ tên và email.' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email này đã được đăng ký tài khoản.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    role: role || 'student',
    grade: role === 'student' ? Number(grade) || 4 : undefined,
    school: school || 'Trường Tiểu học Thăng Long',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    xp: 100,
    streakDays: 1,
    badges: ['Tân binh EduBot'],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  addAuditLog(
    'Đăng ký tài khoản mới',
    newUser.email,
    newUser.role,
    `Người dùng ${newUser.name} đã đăng ký tài khoản vai trò ${newUser.role}`,
    'success'
  );

  res.json({ success: true, user: newUser });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này trong hệ thống.' });
  }

  addAuditLog(
    'Yêu cầu đặt lại mật khẩu',
    user.email,
    user.role,
    `Mã xác nhận bảo mật OTP 6 chữ số đã được gửi tới ${user.email}`,
    'info'
  );

  res.json({
    success: true,
    message: `Mã OTP xác thực đã được gửi về email ${email}. Vui lòng nhập mã để hoàn tất đổi mật khẩu.`
  });
});

app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json(users);
});

// ----------------- KNOWLEDGE MAP ROUTE -----------------
app.get('/api/knowledge-map', (req: Request, res: Response) => {
  const { grade, subjectId } = req.query;
  let list = knowledgeNodes;
  if (grade) list = list.filter(k => k.grade === Number(grade));
  if (subjectId) list = list.filter(k => k.subjectId === subjectId);
  res.json(list);
});

// ----------------- SYSTEM SETTINGS & PRIVACY -----------------
app.get('/api/system/settings', (req: Request, res: Response) => {
  res.json(systemSettings);
});

app.put('/api/system/settings', (req: Request, res: Response) => {
  systemSettings = { ...systemSettings, ...req.body };
  addAuditLog(
    'Cập nhật cấu hình hệ thống',
    'admin@edubot.edu.vn',
    'admin',
    'Đã cập nhật chính sách an toàn trẻ em và cấu hình hệ thống GDPT 2026',
    'warning'
  );
  res.json({ success: true, settings: systemSettings });
});

// ----------------- STUDENT PERFORMANCE DETAIL -----------------
app.get('/api/students/:id/performance', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = users.find(u => u.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const studentSubmissions = submissions.filter(s => s.studentId === id);
  const avgScore = studentSubmissions.length > 0
    ? Number((studentSubmissions.reduce((a, b) => a + b.score, 0) / studentSubmissions.length).toFixed(1))
    : 10;

  const masteredNodes = knowledgeNodes.filter(k => k.status === 'mastered');
  const availableNodes = knowledgeNodes.filter(k => k.status === 'available');

  res.json({
    student,
    totalSubmissions: studentSubmissions.length,
    avgScore,
    xp: student.xp || 850,
    streakDays: student.streakDays || 7,
    badges: student.badges || [],
    masteredNodesCount: masteredNodes.length,
    inProgressNodesCount: availableNodes.length,
    recentSubmissions: studentSubmissions.slice(0, 5),
    recommendedNextLesson: lessons.find(l => l.grade === (student.grade || 4))?.title || 'Phân số bằng nhau'
  });
});

// ----------------- CURRICULUM ROUTES -----------------
app.get('/api/curriculum/subjects', (req: Request, res: Response) => {
  const grade = req.query.grade ? Number(req.query.grade) : null;
  if (grade) {
    const filtered = subjects.filter(s => s.grades.includes(grade));
    return res.json(filtered);
  }
  res.json(subjects);
});

app.get('/api/curriculum/topics', (req: Request, res: Response) => {
  const { subjectId, grade } = req.query;
  let list = topics;
  if (subjectId) list = list.filter(t => t.subjectId === subjectId);
  if (grade) list = list.filter(t => t.grade === Number(grade));
  res.json(list);
});

app.get('/api/curriculum/lessons', (req: Request, res: Response) => {
  const { subjectId, grade, status } = req.query;
  let list = lessons;
  if (subjectId) list = list.filter(l => l.subjectId === subjectId);
  if (grade) list = list.filter(l => l.grade === Number(grade));
  if (status) list = list.filter(l => l.status === status);
  res.json(list);
});

app.get('/api/curriculum/lessons/:id', (req: Request, res: Response) => {
  const lesson = lessons.find(l => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ error: 'Không tìm thấy bài học' });
  }
  res.json(lesson);
});

app.put('/api/curriculum/lessons/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reviewedBy } = req.body;
  const lessonIndex = lessons.findIndex(l => l.id === id);
  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Bài học không tồn tại' });
  }
  lessons[lessonIndex].status = status;
  addAuditLog(
    'Thẩm định bài học',
    reviewedBy || 'Quản trị viên',
    'admin',
    `Đổi trạng thái bài học ${lessons[lessonIndex].title} thành ${status}`,
    'success'
  );
  res.json({ success: true, lesson: lessons[lessonIndex] });
});

// ----------------- EXERCISES & ASSIGNMENTS ROUTES -----------------
app.get('/api/exercises', (req: Request, res: Response) => {
  const { subjectId, grade, lessonId } = req.query;
  let list = exercises;
  if (subjectId) list = list.filter(e => e.subjectId === subjectId);
  if (grade) list = list.filter(e => e.grade === Number(grade));
  if (lessonId) list = list.filter(e => e.lessonId === lessonId);
  res.json(list);
});

app.get('/api/exercises/:id', (req: Request, res: Response) => {
  const exercise = exercises.find(e => e.id === req.params.id);
  if (!exercise) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }
  res.json(exercise);
});

app.post('/api/exercises/submit', (req: Request, res: Response) => {
  const { exerciseSetId, studentId, studentName, grade, answers, timeSpentSeconds, assignmentId } = req.body;
  const exercise = exercises.find(e => e.id === exerciseSetId);
  if (!exercise) {
    return res.status(404).json({ error: 'Bài tập không hợp lệ' });
  }

  let totalCorrect = 0;
  const misconceptionTags: string[] = [];

  exercise.questions.forEach((q) => {
    const studentAns = answers[q.id];
    let isCorrect = false;

    if (q.type === 'single_choice') {
      isCorrect = Number(studentAns) === Number(q.correctAnswer);
    } else if (q.type === 'true_false') {
      isCorrect = Boolean(studentAns) === Boolean(q.correctAnswer);
    } else if (q.type === 'fill_blank' || q.type === 'step_math' || q.type === 'short_answer') {
      const cleanStudent = String(studentAns || '').trim().toLowerCase().replace(/\s+/g, '');
      const cleanCorrect = String(q.correctAnswer || '').trim().toLowerCase().replace(/\s+/g, '');
      isCorrect = cleanStudent === cleanCorrect;
    } else if (q.type === 'matching') {
      // Matching compare keys
      if (typeof studentAns === 'object' && studentAns !== null) {
        const correctMap = q.correctAnswer as Record<string, string>;
        const matchAll = Object.keys(correctMap).every(key => studentAns[key] === correctMap[key]);
        isCorrect = matchAll;
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
  const xpEarned = totalCorrect * 20 + 30; // bonus completion XP

  // Update student XP & streak in user store
  const student = users.find(u => u.id === studentId);
  if (student) {
    student.xp = (student.xp || 0) + xpEarned;
  }

  // Update assignment completed count if assigned
  if (assignmentId) {
    const assign = assignments.find(a => a.id === assignmentId);
    if (assign && assign.completedCount < assign.totalStudents) {
      assign.completedCount += 1;
    }
  }

  // Update Knowledge Node Mastery & Prerequisites Unlock
  if (exercise.lessonId) {
    const matchedNode = knowledgeNodes.find(k => k.lessonId === exercise.lessonId);
    if (matchedNode) {
      matchedNode.masteryPercentage = Math.min(100, Math.max(matchedNode.masteryPercentage, Math.round(score * 10)));
      if (score >= 7) {
        matchedNode.status = 'mastered';
        // unlock next nodes in the graph
        matchedNode.nextNodes.forEach(nxtId => {
          const nxtNode = knowledgeNodes.find(k => k.id === nxtId);
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
    studentId,
    studentName: studentName || 'Học sinh',
    grade: Number(grade) || 4,
    answers,
    score,
    totalCorrect,
    totalQuestions,
    completedAt: new Date().toISOString(),
    timeSpentSeconds: timeSpentSeconds || 180,
    feedback,
    misconceptionTags
  };

  submissions.unshift(submission);

  addAuditLog(
    'Nộp bài tập',
    studentName || 'Học sinh',
    'student',
    `Hoàn thành bài tập "${exercise.title}" - Điểm: ${score}/10, nhận +${xpEarned} XP.`,
    'success'
  );

  res.json({
    success: true,
    submission,
    xpEarned
  });
});

// ----------------- CLASS & ASSIGNMENTS ROUTES -----------------
app.get('/api/classes', (req: Request, res: Response) => {
  res.json(classes);
});

app.post('/api/classes', (req: Request, res: Response) => {
  const { name, grade, teacherId, teacherName } = req.body;
  const newClass: ClassRoom = {
    id: `class-${Date.now()}`,
    code: `EDU-${grade}${String.fromCharCode(65 + Math.floor(Math.random() * 4))}${Math.floor(Math.random() * 9 + 1)}`,
    name,
    grade: Number(grade),
    teacherId: teacherId || 'user-teacher-1',
    teacherName: teacherName || 'Cô Nguyễn Mai',
    studentCount: 1,
    academicYear: '2025 - 2026',
    students: [
      { id: 'user-student-1', name: 'Hoàng Tuấn', email: 'tuan.nh@edubot.edu.vn', xp: 850, progress: 85 }
    ]
  };
  classes.unshift(newClass);
  addAuditLog('Tạo lớp học', teacherName || 'Giáo viên', 'teacher', `Đã tạo lớp ${newClass.name} (Mã: ${newClass.code})`, 'success');
  res.json({ success: true, class: newClass });
});

app.post('/api/classes/join', (req: Request, res: Response) => {
  const { code, studentId, studentName, email } = req.body;
  const targetClass = classes.find(c => c.code.toUpperCase() === String(code || '').trim().toUpperCase());
  if (!targetClass) {
    return res.status(404).json({ error: 'Mã lớp không hợp lệ hoặc lớp không tồn tại!' });
  }

  const alreadyIn = targetClass.students.some(s => s.id === studentId);
  if (!alreadyIn) {
    targetClass.students.push({
      id: studentId || `stu-${Date.now()}`,
      name: studentName || 'Học sinh mới',
      email: email || 'student@school.edu.vn',
      xp: 100,
      progress: 10
    });
    targetClass.studentCount = targetClass.students.length;
  }

  res.json({ success: true, class: targetClass });
});

app.get('/api/assignments', (req: Request, res: Response) => {
  const { classId, grade } = req.query;
  let list = assignments;
  if (classId) list = list.filter(a => a.classId === classId);
  if (grade) list = list.filter(a => a.grade === Number(grade));
  res.json(list);
});

app.post('/api/assignments', (req: Request, res: Response) => {
  const { classId, exerciseSetId, title, deadline, assignedBy } = req.body;
  const targetClass = classes.find(c => c.id === classId);
  const exercise = exercises.find(e => e.id === exerciseSetId);

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
    assignedBy: assignedBy || 'Giáo viên',
    maxAttempts: 3,
    status: 'active',
    completedCount: 0,
    totalStudents: targetClass.studentCount
  };

  assignments.unshift(newAssignment);
  addAuditLog('Giao bài tập', assignedBy || 'Giáo viên', 'teacher', `Giao bài "${newAssignment.title}" cho lớp ${targetClass.name}`, 'info');
  res.json({ success: true, assignment: newAssignment });
});

app.get('/api/submissions', (req: Request, res: Response) => {
  const { studentId, assignmentId } = req.query;
  let list = submissions;
  if (studentId) list = list.filter(s => s.studentId === studentId);
  if (assignmentId) list = list.filter(s => s.assignmentId === assignmentId);
  res.json(list);
});

// ----------------- AI DRAFTS & CONTENT MANAGEMENT -----------------
app.get('/api/ai/drafts', (req: Request, res: Response) => {
  res.json(aiDrafts);
});

app.put('/api/ai/drafts/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, teacherNotes, reviewer } = req.body;
  const draft = aiDrafts.find(d => d.id === id);
  if (!draft) {
    return res.status(404).json({ error: 'Bản nháp không tồn tại' });
  }
  draft.status = status;
  if (teacherNotes) draft.teacherNotes = teacherNotes;

  addAuditLog(
    'Kiểm duyệt nội dung AI',
    reviewer || 'Giáo viên',
    'teacher',
    `Đã phê duyệt trạng thái "${status}" cho bản nháp "${draft.title}"`,
    'success'
  );

  res.json({ success: true, draft });
});

// ----------------- AUDIT LOGS -----------------
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(auditLogs);
});

// ----------------- REAL GEMINI AI INTEGRATION -----------------

// Safe Gemini caller with timeout
async function callGeminiSafe(params: any): Promise<string> {
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
  );
  const geminiPromise = (async () => {
    const res = await ai.models.generateContent(params);
    return res.text || '';
  })();
  return Promise.race([geminiPromise, timeoutPromise]);
}

// 1. EduBot Student Tutor AI with RAG
app.post('/api/ai/student-chat', async (req: Request, res: Response) => {
  const { message, grade = 4, subject = 'toan', currentLessonId } = req.body;

  // RAG Retrieval: find matching curriculum lessons
  const relevantLessons = lessons.filter(l => l.grade === Number(grade) && (l.subjectId === subject || !subject));
  const matchedLesson = lessons.find(l => l.id === currentLessonId) || relevantLessons[0];

  const contextSnippet = matchedLesson
    ? `[HỌC LIỆU CHUẨN THÔNG TƯ 32/2018 & TT 17/2025/TT-BGDĐT]
Tên bài: ${matchedLesson.title} (Mã: ${matchedLesson.lessonCode}, Môn: ${matchedLesson.subjectId}, Lớp: ${matchedLesson.grade})
Yêu cầu cần đạt: ${matchedLesson.objectives.join('; ')}
Kiến thức cốt lõi: ${matchedLesson.coreKnowledge.join('; ')}
Lỗi học sinh thường gặp: ${matchedLesson.commonMisconceptions.join('; ')}
Nguồn thẩm định: ${matchedLesson.officialReference.docNumber} (${matchedLesson.status})`
    : 'Chương trình Tiểu học tổng thể năm 2026.';

  const systemInstruction = `Bạn là EduBot - Mascot Robot 3D gia sư thông minh, ấm áp và siêu đáng yêu dành cho học sinh tiểu học Việt Nam (Lớp 1 đến Lớp 5).
Nhiệm vụ: Giúp học sinh hiểu bài, ham thích học tập, tư duy độc lập và yêu mến kiến thức.

QUY TẮC SƯ PHẠM BẮT BUỘC:
1. Xưng hô: Tự xưng là "EduBot" hoặc "tớ", gọi học sinh là "bạn nhỏ" hoặc "bạn" thân mật, vui vẻ (dùng emoji robot 🤖, ngôi sao ⭐, tia chớp ⚡ phù hợp).
2. Khi học sinh hỏi bài tập: TUYỆT ĐỐI KHÔNG giải hộ hay đưa ngay đáp số! Hãy dùng phương pháp gợi mở:
   - Khen ngợi câu hỏi của bé.
   - Nêu một ví dụ đời sống thật gần gũi (chiếc bánh, cái kẹo, robot nạp năng lượng).
   - Đặt 1 câu hỏi gợi ý nhỏ để học sinh tự suy nghĩ và trả lời bước tiếp theo.
3. Khi học sinh trả lời sai hoặc chưa hiểu: Động viên nhẹ nhàng, giải thích bằng lời văn cực kỳ dễ hiểu, chia nhỏ từng bước. Không bao giờ chê bai.
4. BẢO MẬT & AN TOÀN TRẺ EM:
   - Nghiêm cấm hỏi hoặc yêu cầu học sinh cung cấp: họ tên thật của phụ huynh, số điện thoại, mật khẩu, địa chỉ nhà riêng.
   - Nếu học sinh hỏi chủ đề bạo lực, nguy hại hoặc không lành mạnh cho trẻ em: từ chối lịch sự và khuyên bạn nhỏ tâm sự cùng thầy cô hoặc bố mẹ.
5. Luôn bám sát ngữ cảnh kiến thức chuẩn được cung cấp dưới đây:
${contextSnippet}`;

  try {
    let replyText = '';
    if (process.env.GEMINI_API_KEY) {
      replyText = await callGeminiSafe({
        model: 'gemini-3.8-flash',
        contents: message,
        config: { systemInstruction }
      });
    }

    if (!replyText) {
      replyText = `Chào bạn nhỏ! 🤖 EduBot rất vui được đồng hành cùng bạn học bài "${matchedLesson?.title || 'Toán học vui'}".
Với câu hỏi của bạn: "${message}", tớ có một gợi ý nho nhỏ: Bạn hãy nhớ lại quy tắc tử số và mẫu số nhé. Mẫu số chỉ tổng số phần, còn tử số chỉ số phần được lấy. Bạn thử áp dụng xem sao nhé!`;
    }

    res.json({
      text: replyText,
      robotExpression: 'happy',
      referencedLessons: matchedLesson ? [matchedLesson.title] : [],
      suggestedPrompts: [
        'EduBot cho tớ một ví dụ dễ hiểu hơn được không?',
        'Tớ muốn làm thử một câu đố luyện tập!',
        'Tại sao lại có quy tắc này vậy EduBot?'
      ]
    });
  } catch (error: any) {
    console.error('Error or fallback in student-chat:', error?.message);
    res.json({
      text: `Chào bạn nhỏ! 🤖 EduBot đây! Với bài "${matchedLesson?.title || 'Bài học'}", bạn hãy nhớ: Hãy đọc kỹ yêu cầu cần đạt và thử phân tích từ từ từng bước nhé. Tớ luôn ở đây cùng bạn!`,
      robotExpression: 'explaining',
      referencedLessons: matchedLesson ? [matchedLesson.title] : [],
      suggestedPrompts: [
        'Cho tớ một ví dụ thực tế đi EduBot!',
        'Quy tắc này áp dụng thế nào?',
        'Tóm tắt bài học giúp tớ!'
      ]
    });
  }
});

// 2. EduBot Teacher AI - Lesson Plan Generator (Soạn KHBD / Giáo án)
app.post('/api/ai/teacher/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { grade = 4, subject = 'toan', lessonName, duration = '35 phút', teachingMethod = 'Dạy học tích cực & Bàn tay nặn bột', objectives } = req.body;

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
- Tên bài dạy: ${lessonName || 'Phân số bằng nhau và rút gọn phân số'}
- Thời lượng: ${duration}
- Phương pháp dạy học ưu tiên: ${teachingMethod}
- Gợi ý yêu cầu cần đạt: ${objectives || 'Chuẩn CTGDPT 2018/2026'}`;

    let generatedPlan = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        generatedPlan = await callGeminiSafe({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { systemInstruction }
        });
      } catch (err: any) {
        console.error('Gemini fallback in lesson plan:', err?.message);
      }
    }

    if (!generatedPlan) {
      generatedPlan = `KẾ HOẠCH BÀI DẠY (BẢN NHÁP AI - CHUẨN CÔNG VĂN 2345/BGDĐT)
Môn: ${subject.toUpperCase()} - Khối ${grade}
Tên bài: ${lessonName}
Thời lượng: ${duration}

I. YÊU CẦU CẦN ĐẠT:
1. Năng lực toán học: Nhận biết bản chất khái niệm, vận dụng tính chất cơ bản để tìm các biểu diễn tương đương.
2. Năng lực chung: Tự chủ và tự học, giao tiếp và hợp tác nhóm đôi.
3. Phẩm chất: Rèn luyện tính cẩn thận, yêu thích khám phá công nghệ.

II. ĐỒ DÙNG DẠY HỌC:
- Giáo viên: Máy tính bảng/màn hình tương tác kết nối EduBot AI, bộ băng giấy phân số màu.
- Học sinh: SGK, vở ghi, phiếu học tập tương tác.

III. CÁC HOẠT ĐỘNG DẠY HỌC:
1. Khởi động (5'): Tình huống robot EduBot chia thanh năng lượng.
2. Khám phá (12'): Thực hành gấp giấy và quan sát mô hình trực quan.
3. Luyện tập (13'): Làm phiếu bài tập cá nhân hóa trên hệ thống EduBot.
4. Vận dụng (5'): Giải bài toán thực tế chia quả bánh trong sinh hoạt gia đình.

IV. ĐIỀU CHỈNH VÀ PHÂN HÓA:
- Học sinh tiếp thu nhanh: Giao thêm bài toán tìm x vận dụng cao.
- Học sinh cần hỗ trợ: Sử dụng trợ lý EduBot gợi ý bằng hình ảnh trực quan.`;
    }

    const newDraft: AiDraftItem = {
      id: `draft-plan-${Date.now()}`,
      type: 'lesson_plan',
      title: `Kế hoạch bài dạy: ${lessonName || 'Bài học mới'} - Khối ${grade}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: 'Cô Nguyễn Mai (EduBot Teacher AI)',
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

    addAuditLog('AI Soạn bài giảng', 'Giáo viên', 'teacher', `AI tạo bản nháp KHBD "${newDraft.title}"`, 'success');

    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error generating lesson plan:', error);
    res.status(500).json({ error: 'Không thể tạo bài giảng qua AI lúc này.' });
  }
});

// 3. EduBot Teacher AI - Knowledge Standardization (Chuẩn hóa kiến thức & Phát hiện lỗi)
app.post('/api/ai/teacher/standardize-knowledge', async (req: Request, res: Response) => {
  try {
    const { rawContent, grade = 4, subject = 'toan', lessonTitle } = req.body;

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

    let standardizedResult = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        standardizedResult = await callGeminiSafe({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { systemInstruction }
        });
      } catch (err: any) {
        console.error('Gemini fallback in standardize-knowledge:', err?.message);
      }
    }

    if (!standardizedResult) {
      standardizedResult = `BẢN BÁO CÁO CHUẨN HÓA KIẾN THỨC (EDUBOT AI AUDIT)
Bài: ${lessonTitle || 'Khái niệm kiến thức'} - Môn ${subject} Lớp ${grade}

1. ĐỐI CHIẾU CHUẨN ĐẦU RA (YCCĐ - TT 32/2018):
- Kiến thức phù hợp chuẩn phát triển năng lực tư duy toán học/khoa học.
- Đã lưu ý nhấn mạnh điều kiện mẫu số luôn phải khác 0 đối với phân số.

2. CÁC ĐIỂM CẦN CHỈNH SỬA / ĐỀ XUẤT SƯ PHẠM:
- Nội dung gốc dùng từ ngữ mang tính hàn lâm, đề xuất chuyển thành ngôn ngữ trực quan gần gũi với trẻ 9-10 tuổi.
- Bổ sung cảnh báo lỗi sai thường gặp khi rút gọn phân số.

3. PHIÊN BẢN ĐÃ CHUẨN HÓA CHO HỌC SINH:
- Khái niệm ngắn gọn: 2-3 câu đúc kết.
- Ví dụ minh họa thực tế dễ hình dung.`;
    }

    const newDraft: AiDraftItem = {
      id: `draft-std-${Date.now()}`,
      type: 'standardized_knowledge',
      title: `Chuẩn hóa kiến thức: ${lessonTitle || 'Tài liệu học tập'}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: 'Giáo viên (EduBot Standardizer)',
      status: 'draft',
      content: {
        rawContent,
        analysis: standardizedResult,
        statusLabel: 'Chờ giáo viên duyệt áp dụng'
      }
    };

    aiDrafts.unshift(newDraft);

    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error in standardize-knowledge:', error);
    res.status(500).json({ error: 'Lỗi chuẩn hóa kiến thức.' });
  }
});

// 4. EduBot Teacher AI - Question & Exam Matrix Generator (Tạo đề kiểm tra & câu hỏi)
app.post('/api/ai/teacher/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { grade = 4, subject = 'toan', topic = 'Phân số', questionCount = 4, cognitiveLevels = ['nhan_biet', 'thong_hieu', 'van_dung'] } = req.body;

    const systemInstruction = `Bạn là Trợ lý Khảo thí & Đánh giá Giáo dục Tiểu học EduBot.
Nhiệm vụ: Tạo ma trận đề và bộ câu hỏi đánh giá theo chuẩn 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) bám sát CTGDPT Việt Nam.
Tạo các câu hỏi trắc nghiệm khách quan và tự luận có kèm đáp án, lời giải chi tiết và gợi ý dẫn dắt sư phạm cho học sinh.`;

    const prompt = `Hãy tạo bộ ${questionCount} câu hỏi kiểm tra cho:
Môn: ${subject}, Khối: Lớp ${grade}, Chủ đề: ${topic}.
Yêu cầu gồm câu hỏi trắc nghiệm, đúng/sai, điền khuyết và toán thực tế có lời giải từng bước.`;

    let generatedQuizText = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        generatedQuizText = await callGeminiSafe({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { systemInstruction }
        });
      } catch (err: any) {
        console.error('Gemini fallback in generate-quiz:', err?.message);
      }
    }

    if (!generatedQuizText) {
      generatedQuizText = `MA TRẬN VÀ BỘ CÂU HỎI ĐÁNH GIÁ (EDUBOT AI EXAM BUILDER)
Môn: ${subject} - Lớp ${grade} - Chủ đề: ${topic}

Câu 1 [Nhận biết - Trắc nghiệm]:
- Đề bài: Phân số chỉ 3 phần tô màu trong hình chia làm 5 phần bằng nhau là:
  A. 5/3    B. 3/5 (Đáp án đúng)    C. 3/8    D. 2/5
- Lời giải: Tử số là số phần tô màu (3), mẫu số là tổng số phần (5).

Câu 2 [Thông hiểu - Đúng/Sai]:
- Đề bài: Phân số 6/9 và 2/3 là hai phân số bằng nhau. (Đúng)
- Lời giải: Rút gọn 6/9 bằng cách chia cả tử và mẫu cho 3 được 2/3.

Câu 3 [Vận dụng - Điền số]:
- Đề bài: Tìm số thích hợp điền vào ô trống: 4/7 = 16/... (Đáp án: 28)
- Lời giải: Vì 16 = 4 × 4 nên mẫu số là 7 × 4 = 28.`;
    }

    const newDraft: AiDraftItem = {
      id: `draft-quiz-${Date.now()}`,
      type: 'quiz_matrix',
      title: `Bộ đề & Ma trận kiểm tra: ${topic} - Lớp ${grade}`,
      subjectId: subject,
      grade: Number(grade),
      createdAt: new Date().toISOString(),
      createdBy: 'Giáo viên (EduBot Exam Generator)',
      status: 'draft',
      content: {
        text: generatedQuizText,
        questionCount,
        topic
      }
    };

    aiDrafts.unshift(newDraft);

    res.json({ success: true, draft: newDraft });
  } catch (error: any) {
    console.error('Error in generate-quiz:', error);
    res.status(500).json({ error: 'Không thể tạo đề kiểm tra lúc này.' });
  }
});

// ----------------- ANALYTICS & DASHBOARDS -----------------
app.get('/api/analytics/overview', (req: Request, res: Response) => {
  const totalStudents = users.filter(u => u.role === 'student').length + 56;
  const totalTeachers = users.filter(u => u.role === 'teacher').length + 12;
  const totalLessons = lessons.length;
  const totalSubmissions = submissions.length + 148;
  const avgScore = 8.6;
  const pendingReviews = aiDrafts.filter(d => d.status === 'draft').length;

  res.json({
    totalStudents,
    totalTeachers,
    totalLessons,
    totalSubmissions,
    avgScore,
    pendingReviews,
    curriculumVersion: 'CTGDPT-2018 (TT 32/2018 & TT 17/2025/TT-BGDĐT)',
    aiStatus: process.env.GEMINI_API_KEY ? 'active' : 'fallback_mode'
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
