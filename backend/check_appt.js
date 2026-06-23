const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/eproject2').then(async () => {
  const result = await mongoose.connection.collection('appointments').find({}).toArray();
  console.log(result.map(a => ({ id: a._id, patient: a.patientId, status: a.status, doctor: a.doctorId })));
  mongoose.disconnect();
});
