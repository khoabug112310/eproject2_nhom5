// Model: Department
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true,
    note: 'Các phòng ban/chuyên khoa trong phòng khám',
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
