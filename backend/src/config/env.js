// Biến môi trường và cấu hình ứng dụng
require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/eproject_clinic',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
};
