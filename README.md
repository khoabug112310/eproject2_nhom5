# Clinic Management System - React + Node.js

Hệ thống quản lý phòng khám với đầy đủ chức năng: đặt lịch khám, quản lý bệnh nhân, bác sĩ, hoá đơn, etc.

## Project Structure

### Backend (Node.js + Express)
- `src/config/` - Cấu hình database, environment
- `src/constants/` - Enum (Gender, Status, Role, etc.)
- `src/middlewares/` - Auth, RBAC, Error Handler
- `src/models/` - Định nghĩa Table (Schema)
- `src/modules/` - Domain-driven modules:
  - `auth/` - Login, Register
  - `profiles/` - Users, Patients, Doctors, Staffs
  - `scheduling/` - Departments, Schedules, Appointments
  - `clinical/` - Medicines, Medical_Records, Prescriptions
  - `billing/` - Invoices, Payments
  - `cms/` - Posts, Contact_Inquiries
- `src/utils/` - JWT, Formatters, Upload helpers
- `src/app.js` - Express app setup
- `src/server.js` - Entry point

### Frontend (React + Vite)
- `src/components/` - UI Components (Button, Modal, Table, etc.)
- `src/layouts/` - Layout by role:
  - `PublicLayout/` - Trang chủ, Login, Register
  - `AdminLayout/` - Admin management
  - `DoctorLayout/` - Doctor portal
  - `PatientLayout/` - Patient portal
- `src/pages/` - Pages by role:
  - `public/` - Home, Doctors, News
  - `auth/` - Login, Register
  - `patient/` - Dashboard, Book Appointment, Medical Records
  - `doctor/` - Schedule, Today Appointments, Prescriptions
  - `staff/` - Schedule Appointments, Billing
  - `admin/` - User Management, Permissions, Catalogs
- `src/routes/` - React Router setup
- `src/services/` - API calls (Axios)
- `src/store/` - State management (Context API / Redux / Zustand)
- `src/utils/` - Helpers (Format date, currency, validation)

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Tạo tệp `.env` trong thư mục `backend` bằng cách sao chép từ tệp `.env.example` hoặc tạo mới với nội dung sau:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/eproject_clinic
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Cấu hình gửi email OTP (Nodemailer SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Cấu hình Twilio SMS OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

# CẤU HÌNH BẮT BUỘC ĐỂ DÙNG CHATBOT AI GEMINI:
# Dán API Key Gemini của bạn dưới đây:
GEMINI_API_KEY=
```

> [!IMPORTANT]
> **Lưu ý cấu hình Chatbot AI & Admin Analysis:**
> Để sử dụng toàn bộ tính năng phân tích và tư vấn bằng AI (Gemini 2.5 Flash), bạn nên điền khóa `GEMINI_API_KEY` trong tệp `.env`.
> 
> * **Nếu không điền khóa `GEMINI_API_KEY` (Chế độ giả lập AI):**
>   * **Chatbot tư vấn (Trang chủ):** Sẽ tự động trả lời bằng tin nhắn mẫu hướng dẫn liên hệ hotline hoặc sử dụng chức năng "Đặt lịch nhanh" thay vì gọi API Gemini (không lo bị crash hay lỗi).
>   * **AI Phân tích (Dashboard Admin):** Sẽ tự động chuyển sang chế độ hiển thị báo cáo số liệu thống kê thô (Doanh thu, tỉ lệ đặt lịch, bài viết, số lượng tài khoản) trực quan dưới dạng văn bản thay vì báo lỗi 500.

> [!TIP]
> **Chế độ Giả lập OTP (Email & SMS OTP Simulation):**
> * **Nếu không điền thông tin Gmail/Twilio:** Hệ thống sẽ tự động chuyển sang **chế độ giả lập dành cho nhà phát triển (Dev Simulation Mode)**.
> * **Cách lấy mã OTP để test:** Khi thực hiện chức năng *Quên mật khẩu*, mã xác thực OTP (6 chữ số) sẽ được **in trực tiếp ra màn hình terminal chạy Backend** và trả về trong API response. Hãy mở terminal của Backend lên để lấy mã và nhập vào giao diện web!



Run backend:
```bash
npm run dev
```

Backend: `http://localhost:4000`
API Health: `GET http://localhost:4000/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Run frontend:
```bash
npm run dev
```

Frontend: `http://localhost:5173` (default Vite port)

### 3. API Endpoints

#### Auth
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất

#### Profiles
- `GET /api/profiles/users` - Danh sách users (Admin)
- `GET /api/profiles/doctors/:id` - Chi tiết bác sĩ
- `POST /api/profiles/doctors` - Tạo bác sĩ (Admin)

#### Scheduling
- `GET /api/scheduling/departments` - Danh sách phòng khám
- `GET /api/scheduling/schedules` - Lịch làm việc bác sĩ
- `POST /api/scheduling/appointments` - Đặt lịch khám
- `GET /api/scheduling/appointments` - Danh sách lịch khám

#### Clinical
- `GET /api/clinical/medicines` - Danh sách thuốc
- `POST /api/clinical/medical-records` - Tạo hồ sơ bệnh án
- `POST /api/clinical/prescriptions` - Kê đơn thuốc

#### Billing
- `GET /api/billing/invoices` - Danh sách hoá đơn
- `POST /api/billing/invoices` - Tạo hoá đơn
- `POST /api/billing/invoices/:id/pay` - Thanh toán

#### CMS
- `GET /api/cms/posts` - Danh sách tin tức
- `POST /api/cms/contact-inquiries` - Gửi liên hệ

## User Roles
- **Admin** - Quản lý toàn bộ hệ thống
- **Doctor** - Quản lý lịch, khám bệnh, kê đơn
- **Staff** - Chốt lịch, hỗ trợ khách hàng
- **Accountant** - Quản lý hoá đơn, thu tiền
- **Patient** - Đặt lịch, xem kết quả khám

## Features (TODO)
- [ ] User authentication & authorization
- [ ] Appointment booking
- [ ] Medical records
- [ ] Prescription management
- [ ] Billing & payments
- [ ] CMS (Posts, Contact)
- [ ] Admin dashboard
- [ ] Role-based access control

## Tech Stack
- **Backend**: Node.js, Express, MySQL, JWT
- **Frontend**: React, Vite, React Router, Axios
- **Database**: MySQL
- **State Management**: Context API (or Redux/Zustand)

