# HƯỚNG DẪN QUẢN LÝ NHÁNH VÀ QUY TẮC MERGE CODE
## Dự án: Clinic Management System (Nhom 5)

Để đảm bảo mã nguồn hoạt động ổn định, tránh xung đột chéo (conflict) và không làm ảnh hưởng đến các chức năng của các trang khác khi tích hợp dữ liệu, toàn bộ thành viên trong nhóm cần tuân thủ nghiêm ngặt các quy tắc phân chia nhánh và quy trình merge dưới đây.

---

## I. NGUYÊN TẮC PHÂN CHIA NHÁNH (BRANCH SCOPE)

Mỗi nhánh chỉ chịu trách nhiệm nhận thay đổi trong phạm vi chức năng được phân công. Tuyệt đối không tự ý thay đổi file ngoài phạm vi nhánh của mình trừ khi có sự đồng ý của Admin (Tài) hoặc thảo luận chung.

### 1. Nhánh `TrangChu` (Sơn phụ trách)
*   **Phạm vi chức năng:** Các trang công cộng (Public Pages), Đăng nhập (Login), Đăng ký (Register), Đặt lịch nhanh (Quick Booking).
*   **Các thư mục/files liên quan:**
    *   `frontend/src/pages/public/` (Home.jsx, Departments.jsx, Specialists.jsx, Services.jsx, Posts.jsx, Contact.jsx)
    *   `frontend/src/pages/auth/Login.jsx`
    *   `frontend/src/components/LoginModal.jsx`, `RegisterModal.jsx`, `Hero.jsx`, `Footer.jsx`, `Header.jsx`
    *   `frontend/src/layouts/PublicLayout.jsx`
    *   `backend/src/modules/auth/` (Đăng ký/Đăng nhập hệ thống)
    *   `backend/src/modules/booking/` (API Đặt lịch nhanh)
    *   `backend/src/modules/cms/` (API Bài viết, Liên hệ công cộng)

### 2. Nhánh `BS_KT` (Hợp phụ trách)
*   **Phạm vi chức năng:** Cổng Bác sĩ (Doctor Portal - Lịch trực, Khám bệnh, Kê đơn) và Cổng Kế toán (Accountant Portal - Hóa đơn, Doanh thu, Thu tiền).
*   **Các thư mục/files liên quan:**
    *   `frontend/src/pages/doctor/` (Schedule.jsx, ...)
    *   `frontend/src/pages/accountant/` (Dashboard.jsx, ...)
    *   `frontend/src/layouts/DoctorLayout.jsx`
    *   `backend/src/modules/clinical/` (API Bệnh án, Đơn thuốc, Kho thuốc)
    *   `backend/src/modules/billing/` (API Hóa đơn, Thanh toán tại quầy)

### 3. Nhánh `BenhNhan_CSKH` (Khoa phụ trách)
*   **Phạm vi chức năng:** Cổng Bệnh nhân (Patient Portal - Lịch hẹn cá nhân, Xem bệnh án EHR, Đặt lịch hẹn, Thanh toán online) và Cổng Lễ tân/CSKH (Staff Portal - Hàng đợi tiếp nhận, Điền thông tin & Duyệt lịch).
*   **Các thư mục/files liên quan:**
    *   `frontend/src/pages/patient/` (Dashboard.jsx, ...)
    *   `frontend/src/pages/staff/` (Dashboard.jsx, ...)
    *   `frontend/src/layouts/PatientLayout.jsx`
    *   `backend/src/modules/scheduling/` (API Đặt & Duyệt/Hủy lịch hẹn)
    *   `backend/src/modules/profiles/` (API Hồ sơ bệnh nhân, bệnh án điện tử)

### 4. Nhánh `Admin` (Tài phụ trách)
*   **Phạm vi chức năng:** Cổng Admin (Admin Dashboard - Thống kê doanh thu, Quy trình khám timeline audit, Tạo tài khoản nhân viên, Quản trị bài viết CMS).
*   **Các thư mục/files liên quan:**
    *   `frontend/src/pages/admin/` (Dashboard.jsx, AdminDashboard.css)
    *   `frontend/src/layouts/AdminLayout.jsx`
    *   `frontend/src/routes/` (Cấu hình Router chung & `RoleGuard`)
    *   `backend/src/config/seed.js` (Dữ liệu mẫu ban đầu)
    *   `backend/src/middlewares/auth.js`, `rbac.js` (Bảo mật quyền truy cập)

---

## II. LƯU Ý QUAN TRỌNG: TRÁNH LỖI SUBMODULE VÔ Ý
Trong các commit gần đây trên nhánh `TrangChu`, đã xuất hiện thư mục liên kết submodule **`eproject2_nhom5`** trỏ ngược về chính repository ở commit cũ. 

