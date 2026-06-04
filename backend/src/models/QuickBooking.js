const mongoose = require('mongoose');

const quickBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  department: String,
  doctor: String,
  // 🛠️ ĐÃ SỬA: Đổi từ Date thành String để lưu thuần chuỗi ngày "YYYY-MM-DD" không bị dính giờ thừa
  bookingDate: { type: String, required: true }, 
  time: String, // Ví dụ: "09:00", "14:30"
}, { 
  // Tự động tạo và quản lý 2 trường: createdAt và updatedAt (Cái này là Date hệ thống, giữ nguyên)
  timestamps: true 
});

module.exports = mongoose.model('QuickBooking', quickBookingSchema);