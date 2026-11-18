# Hướng Dẫn Triển Khai EduBot AI Lên Vercel

## 1. Kiến Trúc Triển Khai

- **Frontend (SPA):** Vite + React 19 + Tailwind CSS v4, build ra thư mục `dist/`.
- **Backend API (`/api/*`):** Express app trong `server/app.ts` được export qua Serverless Function `/api/index.ts`.
- **Định tuyến (`vercel.json`):**
  - `/api/(.*)` → `/api/index.ts` (Node.js Serverless Function, `maxDuration: 30s`).
  - Các route SPA (`/lessons`, `/tutor`, `/teacher`, `/admin`, ...) → fallback về `/index.html`.
- **Bảo mật key:** Toàn bộ lời gọi Gemini (`GEMINI_API_KEY`) chỉ thực hiện ở `server/app.ts`; bản build `dist/` hoàn toàn không chứa secret server.

## 2. Biến Môi Trường Cần Thiết Trên Vercel (Project Settings → Environment Variables)

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | Bắt buộc cho AI | API key Google Gemini để chạy Gia sư AI & Trợ lý Giáo viên (`gemini-4-hydrogen`). |
| `SESSION_SECRET` | Bắt buộc (Production) | Chuỗi bí mật >= 32 ký tự để ký token phiên HMAC-SHA256 (`openssl rand -hex 32`). |
| `NODE_ENV` | Khuyến nghị | Đặt `production`. |
| `APP_URL` | Khuyến nghị | URL thật trên Vercel (ví dụ `https://edubot-u4d.vercel.app`). |
| `ALLOWED_ORIGIN` | Khuyến nghị | Danh sách origin được phép CORS (phân tách dấu phẩy). |
| `FIREBASE_PROJECT_ID` | Khuyến nghị | `gen-lang-client-0856385601` để server xác thực Firebase ID Token qua JWKS. |
| `BOOTSTRAP_ADMIN_EMAIL` | Tùy chọn | Email Admin đầu tiên cho môi trường local/staging. |

> **Lưu ý về Server-side State trên Vercel Serverless:** Các request serverless không giữ bộ nhớ RAM vô hạn giữa các cold start. Các thao tác học sinh (nộp bài, tiến độ bài học, lịch sử chat AI) đã được đồng bộ song song lên **Cloud Firestore** ở phía client thông qua Firebase Auth + Firestore Security Rules, và Admin có nút **Đồng bộ Cloud Firestore** trong tab *Khung GDPT 2026* để đẩy toàn bộ học liệu chuẩn lên Firestore.

## 3. Quy Trình Deploy

1. Chạy kiểm tra trước khi deploy:
   ```bash
   npm run typecheck
   npm run lint:rules
   npm run build
   npm run test:api
   ```
2. Đẩy mã nguồn lên GitHub và kết nối repo với Vercel, hoặc deploy trực tiếp bằng Vercel CLI:
   ```bash
   vercel --prod
   ```
3. Sau khi có domain `https://<ten-app>.vercel.app`:
   - Thêm domain vào **Firebase Console → Authentication → Settings → Authorized domains**.
   - Kiểm tra `/api/health` trả về `200 OK`, `aiConfigured: true`.
