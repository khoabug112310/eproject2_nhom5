# Tài liệu Thiết kế lại Giao diện — Hopsontai Clinic Management System

> **Mục đích:** Tài liệu này là bản đặc tả thiết kế (design spec) đầy đủ, độc lập, để một công cụ/agent code (Antigravity) có thể triển khai lại toàn bộ giao diện web.
> **Quy ước:** Phần giải thích bằng tiếng Việt; **mọi chuỗi hiển thị (UI copy), tên token, tên class, code đều bằng tiếng Anh** vì sản phẩm là 100% English UI.

---

## 0. Bối cảnh & Ngăn xếp công nghệ

- **Sản phẩm:** Hệ thống quản lý phòng khám đa khoa ("Hopsontai Clinic") với 5 vai trò: Patient, Doctor, Staff (Customer Care), Accountant, Admin + khu vực public.
- **Frontend:** React 18 + Vite, React Router DOM, Axios, SweetAlert2. CSS thuần (CSS variables), không dùng UI framework.
- **Backend:** Node.js + Express + MongoDB/Mongoose, JWT auth, RBAC middleware.
- **Ngôn ngữ giao diện:** **English 100%.**

### Cấu trúc thư mục frontend (giữ nguyên)
```
frontend/src/
├── main.jsx                 # import './index.css' rồi './styles/theme.css' (theme load SAU để override)
├── App.jsx                  # AuthProvider + AppRoutes
├── routes/index.jsx         # React Router
├── styles/theme.css         # ★ DESIGN SYSTEM (file trung tâm)
├── index.css                # base layout cũ (giữ, theme override lên trên)
├── layouts/PublicLayout.jsx # top bar + header nav + footer + hero + modals
├── components/              # Header, Footer, Hero, cards/, modals, ChatbotWidget, RoleTopNav...
├── pages/
│   ├── public/  Home, Departments, Specialists, About, Posts, Contact
│   ├── patient/ Dashboard.jsx + components/
│   ├── doctor/  Schedule.jsx
│   ├── staff/   Dashboard.jsx
│   ├── accountant/ Dashboard.jsx
│   └── admin/   Dashboard.jsx + AdminDashboard.css
├── services/api.js          # Axios + interceptors
└── store/authContext.jsx
```

---

## 1. Nguyên tắc thiết kế (Design Principles)

1. **Trust-first medical aesthetic** — sạch, sáng, nhiều khoảng trắng, màu teal/cyan trầm tạo cảm giác y tế tin cậy. Không gradient lòe loẹt, không bóng đổ nặng.
2. **One cohesive system** — mọi trang dùng chung 1 bộ token + component. Dashboard của 5 vai trò trông như **một web app** (cùng app-shell: sidebar + topbar).
3. **Content-first** — bảng/biểu/form rõ ràng, dày dữ liệu nhưng dễ quét mắt.
4. **Professional, không "AI-generated"** — bỏ icon emoji ngẫu nhiên ở chỗ nghiêm túc; dùng SVG line-icon hoặc emoji có chủ đích, nhất quán.
5. **Responsive** — desktop-first nhưng phải gọn gàng ở tablet/mobile (sidebar gập, grid co lại).
6. **Accessible** — focus ring rõ, `aria-label` cho nút icon, contrast đạt WCAG AA.

---

## 2. Design System (Design Tokens)

> Toàn bộ token khai báo trong `:root` của `frontend/src/styles/theme.css`. Component dùng `var(--token)`.

### 2.1 Màu sắc
```css
:root {
  /* Brand — teal/cyan medical */
  --color-primary:        #0d9488;  /* CTA, brand chính */
  --color-primary-dark:   #0f766e;  /* hover */
  --color-primary-light:  #f0fdfa;  /* nền nhạt */
  --color-primary-soft:   #ccfbf1;

  --color-secondary:      #0891b2;  /* accent, gradient cặp với primary */
  --color-secondary-dark: #0e7490;
  --color-secondary-light:#ecfeff;

  --color-accent:         #f59e0b;  /* nhấn (Quick Booking) */
  --color-accent-light:   #fffbeb;

  /* Semantic */
  --color-success:#16a34a;  --color-success-light:#f0fdf4;
  --color-warning:#d97706;  --color-warning-light:#fffbeb;
  --color-danger: #dc2626;  --color-danger-light: #fef2f2;
  --color-info:   #0ea5e9;  --color-info-light:   #f0f9ff;

  /* Neutrals (slate) */
  --color-text-dark:#0f172a; --color-text-body:#334155; --color-text-muted:#64748b;
  --color-bg:#f1f5f9; --color-surface:#ffffff; --color-border:#e2e8f0; --color-border-strong:#cbd5e1;
}
```
**Gradient thương hiệu:** `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` — dùng cho logo text, nút primary, avatar, số liệu nổi bật.

