// Model: Medical_Record
const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  
  // Các chỉ số sinh hiệu (Đo trước khi khám)
  height: {
    type: Number,
    note: 'Chiều cao (cm)',
  },
  weight: {
    type: Number,
    note: 'Cân nặng (kg)',
  },
  bloodPressure: {
    type: String,
    note: 'Huyết áp (VD: 120/80)',
  },
  heartRate: {
    type: Number,
    note: 'Nhịp tim (bpm)',
  },
  temperature: {
    type: Number,
    note: 'Nhiệt độ (Độ C)',
  },
  
  // Kết quả khám của bác sĩ
  diagnosis: {
    type: String,
    required: true,
    note: 'Chẩn đoán bệnh',
  },
  clinicalNotes: {
    type: String,
    note: 'Lời dặn, ghi chú lâm sàng',
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Medical_Record', medicalRecordSchema);
