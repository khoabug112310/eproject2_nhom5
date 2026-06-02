// Middleware xác thực JWT
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { User } = require('../models');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Tài khoản không tồn tại' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
};

module.exports = { authenticateToken };