### 2.2 Typography
- Font: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif` (import Google Fonts trong theme.css).
- Thang cỡ chữ:

| Vai trò | Size / Weight |
|---|---|
| Page hero H1 | 30–40px / 800 |
| Section H2 | 24–32px / 800, `letter-spacing:-0.02em` |
| Card title H3/H4 | 16–19px / 700 |
| Body | 14px / 400–500, line-height 1.6 |
| Small/muted | 12–13px / 500, color `--color-text-muted` |
| Table header | 11.5px / 700, UPPERCASE, `letter-spacing:0.04em` |

### 2.3 Spacing / Radius / Shadow
```css
--radius-card:16px; --radius-btn:10px; --radius-input:10px; --radius-pill:999px;
--shadow-xs:0 1px 2px rgba(15,23,42,.04);
--shadow-sm:0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04);
--shadow-md:0 4px 12px rgba(15,23,42,.06),0 2px 4px rgba(15,23,42,.04);
--shadow-lg:0 12px 28px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04);
--shadow-xl:0 24px 48px rgba(15,23,42,.14);
--app-sidebar-w:264px;
```
Spacing dùng bội số 4px (4/8/12/16/20/24/32/40).

### 2.4 Iconography
- Ưu tiên SVG line-icon (stroke 2, `currentColor`).
- Emoji chỉ dùng nhất quán ở: sidebar nav dashboard, chatbot, stat icon. Không dùng emoji trong bảng dữ liệu y tế nghiêm túc.

---

## 3. Thư viện Component (đặc tả `theme.css`)

### 3.1 Buttons `.btn`
- Base: inline-flex, gap 8px, radius `--radius-btn`, min-height 40px, weight 600, transition 0.18s.
- Biến thể:
  - `.btn-primary` — gradient brand, chữ trắng, shadow teal; hover nâng `translateY(-1px)`.
  - `.btn-ghost` — nền trắng, viền `--color-border-strong`; hover viền + chữ teal, nền `--color-primary-light`.
  - `.btn-success` / `.btn-danger` / `.btn-warning` / `.btn-info` — màu semantic.
  - `.btn-quick` — gradient amber→orange (CTA đặt lịch nhanh).
  - Kích cỡ: `.btn-xs` (30px), `.btn-sm` (34px), `.btn-lg` (50px).
- `:focus-visible` → outline 2px primary, offset 2px. `:disabled` → opacity .55.

### 3.2 Form controls
- `input, select, textarea`: viền `--color-border-strong`, radius `--radius-input`, padding 10–12px; focus → viền primary + `box-shadow:0 0 0 3px rgba(13,148,136,.12)`.
- `label`: 13px/600. `.form-group` margin-bottom 16px. `.grid-form` 2 cột (1 cột ở ≤640px), `.full-width` span toàn dòng.

### 3.3 Cards / Surfaces
- `.card`, `.dashboard-card`, `.admin-card`: nền trắng, viền `--color-border`, radius `--radius-card`, shadow-sm; padding 24px (dashboard).

### 3.4 Tables
- Bọc `.table-responsive` (overflow-x, radius 12px, viền).
- `.custom-table`: header nền `#f8fafc`, chữ muted uppercase; row hover `#f8fafc`; cell padding 12–14px; `.btn-cell` chứa nút thao tác.
- Utility: `.monospace`, `.text-muted`, `.font-bold`, `.text-primary`, `.text-success`, `.text-right`.

### 3.5 Badges & Status pills
- `.badge` pill, chữ trắng: `.badge-primary/success/warning/danger/info/purple`.
- `.status-pill` (mềm, có chấm tròn): biến thể `.status-pending` (amber), `.status-confirmed` (info), `.status-completed` (success), `.status-canceled` (danger).

