// Module Billing - Controller
// Xử lý: Invoices

const createInvoice = (req, res) => {
  // TODO: Tạo hóa đơn (từ appointment, medical records)
  res.json({ message: 'Create invoice' });
};

const getInvoices = (req, res) => {
  // TODO: Lấy danh sách hóa đơn
  res.json({ message: 'Get invoices' });
};

const updateInvoiceStatus = (req, res) => {
  // TODO: Cập nhật trạng thái thanh toán
  res.json({ message: 'Update invoice status' });
};

const processPayment = (req, res) => {
  // TODO: Xử lý thanh toán
  res.json({ message: 'Process payment' });
};

module.exports = { createInvoice, getInvoices, updateInvoiceStatus, processPayment };
