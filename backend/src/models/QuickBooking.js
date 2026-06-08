const mongoose = require('mongoose');

const quickBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  department: String,
  doctor: String,
  bookingDate: String,
  time: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('QuickBooking', quickBookingSchema);
