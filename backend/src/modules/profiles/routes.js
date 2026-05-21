// Module Profiles - Routes
const express = require('express');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');
const { getAllUsers, getUserById, updateUser, createDoctor, getPatients } = require('./controller');

const router = express.Router();

// Chỉ Admin
router.get('/users', authenticateToken, authorizeRole(USER_ROLE.ADMIN), getAllUsers);
router.post('/doctors', authenticateToken, authorizeRole(USER_ROLE.ADMIN), createDoctor);

// Public
router.get('/doctors/:id', getUserById);
router.get('/patients', getPatients);

// Authenticated
router.put('/profile/:id', authenticateToken, updateUser);

module.exports = router;
