const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/eproject_clinic').then(async () => {
  const result = await mongoose.connection.collection('appointments').updateMany(
    { status: 'Confirmed', doctorId: null },
    { $set: { status: 'Pending' } }
  );
  console.log('Modified:', result.modifiedCount);
  mongoose.disconnect();
});
