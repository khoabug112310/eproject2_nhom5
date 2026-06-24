const User = require('../models/User');
const Role = require('../models/Role');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');

async function createNotification({ userId, title, message }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, title, message });
  } catch (err) {
    console.error('Failed to create notification', err);
  }
}

async function notifyStaff(title, message) {
  try {
    const staffRole = await Role.findOne({ roleName: 'staff' });
    if (!staffRole) return;
    const staffUsers = await User.find({ roleId: staffRole._id, isActive: true });
    for (const staff of staffUsers) {
      await createNotification({ userId: staff._id, title, message });
    }
  } catch (err) {
    console.error('Failed to notify staff', err);
  }
}

async function notifyPatient(patientId, title, message) {
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) return;
    
    let targetUserId = patient.userId;
    if (!targetUserId && patient.parentId) {
      const parent = await Patient.findById(patient.parentId);
      if (parent) {
        targetUserId = parent.userId;
      }
    }
    
    if (targetUserId) {
      await createNotification({ userId: targetUserId, title, message });
    }
  } catch (err) {
    console.error('Failed to notify patient', err);
  }
}

module.exports = {
  createNotification,
  notifyStaff,
  notifyPatient
};
