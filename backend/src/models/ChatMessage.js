// Model: ChatMessage
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  senderName: {
    type: String,
    default: 'Guest'
  },
  senderType: {
    type: String,
    enum: ['patient', 'staff', 'ai', 'guest'],
    required: true
  },
  guestSessionId: {
    type: String,
    default: null
  },
  messageText: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
