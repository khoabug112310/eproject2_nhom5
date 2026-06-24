// Model: Contact_Inquiry
const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
    trim: true, // Xóa khoảng trắng thừa ở 2 đầu
  },
  senderPhone: {
    type: String,
    required: true,
    trim: true, // Xóa khoảng trắng thừa
  },
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true, // Tự động chuyển thành chữ thường (ví dụ: Son@gmail.com -> son@gmail.com)
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', // Đảm bảo bạn đã có Model tên là 'Staff' nhé
  },
  replyMessage: {
    type: String,
    trim: true,
  },
  repliedAt: {
    type: Date,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true // Tự động tạo thêm 2 trường là createdAt và updatedAt
});

module.exports = mongoose.model('Contact_Inquiry', contactInquirySchema);