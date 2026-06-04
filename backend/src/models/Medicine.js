// Model: Medicine
const mongoose = require('mongoose');
const { USAGE_ROUTE } = require('../constants/enums');

const medicineSchema = new mongoose.Schema({
  medicineCode: {
    type: String,
    required: true,
    unique: true,
  },
  medicineName: {
    type: String,
    required: true,
  },
  activeIngredient: String,
  usageRoute: {
    type: String,
    enum: Object.values(USAGE_ROUTE),
    note: 'Đường dùng (Uống, Bôi, Tiêm)',
  },
  unit: {
    type: String,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  stockQuantity: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
