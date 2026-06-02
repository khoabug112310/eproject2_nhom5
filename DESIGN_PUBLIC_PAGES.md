# Thiết Kế Chi Tiết — Public Pages

Phiên bản: 1.0

Mục tiêu: tài liệu này mô tả chi tiết giao diện và contract API cho các trang public của website (Home, Departments, Specialists, Services, Posts, Contact) nhằm gửi cho designer/developer để thiết kế mockups và implement.

---

## Phạm vi
- Trang: Home (bao gồm Quick Booking), Departments, Specialists, Services, Posts, Contact
- Component chung: Header/Nav, Footer, QuickBooking, DepartmentCard, DoctorCard, ServiceCard, PostCard, ContactForm, Hero, Carousel
- API chính: `POST /api/booking` (public quick booking), `GET /api/scheduling/departments`, `GET /api/clinical/doctors`, `GET /api/cms/posts`, `POST /api/cms/contact`

---

## 1 — Home (một trang "sống động")

Mục tiêu: giới thiệu, điều hướng nhanh, đặt lịch nhanh, nổi bật dịch vụ & tin tức.

Layout (trên xuống):
- `Header` (logo, nav 6 items, CTA "Đặt lịch")
- `Hero` (ảnh/illustration, tiêu đề lớn, mô tả, CTA primary + secondary)
- `QuickBooking` (form ngắn: `name`, `phone`, `department`, `doctor`?, `time`)
- `Departments` (grid `DepartmentCard`)
- `Top Specialists` (carousel `DoctorCard`)
- `Popular Services` (grid `ServiceCard`)
- `Latest Posts` (3 `PostCard`)
- `Footer` (contact, hotline, opening hours)

States & interactions:
- Loading: skeletons cho hero, cards, quick booking
- Success: inline banner + accessible alert
- Error: inline red message
- Hero CTA scrolls tới `QuickBooking`
- Chọn Department lọc `doctor` trong `QuickBooking`
- QuickBooking gửi tới `POST /api/booking`

Responsive:
- Mobile (<640px): single column, QuickBooking collapsible
- Tablet (640–1024px): QuickBooking full-width dưới hero
- Desktop (>1024px): two-column hero with QuickBooking bên phải

---

## 2 — Departments

Purpose: danh sách phòng khám.

Layout:
- Header + breadcrumb
- Search + filters (specialization, availability)
- Grid `DepartmentCard` (icon, name, short desc, doctorCount, CTA)
- Pagination / load-more

API: `GET /api/scheduling/departments?search=&page=&limit=`

Component `DepartmentCard` props: `name`, `iconUrl`, `description`, `doctorCount`, `onViewDoctors()`

---

## 3 — Specialists

Purpose: danh sách bác sĩ, profile tóm tắt

Layout:
- Filters: department, availability, sort
- Grid/List `DoctorCard`: avatar, name, title, specials, rating, nextSlot, CTAs `Book`, `View profile`

API: `GET /api/clinical/doctors?department=&available=&page=&limit=`

Booking flow: `Book` mở modal QuickBooking prefilled; nếu `auth` => gọi `POST /api/scheduling/appointments` với token; nếu không => public `POST /api/booking`.

`DoctorCard` props: `id`, `avatar`, `fullName`, `specialization`, `rating`, `nextSlot`, `onBook()`, `onViewProfile()`

---

## 4 — Services

Purpose: liệt kê dịch vụ/giá

Layout: category filter + `ServiceCard` (name, short desc, price-range, CTA)

API: `GET /api/billing/services` (hoặc tương đương)

---

## 5 — Posts (Tin tức)

Listing: grid/stack `PostCard` (thumb, title, excerpt, date)
Post detail: full content, author, date, related posts, share

API: `GET /api/cms/posts?page=&limit=&tag=` & `GET /api/cms/posts/:slug`

SEO: meta tags (title, description, og:image) cho từng bài

---

## 6 — Contact

