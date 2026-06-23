const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  await db.collection('doctor_schedules').updateMany({}, { $set: { maxPatients: 5 } });
  console.log('Updated maxPatients to 5');
  process.exit(0);
}

run().catch(console.error);
