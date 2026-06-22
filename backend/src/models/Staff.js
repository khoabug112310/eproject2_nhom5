// Model: Staff
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
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
  phoneNumber: String,
  position: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