Layout:
- `ContactForm`: `name`, `email`, `phone`, `subject`, `message` -> `POST /api/cms/contact`
- Side panel: address, phone, hours, FAQ accordion

Accessibility: labels, required indicators, ARIA

---

## Component Inventory (tóm tắt props)

- `Header/Nav`: props `user`, `onLogin`, `onLogout`; responsive hamburger
- `QuickBooking`: props `departments`, `doctors`, `onSuccess`; states: idle/loading/success/error; events: submit -> `POST /api/booking`
- `DepartmentCard`: `name`, `iconUrl`, `description`, `doctorCount`, `onViewDoctors`
- `DoctorCard`: `id`, `avatar`, `fullName`, `specialization`, `rating`, `nextSlot`, `onBook`, `onViewProfile`
- `ServiceCard`: `title`, `description`, `priceRange`, `onDetail`
- `PostCard`: `title`, `excerpt`, `date`, `thumbnail`, `onRead`
- `Carousel`: `items`, `slidesToShow`, `autoplay`, `dots`

---

## API Contracts (mẫu)

1) Quick booking (public)

POST /api/booking

Body example:

```json
{ "name": "Nguyen Van A", "phone": "0912345678", "department": "Nội tổng hợp", "doctor": "TS. Bác sĩ B", "time": "2026-05-21T09:30" }
```

Success response:

```json
{ "success": true, "message": "Booking created", "data": { "_id": "...", "name": "..." } }
```

2) Create appointment (authenticated)

POST /api/scheduling/appointments
Headers: `Authorization: Bearer <token>`

Body example:

```json
{ "patientId": "...", "doctorId": "...", "departmentId": "...", "timeSlot": "2026-05-21T09:30", "reason": "Khám tổng quát" }
```

3) Departments list

GET /api/scheduling/departments

Response shape: `{ success: true, data: [{ _id, departmentName, description, iconUrl }] }`

4) Contact form

POST /api/cms/contact
Body: `{ name, email, phone, subject, message }`

---

## UX / Interaction notes

- Validation: `name` + `phone` required on QuickBooking; phone pattern check
- Feedback: success banner + `role="status"` for screen readers; error banner with retry
- Loading: button spinner, skeletons for lists
- Modals: trap focus, ESC to close, ARIA labelled

---

## Visual tokens (proposal)

- Colors: primary `#0066CC`, secondary `#00A89D`, neutral `#333/#666/#F5F7FA`
- Spacing: 4px base scale (4,8,12,16,24,32)
- Typography: headings scale 32/28/24/20; body 16px
- Border radius: 8px cards, 6px buttons

Provide these as CSS variables or Tailwind tokens in handoff.

---

## Accessibility & i18n

- All inputs must have labels; color contrast >= 4.5:1
- Keyboard navigable controls and focus states
- ARIA roles for dynamic messages; strings externalized for translation

---

## Assets & Deliverables (yêu cầu designer)

- Figma file with screens: Home (mobile/tablet/desktop), Departments, Specialists list & profile, Services, Post detail, Contact
- Exported SVG icons for departments/services, hero illustration, avatar placeholders
- Spacing & typography tokens, interaction prototypes for QuickBooking flow
- Optional: HTML/CSS snippets for `Header`, `QuickBooking`, `DoctorCard`

---

## Acceptance Criteria / QA checklist

- Mockups for desktop/tablet/mobile provided
- QuickBooking submits to `POST /api/booking` and shows success
- Interactive controls keyboard & screen-reader friendly
- Loading / empty / error states implemented

---

## Handoff notes to dev

- Yêu cầu designer gửi: Figma + exported assets + component spec (props + example JSON)
- Khi có mockups tôi sẽ tích hợp vào React structure hiện tại.

---

## Next options

Nếu bạn muốn, tôi có thể:
- xuất file này sang PDF, hoặc
- tạo thêm file `mock-data.json` chứa dữ liệu mẫu cho designer/dev, hoặc
- tạo một checklist gửi kèm email (Markdown -> HTML).

Gửi cho tôi lựa chọn bạn muốn tiếp theo.
