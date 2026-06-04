// Model: Invoice
const mongoose = require('mongoose');
const { INVOICE_STATUS, INVOICE_TYPE } = require('../constants/enums');

const invoiceSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    note: 'Tham chiếu đến lần khám (không bắt buộc unique)',
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  invoiceType: {
    type: String,
    enum: Object.values(INVOICE_TYPE),
    required: true,
    note: 'Loại hóa đơn: Consultation hoặc Pharmacy',
  },
  totalAmount: {
    type: Number,
    required: true,
    note: 'Tổng tiền của hóa đơn này',
  },
  status: {
    type: String,
    enum: Object.values(INVOICE_STATUS),
    default: INVOICE_STATUS.UNPAID,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    note: 'Tham chiếu StaffID của Thu ngân/Kế toán chốt đơn',
  },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
