# Database Schema Notes

## Mục tiêu
So sánh cấu trúc database hiện tại trong `backend/src/models/` với schema mới đã thống nhất để biết phần nào cần sửa.

## Điểm đã khớp khá tốt
- `Roles`, `Users`, `Patients`, `Doctors`, `Staffs` nhìn chung đã đúng hướng.
- `Departments`, `Appointments`, `Medical_Records`, `Prescriptions`, `Posts`, `Contact_Inquiries` đều đã có trong dự án.
- Các enum chính cho `Gender`, `ScheduleStatus`, `AppointmentStatus`, `PostStatus`, `InvoiceStatus` đã tồn tại trong `backend/src/constants/enums.js`.

## Điểm cần sửa quan trọng
### 1. Invoice đang lệch schema mới
- Schema mới yêu cầu:
  - `InvoiceType` (`Consultation` / `Pharmacy`)
  - `AppointmentID` không còn unique
  - `TotalAmount`
  - `Status`, `IssuedAt`, `PaidAt`, `ProcessedBy`
  - thêm bảng `Invoice_Details`
- Model hiện tại `backend/src/models/Invoice.js` đang dùng:
  - `consultationFee`
  - `medicineFee`
  - `totalAmount`
  - `appointmentId` đang unique
- Kết luận: phần invoice là điểm cần refactor nhiều nhất.

### 2. Thiếu model `Invoice_Details`
- Schema mới có bảng chi tiết hóa đơn cho thuốc.
- Hiện dự án chưa có model tương ứng.

### 3. Schema enum hóa đơn chưa đủ
- `backend/src/constants/enums.js` chưa có `INVOICE_TYPE`.
- Cần bổ sung để đồng bộ với schema mới.

### 4. Doctor_Schedule nên kiểm tra lại kiểu dữ liệu giờ
- Schema mới ghi `StartTime` và `EndTime` là `TIME`.
- Model hiện tại dùng `String` cho `startTime` / `endTime`.
- Có thể giữ string nếu quy ước thống nhất là `HH:mm`, nhưng cần ghi rõ trong validation.

## Điểm cần rà thêm khi migrate
- `Medical_Record`: nên kiểm tra lại tên field và validation, nhưng khung hiện tại khá sát schema mới.
- `Patient`, `Doctor`, `Staff`: đã có các field quan trọng như `avatarURL`, `insuranceCode`, `qualifications`, `bio`, `phoneNumber`.
- `Post`: đã có `thumbnailURL`, `status`, `publishedAt`.
- `Contact_Inquiry`: đã có `handledBy`, `submittedAt`.

## Thứ tự nên sửa tiếp
1. Cập nhật enums để thêm `INVOICE_TYPE`.
2. Refactor `Invoice` theo schema mới.
3. Thêm model `Invoice_Details`.
4. Rà lại `Doctor_Schedule` và validation giờ.
5. Sau đó mới đồng bộ service/controller/seed liên quan.

## Ghi chú ngắn cho lần sau
- Nếu cần làm nhanh, ưu tiên invoice trước vì đây là phần lệch lớn nhất.
- Đừng sửa UI trước khi chốt xong contract database và API của hóa đơn.
