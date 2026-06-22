// Model: Role
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'doctor', 'staff', 'accountant', 'patient'],
  },
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
