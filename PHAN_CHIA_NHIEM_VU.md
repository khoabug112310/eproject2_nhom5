# BẢNG PHÂN CHIA NHIỆM VỤ DỰ ÁN (CLINIC MANAGEMENT SYSTEM)

Dưới đây là bảng phân chia chi tiết các task chức năng theo từng trang (Page), Layout, Component và các API, Model ở Backend cho từng thành viên trong nhóm 5.

---

## 📋 TỔNG QUAN PHÂN CHIA VAI TRÒ

| Thành viên | Phụ trách chính | Các trang & Layout liên quan | Phạm vi Backend tương ứng |
| :--- | :--- | :--- | :--- |
| **1. Sơn** | **Trang chủ & Các trang công cộng (Public)** | Home, Departments, Specialists, Services, News, Contact, Login, PublicLayout | `cms` (Posts, Inquiries), `booking` (Quick Booking), `scheduling/departments` (Public) |
| **2. Hợp** | **Cổng Bác sĩ & Cổng Kế toán** | Doctor Schedule (Khám bệnh, kê đơn), Accountant Dashboard (Hóa đơn, doanh thu), Doctor/Accountant Layout | `clinical` (Medical Records, Prescriptions, Medicines), `billing` (Invoices, Payments) |
| **3. Khoa** | **Cổng Bệnh nhân & Chăm sóc khách hàng (Staff)**| Patient Dashboard (Đặt lịch, Xem hồ sơ, Thanh toán), Staff Dashboard (Hàng đợi tiếp nhận, Điền thông tin & Duyệt) | `scheduling/appointments` (Book, Cancel, Confirm), `profiles/patients` (EHR Profile) |
| **4. Tài** | **Cổng Admin & Tích hợp (Merge Code)** | Admin Dashboard (Thống kê, Quản lý TK nội bộ, CMS bài viết), AdminLayout, RouteGuards, DB Migration | `profiles/users` (Auth, Create Doctor/Staff), Git Merge, Test & Deploy, Seed dữ liệu |

---

## 👤 CHI TIẾT PHÂN CHIA TASK CHO TỪNG THÀNH VIÊN

### 1. Sơn — Trang chủ & Giao diện công cộng (Public Pages)
**Mục tiêu:** Xây dựng toàn bộ giao diện công cộng, thân thiện, tương tác mượt mà, tối ưu SEO và Responsive.

#### Giao diện (Frontend)
- `[ ]` **Layout chung công cộng:** Thiết kế [PublicLayout.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/layouts/PublicLayout.jsx) gồm Header (Logo, Nav 6 items, nút Đặt lịch nhanh) và Footer (Thông tin liên hệ, hotline, giờ mở cửa).
- `[ ]` **Trang chủ (Home):** Phát triển [Home.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Home.jsx) tích hợp:
  - Hero section sống động, hỗ trợ nút cuộn mượt xuống Form đặt lịch nhanh.
  - Widget [HeroSlideshow.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/layouts/HeroSlideshow.jsx) trình chiếu ảnh nổi bật phòng khám.
  - Danh sách Khoa lâm sàng nổi bật (sử dụng `DepartmentCard`).
  - Đội ngũ bác sĩ tiêu biểu (Carousel trượt hiển thị `DoctorCard`).
  - Gói khám sức khỏe phổ biến (Grid hiển thị `ServiceCard` tĩnh kèm giá).
  - 3 Tin tức mới nhất (`PostCard`).
