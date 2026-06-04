// Model: Appointment
const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../constants/enums');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  requestedDate: {
    type: Date,
    required: true,
  },
  requestedTime: String,
  symptoms: {
    type: String,
    note: 'Lý do khám',
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor_Schedule',
  },
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.PENDING,
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
