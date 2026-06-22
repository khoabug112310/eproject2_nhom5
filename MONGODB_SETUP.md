# MongoDB Setup Guide

## Cài đặt MongoDB

### Trên Windows (MongoDB Community Edition)

1. **Tải MongoDB Community Server**
   - Truy cập: https://www.mongodb.com/try/download/community
   - Chọn phiên bản Windows
   - Tải và cài đặt (chọn Custom Setup để cài MongoDB Service)

2. **Xác nhận cài đặt**
   ```bash
   mongod --version
   mongo --version
   ```

3. **Khởi chạy MongoDB Service**
   - Windows: Mở Services (services.msc) → tìm "MongoDB Server" → Start
   - Hoặc từ terminal:
   ```bash
   mongod
   ```

4. **Kết nối với MongoDB**
   ```bash
   mongo
   ```
   Nếu thành công, bạn sẽ thấy MongoDB shell prompt

### Trên macOS (với Homebrew)
```bash
brew install mongodb-community
brew services start mongodb-community
```

### Trên Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

## Setup Database

### 1. Cài đặt Dependencies
```bash
cd backend
npm install
```

### 2. Tạo Database mẫu
Chạy seed script để tạo database và dữ liệu test:
```bash
node src/config/seed.js
```

Output:
```
✓ Connected to MongoDB
✓ Created roles
✓ Created admin user
✓ Created departments
✓ Created doctors
✓ Created staff
✓ Created patient

✓ Database seeding completed successfully!

Test Accounts:
Admin: 0901234567 / admin123
Doctor: 0911111111 / doctor123
Staff: 0913333333 / staff123
Patient: 0914444444 / patient123
```

### 3. Chạy Backend
```bash
npm run dev
```

Server sẽ chạy trên `http://localhost:4000`

## Kiểm tra Database

### Dùng MongoDB Shell
```bash
mongo
use eproject_clinic
db.users.find()  # Xem danh sách users
db.patients.find()  # Xem danh sách bệnh nhân
db.doctors.find()  # Xem danh sách bác sĩ
```

### Dùng MongoDB Compass (GUI)
1. Tải: https://www.mongodb.com/products/compass
2. Kết nối: `mongodb://localhost:27017`
3. Xem database `eproject_clinic` và các collection

## Troubleshooting

### MongoDB không khởi chạy
- Kiểm tra port 27017: `netstat -an | findstr 27017`
- Xóa lock file: `rm -rf /data/db/mongod.lock`
- Khôi phục database: `mongod --repair`

### Connection refused
- Đảm bảo MongoDB service đang chạy
- Kiểm tra `MONGODB_URI` trong .env file

### Models không load
- Đảm bảo MongoDB connected trước khi dùng models
- Kiểm tra console output cho lỗi connection

## Models trong dự án

Tất cả models được định nghĩa trong `src/models/`:
- **Role** - Roles (admin, doctor, staff, accountant, patient)
- **User** - Authentication users
- **Patient** - Thông tin bệnh nhân
- **Doctor** - Thông tin bác sĩ
- **Staff** - Thông tin nhân viên
- **Department** - Phòng ban/chuyên khoa
- **Doctor_Schedule** - Lịch làm việc bác sĩ
- **Appointment** - Lịch khám
- **Medicine** - Danh sách thuốc
- **Medical_Record** - Hồ sơ bệnh án
- **Prescription** - Đơn thuốc
- **Invoice** - Hóa đơn
- **Post** - Bài viết tin tức
- **Contact_Inquiry** - Liên hệ từ khách hàng

## Sử dụng Models

```javascript
const { User, Patient, Doctor } = require('./models');

// Tìm user
const user = await User.findById(userId);

// Tạo patient
const newPatient = await Patient.create({
  userId: userId,
  fullName: 'Lê Văn A',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'Nam',
  identityCard: '123456789012',
  phoneNumber: '0909123456',
  address: 'Hà Nội'
});

// Tìm doctors theo department
const doctors = await Doctor.find({ departmentId: deptId }).populate('departmentId');
```
