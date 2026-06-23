const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/eproject_clinic');
  const db = mongoose.connection.db;
  const schedules = await db.collection('doctor_schedules').find({
    workDate: new Date('2026-06-25T00:00:00.000Z')
  }).toArray();
  console.log(schedules);
  process.exit(0);
}

run().catch(console.error);
