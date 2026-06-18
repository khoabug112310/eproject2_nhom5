// Module Scheduling - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment, getSchedules, getAllSchedules, createDoctorSchedule, deleteDoctorSchedule, bookAppointment, getAppointments, updateAppointmentStatus } = require('./controller');

const router = express.Router();

// Public
router.get('/departments', getDepartments);
router.get('/schedules', getSchedules);

// Admin - Department CRUD
router.post('/departments', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createDepartment);
router.put('/departments/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updateDepartment);
router.delete('/departments/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deleteDepartment);

// Admin - Doctor Schedule CRUD
router.get('/doctor-schedules', authenticateToken, authorizeRole(USER_ROLE.ADMIN), getAllSchedules);
router.post('/doctor-schedules', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createDoctorSchedule);
router.delete('/doctor-schedules/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deleteDoctorSchedule);

// Patient
router.post('/appointments', authenticateToken, authorizeRole(USER_ROLE.PATIENT), bookAppointment);

// Doctor & Staff
router.get('/appointments', authenticateToken, getAppointments);
router.put('/appointments/:id', authenticateToken, updateAppointmentStatus);

module.exports = router;
