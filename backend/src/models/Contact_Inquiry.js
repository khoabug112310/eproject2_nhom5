// Model: Contact_Inquiry
const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
  },
  senderPhone: {
    type: String,
    required: true,
  },
  senderEmail: String,
  message: {
    type: String,
    required: true,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  handledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Contact_Inquiry', contactInquirySchema);
