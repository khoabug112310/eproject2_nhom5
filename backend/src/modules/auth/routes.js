// Module Auth - Routes
const express = require('express');
const { login, register, me, refreshToken, logout } = require('./controller');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, me);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateToken, logout);

module.exports = router;