### 3.6 Alerts
- `.alert` radius 12px; `.alert-success` (xanh lá), `.alert-danger` (đỏ).

### 3.7 Modals
- `.modal-backdrop` / `.modal-overlay`: nền `rgba(15,23,42,.55)` + `backdrop-filter:blur(4px)`, center, z-index 1000, fade-in.
- `.modal-content`: trắng, radius 18px, max-width 560px, max-height 92vh, shadow-xl, slide-up.
- `.modal-header` (title + close-btn), `.modal-body` (padding 22px), `.modal-footer` (nền `#f8fafc`, nút phải).
- `.close-btn` → hover đỏ.

### 3.8 App-shell dashboard (dùng chung Patient/Doctor/Staff/Accountant)
- `.role-dashboard-shell` nền `--color-bg`.
- `.dashboard-layout`: grid `264px 1fr`, gap 24px, max-width 1440px; ≤900px → 1 cột.
- `.dashboard-sidebar`: card sticky top 88px; `.patient-quick-info` (avatar tròn gradient + tên + vai trò), `.sidebar-nav` (nút dọc; `.active` = gradient brand).
- `.dashboard-main-content`: cột phải, gap 20px.
- `.stats-cards-grid` + `.stat-card` (icon + số lớn teal + nhãn muted).
- `.empty-state`, `.dashboard-loading` + `.spinner`.

### 3.9 Role topnav (thanh trên dashboard)
- `.role-topnav`: sticky, nền trắng, viền dưới; trái = brand + role; phải = avatar tròn + tên + role pill + nút `Log out`.

---

## 4. Layout toàn cục

### 4.1 Public Layout (`layouts/PublicLayout.jsx`)
- **Top bar** (sticky, glass): logo trái ("Hopsontai Clinic") · brand giữa (3 dòng) · actions phải.
  - Chưa đăng nhập: `Log in` (ghost) + `Quick Booking` (`.btn-quick`).
  - Đã đăng nhập: chip tên người dùng (click → dashboard theo role) + `Log out`.
- **Header nav** (`components/Header.jsx`): Home · About · Departments · Doctors · News · Contact (highlight route đang active).
- **Hero slideshow** (chỉ trang Home): 3 ảnh crossfade + overlay tối trái → CTA `Book Now` + `View Departments`.
- **Footer**: 3 cột — brand+mô tả · Contact Information · Working Hours. Dòng copyright "© {year} Hopsontai General Clinic. All rights reserved."
- Nút **Back to top** (góc phải dưới) + **ChatbotWidget** floating.

### 4.2 Brand strings (English chuẩn)
- Tên: **Hopsontai Clinic** / **Hopsontai General Clinic**.
- Tagline: **Friendly · Dedicated · Effective**.
- Hotline: **091-444-4444** · Email: **contact@hopsontai.vn** · Address: **123 Nguyen Trai Street, District 5, Ho Chi Minh City** · Hours: **Mon–Sun 7:00 AM – 8:00 PM**.

---

## 5. Bản đồ trang & Route

| Route | Trang | Quyền |
|---|---|---|
| `/` | Home | public |
| `/about` | About | public |
| `/departments` | Departments | public |
| `/specialists` | Doctors (Specialists) | public |
| `/news` | News (Posts) | public |
| `/contact` | Contact | public |
| `/patient/dashboard` | Patient dashboard | patient |
| `/doctor/schedule` | Doctor dashboard | doctor |
| `/staff/dashboard` | Customer Care dashboard | staff |
| `/accountant/dashboard` | Accountant dashboard | accountant |
| `/admin/dashboard` | Admin dashboard | admin |

`RoleGuard` bảo vệ route theo role; chưa auth → redirect `/?login=true`. Axios 401/403 → clear localStorage + redirect login.

---

## 6. Đặc tả từng trang

> Mỗi trang dùng pattern hero-banner (gradient `primary-dark → secondary-dark`, chữ trắng, eyebrow pill) cho public pages, và app-shell cho dashboard.

