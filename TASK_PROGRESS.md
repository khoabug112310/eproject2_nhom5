# Task tiến độ hiện tại

## Mục tiêu chính
- Cập nhật giao diện và luồng trạng thái lịch hẹn bệnh nhân.
- Hiển thị riêng:
  - Trạng thái lịch hẹn: `Đã xác nhận (Do bác sĩ chỉ định)`, `Chờ CSKH xác nhận`, `Hoàn thành`, `Đã hủy`.
  - Trạng thái thanh toán: `Thanh toán sau tại phòng khám`, `Chờ thanh toán`, `Đã thanh toán`.
- Thêm nút `Thanh toán trước` cho lịch khám đã xác nhận với hóa đơn khám chưa thanh toán.
- Thêm ghi chú nhắc nhở gần lịch hẹn: SMS/Zalo 2-3 ngày trước.

## File đã sửa
- `frontend/src/pages/patient/Dashboard.jsx`
- `frontend/src/pages/staff/Dashboard.jsx` (NEW)
- `frontend/src/components/DoctorScheduleModal.jsx` (NEW)
- `backend/src/modules/clinical/controller.js`
- `frontend/src/services/api.js`

## Trạng thái hiện tại
- ✅ Cập nhật hiển thị trạng thái lịch hẹn và thanh toán
- ✅ Thêm nút thanh toán trước cho lịch đã xác nhận có hóa đơn khám chưa thanh toán
- ✅ Thêm ghi chú nhắc nhở khi lịch hẹn nằm trong vòng 3 ngày
- ✅ **NEW**: Thêm tính năng "Staff CSKH - Kiểm tra Lịch Bác Sĩ & Đổi Bác Sĩ"
  - Staff có thể kiểm tra lịch làm việc của bác sĩ
  - Staff có thể đổi bác sĩ khác nếu bác sĩ cũ bận
  - Tự động kiểm tra sức chứa trước khi xác nhận
  - Hóa đơn khám tự động được tạo khi xác nhận

## Ghi chú
- Bản ghi này nằm ở file `TASK_PROGRESS.md` trong thư mục gốc của dự án
- Chi tiết tính năng mới xem tại [STAFF_DOCTOR_SCHEDULE_FEATURE.md](STAFF_DOCTOR_SCHEDULE_FEATURE.md)
