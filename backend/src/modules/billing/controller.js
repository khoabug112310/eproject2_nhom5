// Module Billing - Controller
// Xử lý: Invoices

const Invoice = require('../../models/Invoice');
const Invoice_Detail = require('../../models/Invoice_Detail');
const Patient = require('../../models/Patient');
const Staff = require('../../models/Staff');
const { INVOICE_STATUS } = require('../../constants/enums');

const createInvoice = async (req, res) => {
  try {
    const { appointmentId, patientId, invoiceType, totalAmount } = req.body;
    if (!appointmentId || !patientId || !invoiceType || typeof totalAmount !== 'number') {
      return res.status(400).json({ success: false, message: 'Thông tin hóa đơn thiếu hoặc không hợp lệ' });
    }

    const invoice = await Invoice.create({
      appointmentId,
      patientId,
      invoiceType,
      totalAmount,
      status: INVOICE_STATUS.UNPAID,
      issuedAt: new Date(),
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, invoice, 'Tạo hóa đơn thành công');
  } catch (err) {
    console.error('createInvoice error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi tạo hóa đơn', 500, err.message);
  }
};

const getInvoices = async (req, res) => {
  try {
    let q = {};
    if (req.user) {
      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient) {
          const { success: ok } = require('../../utils/response');
          return ok(res, [], 'Lấy danh sách hóa đơn thành công');
        }
        q.patientId = patient._id;
      }
    }

    const invoices = await Invoice.find(q)
      .populate('patientId')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId departmentId' }
      })
      .populate({
        path: 'processedBy',
        select: 'fullName'
      })
      .sort({ createdAt: -1 })
      .lean();

    const invoicesWithDetails = [];
    for (const inv of invoices) {
      if (inv.invoiceType === 'Pharmacy') {
        const details = await Invoice_Detail.find({ invoiceId: inv._id }).populate('medicineId').lean();
        inv.details = details;
      }
      invoicesWithDetails.push(inv);
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, invoicesWithDetails, 'Lấy danh sách hóa đơn thành công');
  } catch (err) {
    console.error('getInvoices error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách hóa đơn', 500, err.message);
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, totalAmount } = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });

    if (status) invoice.status = status;
    if (typeof totalAmount === 'number') invoice.totalAmount = totalAmount;
    
    await invoice.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, invoice, 'Cập nhật hóa đơn thành công');
  } catch (err) {
    console.error('updateInvoiceStatus error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật hóa đơn', 500, err.message);
  }
};

const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });

    if (invoice.status === INVOICE_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'Hóa đơn này đã được thanh toán' });
    }

    const staff = await Staff.findOne({ userId: req.user.id });
    
    invoice.status = INVOICE_STATUS.PAID;
    invoice.paidAt = new Date();
    if (staff) {
      invoice.processedBy = staff._id;
    }
    await invoice.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, invoice, 'Thanh toán hóa đơn thành công');
  } catch (err) {
    console.error('processPayment error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi xử lý thanh toán', 500, err.message);
  }
};

module.exports = { createInvoice, getInvoices, updateInvoiceStatus, processPayment };
