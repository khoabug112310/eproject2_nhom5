# Tính năng: Staff CSKH - Kiểm tra Lịch Bác Sĩ & Đổi Bác Sĩ

## Tổng quan
Tính năng cho phép nhân viên CSKH (Customer Service) kiểm tra lịch làm việc của bác sĩ và có thể đổi bác sĩ khác nếu bác sĩ đó bận trước khi xác nhận lịch khám cho bệnh nhân.

## Luồng hoạt động

### 1. Staff xem danh sách lịch khám
- Staff vào **Staff Dashboard** → **Lịch chờ duyệt**
- Danh sách hiển thị các lịch khám cần xử lý (status = Pending)
- Lịch được chia thành 2 nhóm:
  - **Khách có tài khoản**: Các bệnh nhân đã đăng ký tài khoản
  - **Khách vãng lai**: Các bệnh nhân đặt lịch nhanh (qua form nhanh)

### 2. Kiểm tra lịch bác sĩ
- Ở mỗi lịch khám (dòng chi tiết), Staff bấm nút **📅 Lịch bác sĩ**
- Modal **"Kiểm tra lịch bác sĩ & Đổi bác sĩ"** sẽ mở ra
- Modal hiển thị:
  - **Thông tin lịch khám**: Ngày, giờ, phòng ban
  - **Bác sĩ hiện tại**: Tên, chuyên khoa, lịch làm việc, sức chứa (số bệnh nhân đã đặt / sức chứa tối đa)
  - **Danh sách bác sĩ khác**: Dropdown để chọn bác sĩ cùng phòng ban

### 3. Chọn bác sĩ khác
- Staff chọn bác sĩ khác từ dropdown
- Modal tự động tải lịch làm việc của bác sĩ mới
- Hiển thị trạng thái: Còn trống ✓ hoặc Đã kín ✗

### 4. Xác nhận
- Nếu bác sĩ mới còn chỗ trống:
  - Bấm **"Xác nhận"** để lưu thay đổi
  - Lịch khám sẽ được cập nhật với bác sĩ mới
  - Status thay đổi thành "Confirmed"
  - Hóa đơn khám sẽ tự động được tạo
  - Thông báo thành công hiển thị

- Nếu bác sĩ mới đã kín:
  - Nút **"Xác nhận"** sẽ bị vô hiệu hóa (disabled)
  - Staff cần chọn bác sĩ khác có trống chỗ

- Nút **"Hủy"**:
  - Đóng modal mà không thay đổi gì

## UI Components

### Modal: DoctorScheduleModal
**File**: `frontend/src/components/DoctorScheduleModal.jsx`

**Props**:
- `appointment`: Object lịch khám hiện tại
- `onClose`: Function đóng modal
- `onConfirm`: Function xác nhận (nhận newDoctorId)
- `isLoading`: Boolean cho trạng thái loading

**States**:
- `selectedDoctorId`: ID bác sĩ được chọn
- `doctors`: Danh sách bác sĩ từ cùng phòng ban
- `schedules`: Lịch làm việc của các bác sĩ
- `loadingSchedules`: Trạng thái loading lịch

### Dashboard Updates
**File**: `frontend/src/pages/staff/Dashboard.jsx`

**State mới**:
```javascript
const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
const [selectedAppointmentForSchedule, setSelectedAppointmentForSchedule] = useState(null);
```

**Handler mới**:
- `handleOpenDoctorScheduleModal(appt)`: Mở modal
- `handleConfirmDoctorChange(newDoctorId)`: Xử lý xác nhận

**Button mới**:
- Nút **"📅 Lịch bác sĩ"** (class: `btn btn-info btn-xs`)

## API Endpoints sử dụng

### 1. GET /api/clinical/doctors
Lấy danh sách bác sĩ theo phòng ban

