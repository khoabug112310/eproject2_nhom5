# Tóm tắt yêu cầu dự án

1) Chuẩn giao tiếp API (BE+FE thống nhất)
- Response thành công chung:
  {
    "success": true,
    "message": "Thành công",
    "data": { ... }
  }
- Response lỗi chung:
  {
    "success": false,
    "message": "Sai mật khẩu",
    "errors": null
  }
- Ghi chú: mọi API phải tuân theo format trên.

2) Kết nối DB & cấu hình API client
- BE: cấu hình `src/config/database.js` (hoặc `config/database.js`) với URI từ env; có Global Error Handler để tránh crash.
- FE: dùng Axios; cấu hình Axios Interceptors:
  - tự động đính kèm `Authorization: Bearer <token>`
  - khi 401 -> redirect về Login

3) Cụm API Xác thực (BE ưu tiên)
- POST `/api/auth/login` — input: `{ phone, password }` → trả JWT (payload chứa `userId`, `roleId`).
- GET `/api/auth/me` — trả thông tin user hiện tại.
- Middlewares cần có:
  - `verifyToken` — xác thực JWT và attach `req.user`.
  - `checkRole(allowedRoles)` — kiểm soát quyền theo roleId.

4) Frontend: Layout & Router
- Public routes: `/`, `/login`, …
- Private routes: yêu cầu token
- Role-based routing: chuyển hướng theo role (`/patient/dashboard`, `/doctor/schedule`, `/admin`...)
- Login form lưu token vào `localStorage` hoặc state manager (Redux/Zustand).

Ghi chú ngắn:
- Trước khi code logic, BE+FE phải chốt response schema.
- Làm song song: BE chuẩn API, FE cấu hình axios interceptors.
- Giữ lỗi trả về rõ ràng để FE không phải xử lý tùy biến mỗi chỗ.

Liên kết tham khảo nhanh:
- BE env: `backend/src/config/env.js`
- Seed mẫu: `backend/src/config/seed.js`

Cần mở rộng thành checklist chi tiết cho sprint tiếp theo không?