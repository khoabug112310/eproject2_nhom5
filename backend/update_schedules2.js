const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/eproject_clinic');
  const db = mongoose.connection.db;
  await db.collection('doctor_schedules').updateMany({}, { $set: { maxPatients: 5 } });
  console.log('Updated maxPatients to 5');
  process.exit(0);
}

run().catch(console.error);