- `[ ]` **Form Đặt lịch nhanh (Quick Booking):** Xây dựng component `QuickBooking` (cho phép đặt khám nhanh không cần đăng nhập: Họ tên, SĐT, Chọn Khoa, Bác sĩ, Giờ khám). *Logic UX: Khi chọn Khoa sẽ lọc danh sách Bác sĩ tương ứng.*
- `[ ]` **Trang Danh sách Chuyên khoa:** Phát triển [Departments.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Departments.jsx) hỗ trợ tìm kiếm và lọc khoa theo trạng thái trống lịch.
- `[ ]` **Trang Danh sách Bác sĩ:** Phát triển [Specialists.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Specialists.jsx) hiển thị danh sách bác sĩ kèm bộ lọc Khoa. Bấm nút `Đặt lịch` sẽ tự động điền (pre-fill) tên bác sĩ đó vào Form Đặt lịch nhanh.
- `[ ]` **Trang Dịch vụ & Bảng giá:** Phát triển [Services.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Services.jsx) trình bày danh mục và đơn giá dịch vụ.
- `[ ]` **Trang Tin tức & Bài viết:** Phát triển [Posts.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Posts.jsx) bao gồm trang danh sách tin tức (phân trang) và trang chi tiết bài viết (tối ưu hóa các thẻ meta SEO tiêu đề, mô tả).
- `[ ]` **Trang Liên hệ:** Phát triển [Contact.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/public/Contact.jsx) gồm Form gửi liên hệ (Họ tên, Email, SĐT, Nội dung) kết hợp Bản đồ & FAQ.
- `[ ]` **Trang Đăng nhập:** Phát triển [Login.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/auth/Login.jsx) với giao diện đăng nhập tối giản, hiện đại.

#### Xử lý API & Backend (BE)
- `[ ]` Phát triển Route/Controller cho **Quick Booking**: `POST /api/booking` (lưu yêu cầu đặt lịch nhanh của khách vãng lai chưa có tài khoản).
- `[ ]` Phát triển Route/Controller cho **Gửi liên hệ**: `POST /api/cms/contact-inquiries` để ghi nhận các góp ý/yêu cầu hỗ trợ từ trang liên hệ.
- `[ ]` Phát triển API lấy danh sách bài viết công khai: `GET /api/cms/posts` và chi tiết bài viết: `GET /api/cms/posts/:slug`.

---

### 2. Hợp — Bác sĩ & Kế toán (Clinical & Billing Management)
**Mục tiêu:** Xây dựng hai luồng nghiệp vụ quan trọng nhất của phòng khám: Khám bệnh/Kê đơn thuốc (Bác sĩ) và Quản lý hóa đơn/Thu tiền/Báo cáo (Kế toán).

#### Giao diện (Frontend)
- `[ ]` **Cổng Bác sĩ (Doctor Portal):** Phát triển [Schedule.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/doctor/Schedule.jsx) với 3 Tab chính:
  - **Danh sách bệnh nhân trong ngày:** Hiển thị hàng đợi các ca đã duyệt.
  - **Buồng khám bệnh (Examination Workspace):** Khi chọn bệnh nhân, hiển thị tiền sử bệnh án cũ bên trái; biểu mẫu khám bệnh bên phải (ghi chỉ số sinh tồn: chiều cao, cân nặng, huyết áp, nhịp tim, nhiệt độ; ghi chẩn đoán và lời dặn).
  - **Hệ thống kê đơn thuốc:** Tìm kiếm thuốc trong kho theo thời gian thực (real-time dropdown), điền số lượng, liều dùng, tần suất, số ngày uống và thêm vào đơn thuốc tạm thời.
  - **Tra cứu hồ sơ bệnh án toàn phòng khám:** Tìm kiếm hồ sơ cũ của bất kỳ bệnh nhân nào và hiển thị đơn thuốc đã kê.
  - **Lịch trực của tôi:** Xem danh sách các ca trực được phân công kèm tiến độ số lượng bệnh nhân đã đặt khám trên thanh progress bar.