### 6.1 Home (`/`)
Thứ tự section:
1. **Hero slideshow** (trong PublicLayout) — H1 "Compassionate healthcare — book your visit in just a few clicks".
2. **Trust stats bar** (`Hero.jsx`) — 4 số: Specialties · Specialist Doctors · Patients Served · Appointments (lấy từ `/clinical/public-stats`).
3. **Featured Medical Team** — eyebrow "Our Experts", grid `DoctorCard` (4 bác sĩ) + nút "View all doctors".
4. **Why choose us** (`.home-features`) — 6 card: Expert Physicians, Fast Booking, Modern Equipment, In-house Pharmacy, Transparent Pricing, Dedicated Care.
5. **How it works** (`.home-steps`) — 4 bước: 01 Book online · 02 Get confirmed · 03 Visit the clinic · 04 Pay & collect.
6. **Quick Booking** inline card.
7. **Latest news** — 3 `PostCard`.

### 6.2 Departments (`/departments`)
- Hero "A Comprehensive Range of Specialties".
- Toolbar: ô search "Quick search departments..." + filter pills (All Specialties / Internal Medicine & Cardiology / Surgery & Dermatology / Obstetrics & Pediatrics / Traditional & Sub-specialties).
- Grid `DepartmentCard` (auto-fill 280px) + phân trang 6/trang.
- Section "Our Commitment to Service Quality" — 3 box: State-of-the-art equipment · Team of specialists · Streamlined process.

### 6.3 Doctors / Specialists (`/specialists`)
- Hero "Our Team of Medical Specialists".
- 2 cột: trái = search theo tên + filter pills theo khoa + grid `DoctorCard`; phải = `QuickBooking` sticky.
- Click "Book Appointment" trên card → prefill QuickBooking (doctor + department) và scroll tới.

### 6.4 About (`/about`)
- Hero "Hopsontai General Clinic".
- Section Overview + 3 value card: **Mission / Vision / Core Values**.
- Timeline mốc phát triển (Today, 2024, 2022, 2020, 2018) — bullet dọc gradient.

### 6.5 News (`/news`)
- Hero "Medical News & Knowledge".
- Danh sách: grid `PostCard`. Khi có `?slug=` → trang chi tiết bài viết (cover, meta Published/Author/Category, nội dung HTML) + sidebar (Health Consultation CTA, Related news, 24/7 hotline).

### 6.6 Contact (`/contact`)
- Hero "Contact & Feedback".
- Quick info strip (Address / Hotline / Support email / Working hours).
- 2 cột: trái = FAQ accordion + Google Map; phải = form (Full name, Phone number, Message) → `POST /cms/contact-inquiries`.

### 6.7 Modals
- **Login** (`LoginModal`): Phone Number + Password → `Log In`; link "Don't have an account? Sign up now" mở Register. Lỗi → "Incorrect phone number or password...".
- **Register** (`RegisterModal`): stepper 3 bước — (1) Phone number → (2) kích hoạt tài khoản cũ (set password) hoặc (3) đăng ký mới (Full name, Date of birth, Gender, Password, Confirm). Auto-login sau khi xong.
- **Quick Booking** (`QuickBooking` trong `QuickBookingModal`): Department, Preferred Doctor, Appointment Date, Appointment Time, Patient Full Name, Contact Phone Number, Symptoms/Reason → `Confirm Booking`.

### 6.8 Patient dashboard (`/patient/dashboard`)
- App-shell. Sidebar phải = `PatientSidebar` (hồ sơ + nút: Book appointment, Appointments, Edit profile, Invoices(n), Medical records + box Customer Care).
- Hero "Hello, {name}".
- Panel bật/tắt theo nút: **Upcoming appointments** (list + Details/Cancel), **Payment overview** (tổng/Unpaid/Consultation/Pharmacy + Pay all/Pay individually), **Booking form**, **Recent medical records** (vitals + diagnosis).
- Modal: Appointment details, Invoice details (Pay), Edit profile.
- Status hiển thị: "Awaiting care approval / Confirmed — Please arrive on time / Examination completed / Cancelled".

