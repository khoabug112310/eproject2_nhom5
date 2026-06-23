// Cấu hình kết nối MongoDB
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eproject_clinic';

async function connectDatabase() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected successfully');
    
    // Drop old indexes on patients to apply schema constraints (unique sparse)
    try {
      await conn.connection.db.collection('patients').dropIndexes();
      console.log('✓ Dropped old indexes on patients collection to apply schema changes');
    } catch (e) {
      console.log('Note: could not drop indexes on patients collection (might not exist yet):', e.message);
    }
    
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message);
  }
}

module.exports = { connectDatabase, disconnectDatabase };
