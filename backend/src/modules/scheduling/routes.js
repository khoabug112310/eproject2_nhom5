// Module Scheduling - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getDepartments, getSchedules, bookAppointment, getAppointments, updateAppointmentStatus } = require('./controller');

const router = express.Router();

// Public
router.get('/departments', getDepartments);
router.get('/schedules', getSchedules);

// Patient
router.post('/appointments', authenticateToken, authorizeRole(USER_ROLE.PATIENT), bookAppointment);

// Doctor & Staff
router.get('/appointments', authenticateToken, getAppointments);
router.put('/appointments/:id', authenticateToken, updateAppointmentStatus);

module.exports = router;
