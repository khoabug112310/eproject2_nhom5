// Module Auth - Routes
const express = require('express');
const { login, register, me, refreshToken, logout, impersonate, forgotPassword, resetPassword, verifyOtp } = require('./controller');
const { authenticateToken } = require('../../middlewares/auth');
const { authorizeRole } = require('../../middlewares/rbac');
const { USER_ROLE } = require('../../constants/enums');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, me);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken, logout);
router.post('/impersonate/:userId', authenticateToken, authorizeRole(USER_ROLE.ADMIN), impersonate);
// New routes for password recovery
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOtp', verifyOtp);
router.post('/resetPassword', resetPassword);

module.exports = router;