- `[ ]` **Cổng Kế toán (Accountant Dashboard):** Phát triển [Dashboard.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/accountant/Dashboard.jsx) với:
  - **Quản lý hóa đơn:** Danh sách hóa đơn y tế (Phí khám lâm sàng, tiền thuốc đơn). Tìm kiếm theo tên BN, SĐT, mã hóa đơn. Bộ lọc theo loại hóa đơn và trạng thái thanh toán.
  - **Duyệt thu tiền mặt/chuyển khoản:** Xác nhận trạng thái thanh toán của hóa đơn, cập nhật ngày giờ thanh toán thực tế.
  - **Xem & In Biên lai:** Hiển thị hóa đơn chi tiết dạng biên lai (thông tin bệnh nhân, chi tiết từng loại thuốc kê đơn kèm đơn giá, số lượng, thành tiền, tổng tiền). Hỗ trợ nút Print/In trực tiếp qua browser.
  - **Báo cáo tài chính ngày:** Thống kê tổng doanh thu thực thu trong ngày hôm nay, tách riêng doanh thu khám lâm sàng và doanh thu bán thuốc.

#### Xử lý API & Backend (BE)
- `[ ]` **Nghiệp vụ Hóa đơn (Billing):**
  - Đồng bộ Model [Invoice.js](file:///c:/T32503.E1/eProject_2/backend/src/models/Invoice.js) theo schema mới (Thêm `invoiceType` là `Consultation` hoặc `Pharmacy`, cập nhật trạng thái `Status`, trường `totalAmount`, `paidAt`, `processedBy`).
  - Xây dựng Model mới [Invoice_Detail.js](file:///c:/T32503.E1/eProject_2/backend/src/models/Invoice_Detail.js) lưu thông tin chi tiết các loại thuốc trong hóa đơn.
  - Viết API thanh toán hóa đơn: `POST /api/billing/invoices/:id/pay` cập nhật trạng thái thanh toán, lưu thông tin nhân viên kế toán thu tiền.
- `[ ]` **Nghiệp vụ Lâm sàng (Clinical):**
  - Viết API tạo bệnh án mới: `POST /api/clinical/medical-records`.
  - Viết API tạo đơn thuốc đi kèm bệnh án: `POST /api/clinical/prescriptions` (hệ thống tự động trừ kho số lượng thuốc khả dụng trong kho thuốc).
  - Viết API tìm kiếm thuốc phục vụ chức năng kê đơn: `GET /api/clinical/medicines`.

---

### 3. Khoa — Bệnh nhân & Chăm sóc khách hàng (EHR & Staff Workflow)
**Mục tiêu:** Phát triển toàn bộ luồng trải nghiệm của người bệnh (đặt lịch, xem bệnh án, thanh toán online) và luồng xử lý của nhân viên lễ tân/CSKH (đón tiếp, cập nhật thông tin và duyệt lịch).

#### Giao diện (Frontend)
- `[ ]` **Cổng Bệnh nhân (Patient Portal):** Phát triển [Dashboard.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/patient/Dashboard.jsx) chứa các Tab:
  - **Lịch hẹn của tôi:** Danh sách lịch hẹn đang chờ duyệt, đã xác nhận, đã khám xong hoặc đã hủy. Cho phép hủy lịch nếu trạng thái là "Chờ xác nhận".
  - **Đặt lịch khám mới:** Chọn chuyên khoa, chọn bác sĩ chỉ định, chọn ngày khám, khung giờ khám (load động theo lịch trực khả dụng của bác sĩ) và ghi mô tả triệu chứng.
  - **Xem Hồ sơ bệnh án điện tử (EHR):** Xem danh sách lịch sử các lần đến khám kèm chỉ số sinh tồn và đơn thuốc chi tiết của từng đợt khám.
  - **Thanh toán Viện phí & Thuốc online:** Danh sách hóa đơn cá nhân. Tích hợp cổng thanh toán giả lập (cho phép chọn ví điện tử hoặc chuyển khoản ngân hàng, có hiệu ứng loading chờ xử lý thanh toán 2s).
  - **Cập nhật Thông tin cá nhân:** Form điền CCCD, Mã bảo hiểm y tế (BHYT), Liên hệ khẩn cấp, địa chỉ thường trú để tự động đồng bộ vào hồ sơ bệnh án.
- `[ ]` **Cổng CSKH/Lễ tân (Staff Dashboard):** Phát triển [Dashboard.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/staff/Dashboard.jsx) hỗ trợ các nghiệp vụ:
  - **Hàng đợi tiếp nhận khám bệnh:** Hiển thị danh sách các yêu cầu đặt lịch hẹn. Phân chia rõ ràng "Lịch đặt qua tài khoản bệnh nhân" và "Lịch đặt nhanh (vãng lai)".
  - **Điền thông tin & Duyệt (cho Lịch đặt nhanh):** Mở Modal yêu cầu lễ tân phỏng vấn khách hàng để thu thập đầy đủ thông tin (Họ tên, SĐT, Ngày sinh, Giới tính, CCCD, Địa chỉ). Sau khi điền đủ thì mới cho phép bấm nút duyệt xác nhận.
  - **Duyệt trực tiếp:** Đối với bệnh nhân đã có tài khoản và đầy đủ hồ sơ, CSKH có thể duyệt trực tiếp. Hệ thống tự sinh hóa đơn khám lâm sàng.
  - **Hủy yêu cầu đặt lịch:** CSKH có thể hủy lịch hẹn và ghi lý do hủy (ví dụ: trùng lịch bác sĩ khẩn cấp).

#### Xử lý API & Backend (BE)
- `[ ]` **Quản lý Đặt lịch (Scheduling):**
  - Viết API đặt lịch hẹn: `POST /api/scheduling/appointments` (tạo bản ghi lịch hẹn ở trạng thái `Pending`).
  - Viết API cập nhật trạng thái lịch hẹn: `PUT /api/scheduling/appointments/:id` (dùng để CSKH duyệt chuyển thành `Confirmed`, hoặc hủy chuyển thành `Canceled`).
  - *Logic Backend quan trọng:* Khi cập nhật trạng thái lịch hẹn sang `Confirmed`, hệ thống tự động sinh ra một hóa đơn khám lâm sàng (`Consultation`) tương ứng với bác sĩ và khoa đó, gán cho bệnh nhân.
- `[ ]` **Quản lý Bệnh nhân (Profiles):**
  - Viết API lấy danh sách bệnh nhân và thông tin cá nhân: `GET /api/profiles/patients`.

---

### 4. Tài — Quản trị viên & Tích hợp mã nguồn (Admin, CMS & Merge Code)
**Mục tiêu:** Phát triển trang quản trị hệ thống (Analytics, Quản lý tài khoản, CMS tin tức), làm nền tảng kỹ thuật cho dự án (Routing, Route Guard, Axios Interceptors) và chịu trách nhiệm Merge Code / Giải quyết xung đột trên Git.

#### Giao diện (Frontend)
- `[ ]` **Cổng Admin (Admin Dashboard):** Phát triển [Dashboard.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/pages/admin/Dashboard.jsx) với 4 Tab:
  - **Báo cáo & Thống kê (Analytics):** Biểu đồ SVG thể hiện tăng trưởng doanh thu (Hôm nay, Tuần này, Tháng này) và Gauge bar thể hiện cơ cấu nguồn thu (Khám bệnh lâm sàng vs Nhà thuốc).
  - **Giám sát quy trình khám (Timeline Audit):** Hiển thị quy trình 5 bước trực quan của từng bệnh nhân đang khám tại viện (Đặt lịch -> CSKH duyệt -> Đóng phí lâm sàng -> Bác sĩ khám/kê đơn -> Thanh toán nhận thuốc). Giúp Admin bao quát toàn phòng khám.
  - **Quản lý tài khoản mới:** Đăng ký tài khoản nội bộ cho Bác sĩ, CSKH, Kế toán. *Logic: Nếu vai trò là Bác sĩ thì hiện thêm các trường Chuyên khoa, Khoa lâm sàng trực thuộc, Phí khám cơ bản, Số năm kinh nghiệm, Tiểu sử.*
  - **Quản trị tin tức CMS:** Soạn thảo bài viết mới (Tiêu đề, Ảnh bìa URL, Trạng thái Draft/Published, Nội dung chi tiết). Danh sách bài viết hiện tại kèm chức năng Chỉnh sửa (Edit) và Xóa (Delete).
- `[ ]` **Kiến trúc Router & Bảo vệ tuyến đường:**
  - Thiết lập file [index.jsx](file:///c:/T32503.E1/eProject_2/frontend/src/routes/index.jsx) định nghĩa toàn bộ Route của ứng dụng.
  - Triển khai component `RoleGuard` để kiểm tra quyền truy cập của từng role (admin, doctor, staff, accountant, patient), điều hướng người dùng về trang đăng nhập nếu chưa xác thực hoặc không đủ quyền.

#### Xử lý API & Backend (BE) & DevOps
- `[ ]` **Cơ sở hạ tầng API & Auth:**
  - Viết API đăng ký tài khoản (nội bộ và bệnh nhân): `POST /api/auth/register`.
  - Viết API lấy thông tin người dùng hiện tại từ JWT: `GET /api/auth/me` để FE xác thực phiên đăng nhập.
  - Viết các Middlewares xác thực JWT (`verifyToken`) và kiểm tra phân quyền RBAC (`checkRole`).
- `[ ]` **Thống kê Admin:**
  - Viết API tổng hợp số liệu analytics: `GET /api/profiles/admin/stats` phục vụ biểu đồ SVG và thống kê theo thời gian (ngày/tuần/tháng).
- `[ ]` **Tích hợp & Quản trị mã nguồn (Merge Code):**
  - Cấu hình Axios Client chung với Interceptor tự động đính kèm `Authorization: Bearer <token>` vào mọi request, và bắt lỗi 401 để xóa token cũ, tự động điều hướng về `/login`.
  - Phụ trách chính việc kéo (pull) code của các thành viên, giải quyết các xung đột merge (merge conflicts) trên Git.
  - Viết script seed cơ sở dữ liệu ban đầu [seed.js](file:///c:/T32503.E1/eProject_2/backend/src/config/seed.js) để cả nhóm có sẵn dữ liệu test (tài khoản mẫu, khoa mẫu, bác sĩ mẫu, thuốc mẫu).

---

## 🛠️ QUY TRÌNH PHỐI HỢP & HOÀN THÀNH TASK

1. **Giao tiếp API (API Contracts):**
   - Backend Developer (Hợp, Tài, Khoa) phải chốt định dạng Request/Response với Frontend Developer trước khi viết logic chi tiết.
   - Luôn sử dụng format response thống nhất trong [PROJECT_GUIDELINES.md](file:///c:/T32503.E1/eProject_2/PROJECT_GUIDELINES.md).
2. **Quy trình Git & Merge code (Tài phụ trách):**
   - Mỗi thành viên tạo branch riêng từ `main` (ví dụ: `feature/son-public`, `feature/hop-doctor`, `feature/khoa-patient`, `feature/tai-admin`).
   - Sau khi hoàn thành và tự test cục bộ, tạo Pull Request (PR) về branch `develop`/`main`.
   - **Tài** sẽ thực hiện review code, giải quyết conflict (nếu có) và merge code để đảm bảo ứng dụng không bị lỗi sau khi tích hợp.
3. **Kiểm thử liên thông (Integration Testing):**
   - Sau khi Tài merge code, các thành viên kéo code mới nhất về máy và thực hiện kiểm tra chéo luồng chạy:
     - *Bệnh nhân đặt lịch -> Lễ tân duyệt -> Kế toán thu tiền lâm sàng -> Bác sĩ khám bệnh & kê đơn -> Kế toán thu tiền thuốc -> Bệnh nhân nhận thuốc.*
