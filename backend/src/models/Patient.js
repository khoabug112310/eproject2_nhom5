// Model: Patient
const mongoose = require('mongoose');
const { GENDER } = require('../constants/enums');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  },
  fullName: {
    type: String,
    required: true,
  },
  avatarURL: String,
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: Object.values(GENDER),
    required: true,
  },
  category: {
    type: String,
    enum: ['Child', 'Adult'],
    default: 'Adult',
  },
  identityCard: {
    type: String,
    unique: true,
    sparse: true,
    note: 'Số CCCD/CMND - Rất quan trọng ở VN',
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  address: String,
  insuranceCode: {
    type: String,
    unique: true,
    sparse: true,
    note: 'Thẻ BHYT',
  },
  emergencyContact: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
