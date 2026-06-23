const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/eproject_clinic');
  const db = mongoose.connection.db;

  const schedules = await db.collection('doctor_schedules').find().toArray();
  console.log(`Found ${schedules.length} existing schedules. Converting to 4 shifts...`);

  const newSchedules = [];

  for (const s of schedules) {
    if (s.startTime === '08:00' && (s.endTime === '12:00' || s.endTime === '17:30')) {
      // Split morning into 2 shifts
      newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '08:00', endTime: '10:00', maxPatients: 5, currentBooked: Math.ceil(s.currentBooked / 2) });
      newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '10:00', endTime: '12:00', maxPatients: 5, currentBooked: Math.floor(s.currentBooked / 2) });
      
      if (s.endTime === '17:30') {
         // It was a full day shift, so also create afternoon
         newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '13:30', endTime: '15:30', maxPatients: 5, currentBooked: 0 });
         newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '15:30', endTime: '17:30', maxPatients: 5, currentBooked: 0 });
      }
      
      // Delete old
      await db.collection('doctor_schedules').deleteOne({ _id: s._id });
    } else if (s.startTime === '13:30' && s.endTime === '17:30') {
      // Split afternoon into 2 shifts
      newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '13:30', endTime: '15:30', maxPatients: 5, currentBooked: Math.ceil(s.currentBooked / 2) });
      newSchedules.push({ ...s, _id: new mongoose.Types.ObjectId(), startTime: '15:30', endTime: '17:30', maxPatients: 5, currentBooked: Math.floor(s.currentBooked / 2) });
      
      // Delete old
      await db.collection('doctor_schedules').deleteOne({ _id: s._id });
    } else {
      // Keep other weird shifts as is
      newSchedules.push(s);
    }
  }

  if (newSchedules.length > 0) {
     const docs = newSchedules.map(ns => {
        if (!ns._id) ns._id = new mongoose.Types.ObjectId();
        return ns;
     });
     // We deleted the old ones, now insert new ones
     const insertDocs = docs.filter(d => d.startTime === '08:00' || d.startTime === '10:00' || d.startTime === '13:30' || d.startTime === '15:30');
     if (insertDocs.length > 0) {
       await db.collection('doctor_schedules').insertMany(insertDocs);
     }
  }

  console.log('Successfully updated schedules to 4 shifts!');
  process.exit(0);
}

run().catch(console.error);
