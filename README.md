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

Configure `.env` file:
```
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=eproject_clinic
DB_PORT=3306
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

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

