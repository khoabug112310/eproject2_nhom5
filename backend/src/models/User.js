// Model: User (Users bảng chính cho auth)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    note: 'Dùng SĐT làm Username là chuẩn nhất ở VN',
  },
  passwordHash: {
    type: String,
    required: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isGuest: {
    type: Boolean,
    default: false,
  },
  lastLoginAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Hash password trước khi save
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để so sánh password
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