### 6.9 Doctor dashboard (`/doctor/schedule`)
- App-shell, sidebar tabs: **Patient list · Medical records lookup · Work schedule**.
- **Patient list**: bảng BN đã Confirmed/Completed → nút "Start examination" / "Update record".
- **Examination workspace** (khi vào khám): 2 panel — trái = Patient medical history; phải = form vitals (Height/Weight/Blood pressure/Heart rate/Temperature) + Diagnosis* + Doctor's notes + **Prescription builder** (search thuốc, thêm dòng: Quantity/Dosage/Frequency/Days/Usage notes) → "Complete exam & Prescribe".
- Sau khi lưu → **Print prescription modal** (header phòng khám, thông tin BN, chẩn đoán, bảng thuốc, chữ ký bác sĩ) → nút "Print prescription" (mở cửa sổ in).
- **Medical records lookup**: bảng toàn phòng khám + "Quick view" (SweetAlert chi tiết).
- **Work schedule**: bảng ca trực + progress bar slot.

### 6.10 Customer Care / Staff dashboard (`/staff/dashboard`)
- App-shell, sidebar lọc: Pending approval(n) · Confirmed(n) · All requests(n).
- "Patient intake queue": 2 nhóm **Registered customers** / **Walk-in guests**, gom theo bệnh nhân (expand xem từng ca).
- Hành động mỗi ca Pending: **Doctor schedule** (mở `DoctorScheduleModal` để chọn/đổi bác sĩ) · **Fill & Approve** (khách vãng lai chưa đủ hồ sơ → modal điền) hoặc **Approve** · **Cancel**.
- **Ràng buộc nghiệp vụ:** không cho Approve nếu chưa gán bác sĩ → tự mở DoctorScheduleModal. Dùng `Swal.fire` cho mọi confirm (không dùng `window.confirm`).

### 6.11 Accountant dashboard (`/accountant/dashboard`)
- App-shell, sidebar: **Hospital fees · Daily revenue report**.
- **Hospital fees**: toolbar search (tên/SĐT/mã HĐ) + filter loại (Consultation/Pharmacy) + trạng thái (Unpaid/Paid); bảng hóa đơn → "View receipt" + "Collect payment" (Swal xác nhận).
- **Daily revenue report**: 4 stat (Revenue collected today / Total consultation fees / Total pharmacy sales / Invoices reconciled) + bảng giao dịch hôm nay + "Print report".
- **Receipt modal**: layout biên lai in được (brand, BN, bảng nội dung, tổng, cashier) + "Print invoice".

### 6.12 Admin dashboard (`/admin/dashboard`)
- Layout riêng: **sidebar điều hướng full-height** (không dùng role-topnav) + top header + workspace. Style trong `pages/admin/AdminDashboard.css`.
- Sidebar tabs: **Reports & Statistics · Workflow Monitor · Account Management · News (CMS) · Doctor Shifts · Medicine Inventory · Departments · AI System Analysis** + `Log out`.
- **Reports & Statistics**: stat cards (Registrations/Examinations/Revenue, toggle day/week/month) + quality metrics + SVG charts (revenue bar + patient line) + revenue breakdown gauge + staff performance (top doctors / top care staff).
- **Workflow Monitor**: search + filter; mỗi appointment hiển thị **timeline 5 bước** (Booking request → Care Approval → Consultation fee → Examination → Pharmacy fee) với nút Approve/Pay/Confirm/Delete từng bước.
- **Account Management**: list users (search + role filter) → Lock/Unlock, Edit, Delete, **Impersonate**; tab "Create new account" (form theo role: doctor/staff/accountant).
- **News (CMS)**: list bài viết (search + filter status) → Create/Edit/Delete, modal form (title, cover image upload, status, content), bảng có cột Image/Article title/Published date/Status/Actions.
- **Doctor Shifts**: form tạo ca (Doctor, Work date, Start/End time, Max patients) + bảng + Delete.
- **Medicine Inventory**: list + "Add new medicine" (modal: Medicine name, Code, Active ingredient, Route[Oral/Topical/Injection], Unit, Unit price, Stock) + Edit/Delete.
- **Departments**: list + "Add new department" (modal: name, description, phone) + Edit/Delete.
- **AI System Analysis**: executive summary cards + diagnostic rows + chat assistant (gọi `/profiles/admin/ai-query`, fallback rule-based) — **AI trả lời bằng English**.
- Floating chat AI ở góc.

---

## 7. Quy tắc ngôn ngữ (English 100%) — và ngoại lệ DỮ LIỆU