**Query Parameters**:
- `department`: ID phòng ban (bắt buộc)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "doc_id",
      "fullName": "TS. Bác sĩ Nguyễn Văn A",
      "specialization": "Tim mạch",
      "departmentId": "dept_id",
      "department": "Khoa Tim mạch",
      "baseFee": 150000
    }
  ]
}
```

### 2. GET /api/scheduling/schedules
Lấy lịch làm việc của bác sĩ theo ngày

**Query Parameters**:
- `doctor`: ID bác sĩ (bắt buộc)
- `date`: Ngày (optional, format: YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "schedule_id",
      "doctorId": "doc_id",
      "workDate": "2026-05-21T00:00:00Z",
      "startTime": "09:00",
      "endTime": "12:00",
      "maxPatients": 5,
      "currentBooked": 3,
      "status": "Available"
    }
  ]
}
```

### 3. PUT /api/scheduling/appointments/:id
Cập nhật lịch khám (đổi bác sĩ và xác nhận)

**Request Body**:
```json
{
  "doctorId": "new_doctor_id",
  "status": "Confirmed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Cập nhật trạng thái lịch khám thành công",
  "data": {
    "_id": "appointment_id",
    "doctorId": "new_doctor_id",
    "status": "Confirmed",
    ...
  }
}
```

## Ưu điểm tính năng

1. **Tránh overbooking**: Kiểm tra sức chứa của bác sĩ trước khi xác nhận
2. **Linh hoạt**: Cho phép đổi bác sĩ mà không cần hủy lịch
3. **Tự động hóa**: Invoice khám được tự động tạo khi xác nhận
4. **Thân thiện người dùng**: Hiển thị rõ ràng trạng thái, không cho phép thao tác sai

## Các trường hợp sử dụng

### Case 1: Bác sĩ cũ bận
```
1. Staff nhận được yêu cầu đặt lịch
2. Bấm "📅 Lịch bác sĩ"
3. Thấy bác sĩ A đã kín (5/5)
4. Chọn bác sĩ B cùng chuyên khoa (còn trống 3/5)
5. Bấm "Xác nhận"
6. Lịch được cập nhật, bệnh nhân sẽ được gọi để thông báo bác sĩ mới
```

### Case 2: Bác sĩ không được chỉ định
```
1. Bệnh nhân đặt lịch nhưng không chỉ định bác sĩ
2. Staff chọn bác sĩ phù hợp từ phòng ban
3. Xác nhận lịch
```

### Case 3: Hủy lịch
```
1. Staff xem lịch bác sĩ
2. Thấy không phù hợp
3. Bấm "Hủy" để đóng modal
4. Bấm "Hủy" ở hàng lịch khám để hủy toàn bộ lịch
```

## Notes kỹ thuật

- Modal sử dụng inline CSS để tránh conflict với stylesheet chung
- Lịch bác sĩ được fetch theo ngày cụ thể của cuộc hẹn
- Danh sách bác sĩ được lọc theo `departmentId` của lịch hiện tại
- Button "Xác nhận" bị vô hiệu hóa nếu bác sĩ mới không có chỗ trống
- Khi xác nhận, cả `doctorId` và `status` đều được cập nhật cùng lúc

## Troubleshooting

### Problem: Modal không hiển thị danh sách bác sĩ
**Solution**: 
- Kiểm tra xem `departmentId` của lịch khám có giá trị không
- Kiểm tra console xem có lỗi API không

### Problem: Lịch bác sĩ mới không load
**Solution**:
- Đảm bảo bác sĩ được chọn có lịch làm việc trong ngày đó
- Kiểm tra backend logs

### Problem: Nút "Xác nhận" luôn disabled
**Solution**:
- Bác sĩ mới có thể đã kín (currentBooked >= maxPatients)
- Chọn bác sĩ khác có sức chứa trống

## Enhancement tương lai

1. Thêm nút "Xem chi tiết bác sĩ" để xem review, lịch khác
2. Thêm filter theo chuyên khoa khi chọn bác sĩ
3. Thêm dropdown "Phòng ban khác" nếu cùng phòng đều kín
4. Gọi API notification để thông báo cho bệnh nhân khi đổi bác sĩ
5. Thêm audit log để track ai đã đổi bác sĩ lúc nào
