// Module Profiles - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const {
  getAllUsers,
  getUserById,
  updateUser,
  createDoctor,
  getPatients,
  getAdminStats,
  queryClinicAI,
  editUserAdmin,
  deleteUserAdmin,
  deleteAppointmentAdmin,
  updateTimelineStepAdmin,
  getMyPatientProfile,
  createMyPatientProfile,
  updateMyPatientProfile,
  getSubAccounts,
  createSubAccount,
  updateSubAccount,
  deleteSubAccount,
  createPatientByStaff,
} = require('./controller');

const router = express.Router();

// Patient self-service profile
router.get('/patient/me',  authenticateToken, getMyPatientProfile);
router.post('/patient/me', authenticateToken, createMyPatientProfile);
router.put('/patient/me',  authenticateToken, updateMyPatientProfile);

// Patient sub-accounts (dependents)
router.get('/patient/subaccounts', authenticateToken, getSubAccounts);
router.post('/patient/subaccounts', authenticateToken, createSubAccount);
router.put('/patient/subaccounts/:id', authenticateToken, updateSubAccount);
router.delete('/patient/subaccounts/:id', authenticateToken, deleteSubAccount);

// Admin only
router.get('/users', authenticateToken, authorizeRole(USER_ROLE.ADMIN), getAllUsers);
router.post('/users', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createDoctor);
router.post('/doctors', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createDoctor);
router.get('/admin/stats', authenticateToken, authorizeRole(USER_ROLE.ADMIN), getAdminStats);
router.post('/admin/ai-query', authenticateToken, authorizeRole(USER_ROLE.ADMIN), queryClinicAI);

// Admin operations
router.put('/admin/users/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), editUserAdmin);
router.delete('/admin/users/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deleteUserAdmin);
router.delete('/admin/appointments/:id', authenticateToken, authorizeRole(USER_ROLE.ADMIN), deleteAppointmentAdmin);
router.put('/admin/timeline/step', authenticateToken, authorizeRole(USER_ROLE.ADMIN), updateTimelineStepAdmin);

// Public / Protected
router.get('/doctors/:id', getUserById);
router.get('/patients', authenticateToken, getPatients);
router.post('/patients', authenticateToken, authorizeRole(USER_ROLE.STAFF, USER_ROLE.ADMIN), createPatientByStaff);

// Authenticated
router.put('/profile/:id', authenticateToken, updateUser);

module.exports = router;
