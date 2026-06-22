// Helper để tạo JWT token
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
