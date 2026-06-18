// Module Clinical - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getMedicines, createMedicine, updateMedicine, deleteMedicine, createMedicalRecord, getMedicalRecords, createPrescription, getPrescriptions, getDoctorsPublic: getDoctors, getPublicStats } = require('./controller');

const router = express.Router();

// Public
router.get('/medicines', getMedicines);
router.get('/doctors', getDoctors);
router.get('/public-stats', getPublicStats);

// Admin - Medicine CRUD
router.post('/medicines', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createMedicine);
router.put('/medicines/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updateMedicine);
router.delete('/medicines/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deleteMedicine);

// Doctor
router.post('/medical-records', authenticateToken, authorizeRole(USER_ROLE.DOCTOR), createMedicalRecord);
router.post('/prescriptions', authenticateToken, authorizeRole(USER_ROLE.DOCTOR), createPrescription);

// Authenticated
router.get('/medical-records', authenticateToken, getMedicalRecords);
router.get('/prescriptions', authenticateToken, getPrescriptions);

module.exports = router;
