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
    enum: ['Child', 'Adult', 'Elderly'],
    default: 'Adult',
  },
  birthCertificate: {
    type: String,
    sparse: true,
  },
  birthCertificateImg: {
    type: String,
  },
  personalId: {
    type: String,
    sparse: true,
  },
  identityCard: {
    type: String,
    unique: true,
    sparse: true,
    note: 'Số CCCD/CMND - Rất quan trọng ở VN',
  },
  identityCardImg: {
    type: String,
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

// Auto set category based on date of birth before save
patientSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const birthDate = new Date(this.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 15) {
      this.category = 'Child';
    } else if (age >= 60) {
      this.category = 'Elderly';
    } else {
      this.category = 'Adult';
    }
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
