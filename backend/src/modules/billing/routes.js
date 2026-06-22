// Module Billing - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { createInvoice, getInvoices, updateInvoiceStatus, processPayment } = require('./controller');

const router = express.Router();

// Accountant
router.post('/invoices', authenticateToken, authorizeRole(USER_ROLE.ACCOUNTANT), createInvoice);
router.put('/invoices/:id', authenticateToken, authorizeRole(USER_ROLE.ACCOUNTANT), updateInvoiceStatus);

// Authenticated
router.get('/invoices', authenticateToken, getInvoices);
router.post('/invoices/:id/pay', authenticateToken, processPayment);

module.exports = router;
