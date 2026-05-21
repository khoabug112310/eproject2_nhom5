// Model: Doctor_Schedule
const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../constants/enums');

const doctorScheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  workDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    note: 'Format: HH:mm (VD: 08:00)',
  },
  endTime: {
    type: String,
    required: true,
    note: 'Format: HH:mm (VD: 12:00)',
  },
  maxPatients: {
    type: Number,
    required: true,
  },
  currentBooked: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(SCHEDULE_STATUS),
    default: SCHEDULE_STATUS.AVAILABLE,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Doctor_Schedule', doctorScheduleSchema);
