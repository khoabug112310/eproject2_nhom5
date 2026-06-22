# TÀI LIỆU ĐẶC TẢ GIAO DIỆN & TÍCH HỢP (UI & API HANDOFF)

**Dự án:** Website Phòng Khám / Bệnh Viện (Public Pages)  
**Phiên bản:** 1.0  

Tài liệu này cung cấp chi tiết về cấu trúc layout, state giao diện, hệ thống component và API contracts để Frontend Developer tiến hành xây dựng giao diện (tích hợp trên nền tảng React).

---

## 1. HỆ THỐNG THIẾT KẾ (DESIGN TOKENS)

Yêu cầu sử dụng các biến CSS (CSS Variables) hoặc Tailwind config cho các token sau:

* **Màu sắc (Colors):**
  * Primary: `#0066CC` (Dùng cho nút bấm chính, link quan trọng)
  * Secondary: `#00A89D` (Dùng cho các điểm nhấn, hover states)
  * Neutral: `#333333` (Text chính), `#666666` (Text phụ), `#F5F7FA` (Background xám nhạt)
* **Typography:**
  * Font size cơ bản (Body): `16px`
  * Heading scale: `32px` (H1) / `28px` (H2) / `24px` (H3) / `20px` (H4)
* **Spacing (Hệ số 4px):** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`
* **Border Radius:**
  * Cards & Modal: `8px`
  * Buttons & Inputs: `6px`

---

## 2. CHI TIẾT CÁC TRANG (PAGES SPECIFICATION)

### 2.1. Trang Chủ (Home)
**Mục tiêu:** Giới thiệu, điều hướng nhanh, đặt lịch trực tiếp và làm nổi bật dịch vụ/tin tức.

**Responsive:**
* *Mobile (<640px):* Single column, QuickBooking dạng accordion/collapsible.
* *Tablet (640–1024px):* QuickBooking full-width nằm ngay dưới Hero section.
* *Desktop (>1024px):* Layout 2 cột cho Hero (Text/Image) + QuickBooking form nằm bên phải.

**Cấu trúc Layout (Top to Bottom):**
1. **Header:** Logo, Navigation (6 items), Nút CTA "Đặt lịch".
2. **Hero Section:** Ảnh/Illustration, Tiêu đề lớn, Mô tả, CTA Primary (scroll tới QuickBooking) + Secondary.
3. **QuickBooking Form:** Form đặt lịch nhanh. *Lưu ý UX: Khi chọn Department, dropdown Doctor sẽ được filter tương ứng.*
4. **Departments:** Grid hiển thị các `DepartmentCard`.
5. **Top Specialists:** Carousel/Slider hiển thị các `DoctorCard`.
6. **Popular Services:** Grid hiển thị `ServiceCard`.
7. **Latest Posts:** Hiển thị 3 `PostCard` mới nhất.
8. **Footer:** Thông tin liên hệ, hotline, giờ làm việc, links.

### 2.2. Danh Sách Chuyên Khoa (Departments)
* **Layout:** Header + Breadcrumb -> Thanh Search & Filter -> Grid danh sách `DepartmentCard` -> Pagination/Load-more.
* **Filters:** Chuyên khoa (Specialization), Lịch trống (Availability).

### 2.3. Đội Ngũ Bác Sĩ (Specialists)
* **Layout:** Bộ Filters -> Grid hoặc List `DoctorCard`.
* **Filters:** Phòng ban (Department), Lịch trống (Availability), Sắp xếp (Sort).
* **Luồng Booking:** Bấm `Book` sẽ mở modal QuickBooking (pre-filled thông tin bác sĩ).

### 2.4. Dịch Vụ & Bảng Giá (Services)
* **Layout:** Bộ lọc danh mục (Category filter) -> Grid `ServiceCard`.

### 2.5. Tin Tức (Posts)
* **Trang danh sách:** Grid/Stack hiển thị `PostCard` (Thumbnail, Title, Excerpt, Date).
* **Trang chi tiết:** Full nội dung bài viết, Author, Date, Share buttons, Tags, Bài viết liên quan. Yêu cầu render đủ thẻ Meta SEO (Title, Description, og:image).

### 2.6. Liên Hệ (Contact)
* **Layout (2 cột trên Desktop):**
  * Cột trái: `ContactForm` (Name, Email, Phone, Subject, Message).
  * Cột phải: Thông tin địa chỉ, Hotline, Giờ làm việc, FAQ Accordion.

---

## 3. COMPONENT INVENTORY

Danh sách các UI Component tái sử dụng và Props dự kiến:

| Tên Component | Props (Data) | Events (Actions) |
| :--- | :--- | :--- |
| **Header / Nav** | `user` (nếu đã login) | `onLogin`, `onLogout`, toggle mobile menu |
| **QuickBooking** | `departments`, `doctors` | `onSubmit` (gọi API đặt lịch), `onSuccess`, `onError` |
| **DepartmentCard**| `name`, `iconUrl`, `description`, `doctorCount` | `onViewDoctors` |
| **DoctorCard** | `id`, `avatar`, `fullName`, `specialization`, `rating`, `nextSlot` | `onBook`, `onViewProfile` |
| **ServiceCard** | `title`, `description`, `priceRange` | `onDetail` |
| **PostCard** | `title`, `excerpt`, `date`, `thumbnail` | `onRead` |
| **Carousel** | `items`, `slidesToShow`, `autoplay`, `dots` | N/A |

---

## 4. TÍCH HỢP API (API CONTRACTS)

### 4.1. Đặt lịch nhanh (Public - Không cần đăng nhập)
* **Endpoint:** `POST /api/booking`
* **Payload (Body):**
  ```json
  {
    "name": "Nguyen Van A",
    "phone": "0912345678",
    "department": "Nội tổng hợp",
    "doctor": "TS. Bác sĩ B",
    "time": "2026-05-21T09:30"
  }

  {
  "success": true,
  "message": "Booking created",
  "data": { "_id": "64abc123...", "name": "Nguyen Van A" }
}
4.2. Đặt lịch (Đã xác thực - Logged in)
Endpoint: POST /api/scheduling/appointments