**Tất cả text hiển thị, placeholder, aria-label, toast, message API đều English.**

**KHÔNG dịch (vì là dữ liệu/logic, không phải UI):**
- **Enum backend:** `usageRoute` = `'Uống'/'Bôi'/'Tiêm'`, `gender` = `'Nam'/'Nữ'/'Khác'` (xem `backend/src/constants/enums.js`). Trong `<select>`: giữ `value` tiếng Việt, **label hiển thị English** (Oral/Topical/Injection, Male/Female/Other).
- **Keyword matcher tên khoa** trong `DepartmentCard.jsx` (getDeptConfig) & `Departments.jsx` (filter) — khớp tên khoa lưu trong DB.
- **Regex bỏ dấu** (removeDiacritics / slugify).
- **Seed data** `backend/src/config/seed.js` — dữ liệu mẫu (tên người, tên khoa, bài viết). *Nếu muốn demo dataset hoàn toàn English thì dịch riêng + cập nhật matcher tương ứng.*

**Cách kiểm tra sót tiếng Việt:** grep ký tự có dấu trên `frontend/src` và `backend/src/modules`:
```
[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]
```

---

## 8. Responsive

| Breakpoint | Hành vi |
|---|---|
| ≥1200px | Layout đầy đủ, dashboard 2 cột (sidebar 264px + content) |
| 900–1199px | Grid feature 2 cột; dashboard vẫn 2 cột |
| ≤900px | `.dashboard-layout` → 1 cột, sidebar về static (không sticky) |
| ≤720px | `.role-topnav` wrap, nav xuống dòng |
| ≤640px | `.grid-form` 1 cột; feature/step grid 1 cột; hero H2 24px |

---

## 9. Accessibility
- Mọi nút icon-only có `aria-label` (English).
- `:focus-visible` ring teal rõ ràng trên nút/input.
- Contrast text/nền đạt WCAG AA (text body `#334155` trên trắng, muted `#64748b`).
- Modal: `role="dialog"` `aria-modal="true"`, đóng bằng Esc + click backdrop.
- Bảng có `<thead>` rõ ràng; trạng thái dùng cả màu + chữ (không chỉ màu).

---

## 10. Ghi chú triển khai cho Antigravity

**Thứ tự thực hiện đề xuất:**
1. Tạo `frontend/src/styles/theme.css` (Mục 2 + 3) và import **sau** `index.css` trong `main.jsx`.
2. Dựng layout chung: `PublicLayout`, `RoleTopNav`, app-shell classes.
3. Component dùng lại: `Header`, `Footer`, `Hero`, `cards/DoctorCard|DepartmentCard|PostCard`, `QuickBooking`, modals, `ChatbotWidget`.
4. Public pages (Mục 6.1–6.6) → Modals (6.7).
5. Dashboards (6.8–6.12) dùng app-shell.
6. Soát ngôn ngữ theo Mục 7 (grep), rồi `npx vite build` để kiểm lỗi.

**Ràng buộc bắt buộc giữ:**
- Không phá API contract trong `services/api.js` (đường dẫn `/auth`, `/profiles`, `/scheduling`, `/clinical`, `/billing`, `/cms`, `/booking`).
- Không đổi `value` của các `<option>` enum (giữ tiếng Việt như Mục 7).
- Quy trình nghiệp vụ 5 bước: Booking request → Care Approval (auto tạo Consultation invoice) → Pay consultation → Doctor exam (tạo medical record → auto Completed + auto Pharmacy invoice) → Pay pharmacy.
- Confirm dialog dùng SweetAlert2 nhất quán.

**Tiêu chí hoàn thành (Definition of Done):**
- [ ] `npx vite build` chạy không lỗi.
- [ ] Không còn chuỗi tiếng Việt hiển thị (grep sạch, trừ ngoại lệ Mục 7).
- [ ] 5 dashboard + 6 public page + modals đồng bộ một design system.
- [ ] Responsive 3 mốc (desktop/tablet/mobile) không vỡ layout.
- [ ] Trang chủ có đủ: hero, stats, doctors, why-us, how-it-works, news, quick booking.
```
```

---

*Tài liệu này mô tả trạng thái mục tiêu của giao diện. Nguồn tham chiếu màu/spacing/component là `frontend/src/styles/theme.css`.*
