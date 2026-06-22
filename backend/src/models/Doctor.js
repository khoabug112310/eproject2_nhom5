// Model: Doctor
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  avatarURL: String,
  specialization: {
    type: String,
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  qualifications: String,
  experienceYears: {
    type: Number,
    default: 0,
  },
  baseFee: {
    type: Number,
    note: 'Giá khám của bác sĩ này',
  },
  bio: String,
  isActive: {
    type: Boolean,
    default: true,
    note: 'Thay cho DoctorStatusEnum cho đồng bộ với Users',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
