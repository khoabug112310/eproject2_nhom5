// Module Billing - Controller
// Handles: Invoices

const Invoice = require('../../models/Invoice');
const Invoice_Detail = require('../../models/Invoice_Detail');
const Patient = require('../../models/Patient');
const Staff = require('../../models/Staff');
const { INVOICE_STATUS } = require('../../constants/enums');

const createInvoice = async (req, res) => {
  try {
    const { appointmentId, patientId, invoiceType, totalAmount } = req.body;
    if (!appointmentId || !patientId || !invoiceType || typeof totalAmount !== 'number') {
      return res.status(400).json({ success: false, message: 'Invoice information is missing or invalid' });
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
    return ok(res, invoice, 'Invoice created successfully');
  } catch (err) {
    console.error('createInvoice error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating the invoice', 500, err.message);
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
          return ok(res, [], 'Invoice list loaded successfully');
        }
        // Fetch invoices for primary patient and all dependents (sub-accounts)
        const dependents = await Patient.find({ parentId: patient._id });
        const patientIds = [patient._id, ...dependents.map(d => d._id)];
        q.patientId = { $in: patientIds };
      }
    }

    const invoices = await Invoice.find(q)
      .populate('patientId')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId departmentId' }
      })
      .populate({ path: 'processedBy', select: 'username' })
      .sort({ createdAt: -1 })
      .lean();

    const invoicesWithDetails = [];
    for (const inv of invoices) {
      if (inv.invoiceType === 'Pharmacy') {
        const details = await Invoice_Detail.find({ invoiceId: inv._id }).populate('medicineId').lean();
        inv.details = details;
      }
      // Resolve processedBy display name from Staff profile
      if (inv.processedBy && inv.processedBy._id) {
        const staffProfile = await Staff.findOne({ userId: inv.processedBy._id }).select('fullName').lean();
        inv.processedBy = {
          _id: inv.processedBy._id,
          fullName: staffProfile ? staffProfile.fullName : inv.processedBy.username,
        };
      }
      invoicesWithDetails.push(inv);
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, invoicesWithDetails, 'Invoice list loaded successfully');
  } catch (err) {
    console.error('getInvoices error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the invoice list', 500, err.message);
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, totalAmount } = req.body;
    
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (status) invoice.status = status;
    if (typeof totalAmount === 'number') invoice.totalAmount = totalAmount;
    
    await invoice.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, invoice, 'Invoice updated successfully');
  } catch (err) {
    console.error('updateInvoiceStatus error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the invoice', 500, err.message);
  }
};

const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.status === INVOICE_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'This invoice has already been paid' });
    }

    invoice.status = INVOICE_STATUS.PAID;
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod || 'Cash';
    invoice.processedBy = req.user.id || req.user._id;
    await invoice.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, invoice, 'Invoice paid successfully');
  } catch (err) {
    console.error('processPayment error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error processing the payment', 500, err.message);
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    
    await Invoice_Detail.deleteMany({ invoiceId: id });
    await Invoice.findByIdAndDelete(id);

    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Invoice deleted successfully');
  } catch (err) {
    console.error('deleteInvoice error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the invoice', 500, err.message);
  }
};

const deleteInvoiceDetail = async (req, res) => {
  try {
    const { detailId } = req.params;
    const detail = await Invoice_Detail.findById(detailId);
    if (!detail) return res.status(404).json({ success: false, message: 'Detail not found' });
    
    const invoiceId = detail.invoiceId;
    const subTotal = detail.subTotal;
    
    await Invoice_Detail.findByIdAndDelete(detailId);
    
    const invoice = await Invoice.findById(invoiceId);
    if (invoice) {
      invoice.totalAmount = Math.max(0, invoice.totalAmount - subTotal);
      
      const remainingDetails = await Invoice_Detail.countDocuments({ invoiceId });
      if (remainingDetails === 0) {
        await Invoice.findByIdAndDelete(invoiceId);
      } else {
        await invoice.save();
      }
    }
    
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Invoice detail deleted successfully');
  } catch (err) {
    console.error('deleteInvoiceDetail error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the invoice detail', 500, err.message);
  }
};

module.exports = { createInvoice, getInvoices, updateInvoiceStatus, processPayment, deleteInvoice, deleteInvoiceDetail };
