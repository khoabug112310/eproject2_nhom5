// Middleware kiểm tra quyền (Role-Based Access Control)
const { USER_ROLE } = require('../constants/enums');

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to access this resource',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = { authorizeRole };