**Nguyên nhân:**
Thành viên vô tình chạy lệnh `git init` hoặc clone repository vào một thư mục con cùng tên bên trong dự án, sau đó thực hiện lệnh `git add .` từ thư mục gốc. Git sẽ nhận diện thư mục con này là một Submodule (Gitlink 160000) và không theo dõi code thực tế bên trong nó lên repository chính. Điều này khiến cho code bạn viết thực tế **bị mất** trên Git chính.

**Cách phòng tránh:**
1.  Tuyệt đối không tạo hoặc khởi tạo Git (`git init`) trong bất kỳ thư mục con nào của dự án.
2.  Nếu bạn lỡ sao chép thư mục dự án vào trong chính nó, hãy xóa thư mục ẩn `.git` bên trong thư mục con đó trước khi `git add`.
3.  Trước khi commit, hãy dùng lệnh `git status` để kiểm tra danh sách file. Nếu thấy xuất hiện một thư mục có dạng `new file: path/to/folder` mà không hiển thị các file con bên trong (hoặc có ký hiệu submodule), cần dừng lại và xử lý ngay.
4.  Nếu phát hiện đã lỡ commit submodule lỗi, dùng lệnh sau để xóa liên kết:
    ```bash
    git rm --cached ten_thu_muc_submodule
    ```

---

## III. QUY TRÌNH MERGE CODE AN TOÀN VÀO NHÁNH `main`

Để tránh việc merge nhầm code hoặc đè dữ liệu lỗi lên nhánh `main`, người phụ trách Merge Code (Tài) cần thực hiện theo các bước sau:

### Bước 1: Cập nhật thông tin các nhánh cục bộ
```bash
git checkout main
git pull origin main
git fetch origin
```

### Bước 2: Kiểm tra các file thay đổi trên nhánh cần merge
Trước khi gộp nhánh, hãy kiểm tra danh sách file đã thay đổi trên nhánh đó so với `main` để xác nhận xem có file nào ngoài phạm vi chức năng (out of scope) bị thay đổi hay không:
```bash
git diff --name-only main origin/TrangChu
```
*(Thay thế `origin/TrangChu` bằng nhánh bạn cần merge, ví dụ `origin/BS_KT` hoặc `origin/BenhNhan_CSKH`)*

> [!WARNING]
> Nếu danh sách trả về chứa các file không thuộc phạm vi của nhánh đó (ví dụ nhánh `TrangChu` nhưng lại sửa đổi file trong `frontend/src/pages/doctor/`), người merge code phải từ chối merge trực tiếp và yêu cầu thành viên đó hoàn tác (revert) hoặc tách riêng các file không liên quan trước.

### Bước 3: Thực hiện dry-run/Merge thử nghiệm không commit
Thực hiện merge thử nghiệm không tự động commit để kiểm tra xung đột:
```bash
git merge origin/TrangChu --no-commit --no-ff
```
*   Nếu có conflict: Tiến hành giải quyết conflict bằng công cụ Merge Editor của VS Code.
*   Nếu không có conflict: Chạy thử ứng dụng (`npm run dev`) cả frontend và backend để đảm bảo mọi chức năng cơ bản hoạt động bình thường trước khi xác nhận merge.

### Bước 4: Commit và Push lên main
Sau khi kiểm tra mọi thứ hoạt động ổn định:
```bash
git commit -m "Merge branch 'TrangChu' into main"
git push origin main
```

---

## IV. BẢNG TỔNG HỢP KIỂM TRA PHẠM VI FILE KHI MERGE (CHEATSHEET)

| Nhánh nguồn | Thư mục được phép sửa | Thư mục KHÔNG được phép sửa |
| :--- | :--- | :--- |
| **TrangChu** | `/pages/public`, `/pages/auth/Login.jsx`, `/components/LoginModal.jsx`, `RegisterModal.jsx`, `Hero.jsx`, `/modules/auth` | `/pages/doctor`, `/pages/accountant`, `/pages/patient`, `/pages/staff`, `/pages/admin` |
| **BS_KT** | `/pages/doctor`, `/pages/accountant`, `/modules/clinical`, `/modules/billing` | `/pages/public`, `/pages/patient`, `/pages/staff`, `/pages/admin` |
| **BenhNhan_CSKH** | `/pages/patient`, `/pages/staff`, `/modules/scheduling`, `/modules/profiles/patients` | `/pages/public`, `/pages/doctor`, `/pages/accountant`, `/pages/admin` |
| **Admin** | `/pages/admin`, `/routes/index.jsx`, `/config/seed.js`, `/middlewares` | Sửa trực tiếp UI của các cổng phân quyền khác (trừ phi tích hợp layout) |
