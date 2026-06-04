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
  updateTimelineStepAdmin 
} = require('./controller');

const router = express.Router();

// Chỉ Admin
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

// Authenticated
router.put('/profile/:id', authenticateToken, updateUser);

module.exports = router;