Headers: Authorization: Bearer <token>

Payload (Body):

JSON
{
  "patientId": "user_123",
  "doctorId": "doc_456",
  "departmentId": "dept_789",
  "timeSlot": "2026-05-21T09:30",
  "reason": "Khám tổng quát"
}
4.3. Lấy danh sách (GET APIs)
Danh sách Khoa: GET /api/scheduling/departments?search=&page=&limit=

Mẫu Response: { "success": true, "data": [{ "_id", "departmentName", "description", "iconUrl" }] }

Danh sách Bác sĩ: GET /api/clinical/doctors?department=&available=&page=&limit=

Danh sách Dịch vụ: GET /api/billing/services

Danh sách Bài viết: GET /api/cms/posts?page=&limit=&tag=

Chi tiết Bài viết: GET /api/cms/posts/:slug

4.4. Gửi Form Liên Hệ
Endpoint: POST /api/cms/contact

Payload (Body): { "name", "email", "phone", "subject", "message" }

5. YÊU CẦU KỸ THUẬT & TRẢI NGHIỆM NGƯỜI DÙNG (UX/A11Y)
Trạng thái UI (States):

Loading: Sử dụng Skeletons cho ảnh Hero, các list Cards, và form QuickBooking khi fetch data. Nút submit phải có spinner (vô hiệu hóa bấm 2 lần).

Empty: Hiển thị illustration/text phù hợp khi không tìm thấy bác sĩ/khoa.

Success/Error: Thông báo dạng inline banner. Auto ẩn sau 3-5s với thông báo thành công.

Form Validation:

name và phone là trường bắt buộc (Required).

Check Regex cho số điện thoại (Phone pattern check).

Khả năng tiếp cận (Accessibility - a11y):

Tất cả input bắt buộc phải có <label>. Các trường bắt buộc phải có dấu * hoặc indicator rõ ràng.

Độ tương phản màu sắc (Color contrast) >= 4.5:1.

Hỗ trợ điều hướng bằng bàn phím (Keyboard navigation) và hiển thị rõ trạng thái :focus.

Sử dụng thuộc tính role="status" hoặc aria-live cho các thông báo lỗi/thành công để Screen Reader đọc được.

Modal: Trap focus bên trong modal khi mở, hỗ trợ phím ESC để đóng.