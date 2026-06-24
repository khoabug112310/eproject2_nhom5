const mongoose = require('mongoose');

const doctorReviewSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Enforce unique review per user-doctor combination
doctorReviewSchema.index({ doctorId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('DoctorReview', doctorReviewSchema);
