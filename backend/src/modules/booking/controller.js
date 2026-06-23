const { QuickBooking, User, Patient, Role, Appointment, Department, Doctor } = require('../../models');
const { success: ok, fail } = require('../../utils/response');
const { GENDER } = require('../../constants/enums');

// Quick booking flow for unauthenticated users:
const createBooking = async (req, res) => {
  try {
    const { name, phone, department: reqDept, doctor: reqDoc, bookingDate: reqDate, time } = req.body;    
    
    if (!name || !phone) return fail(res, 'Name and phone are required', 400);

    // Find or create the patient role
    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    // Find an existing user or create a new one
    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    let createdUser = false;
    if (!user) {
      const tempPwd = Math.random().toString(36) + Date.now();
      user = await User.create({ username: phone, passwordHash: tempPwd, roleId: patientRole._id, phone, isActive: true, isRegistered: false });
      createdUser = true;
    }

    // Find or create the patient record
    let patient = await Patient.findOne({ userId: user._id });
    if (!patient) {
      const dob = new Date('1900-01-01');
      const identityCard = `QUICK-${Date.now()}-${phone}`;
      patient = await Patient.create({
        userId: user._id,
        fullName: name,
        dateOfBirth: dob,
        gender: GENDER.OTHER || 'Khác',
        identityCard,
        phoneNumber: phone,
      });
    }

    // Resolve departmentId and name for QuickBooking
    let departmentId = null;
    let departmentNameForQuick = '';
    if (reqDept) {
      if (/^[0-9a-fA-F]{24}$/.test(String(reqDept))) {
        departmentId = reqDept;
        const dep = await Department.findById(reqDept);
        if (dep) departmentNameForQuick = dep.departmentName || dep.name || '';
      } else {
        const dep = await Department.findOne({ departmentName: reqDept });
        if (dep) {
          departmentId = dep._id;
          departmentNameForQuick = dep.departmentName || dep.name || '';
        }
      }
    }

    // Resolve doctorId and name for QuickBooking
    let doctorId = null;
    let doctorNameForQuick = '';
    if (reqDoc) {
      if (/^[0-9a-fA-F]{24}$/.test(String(reqDoc))) {
        doctorId = reqDoc;
        const doc = await Doctor.findById(reqDoc);
        if (doc) doctorNameForQuick = doc.fullName || '';
      } else {
        const doc = await Doctor.findOne({ fullName: reqDoc });
        if (doc) {
          doctorId = doc._id;
          doctorNameForQuick = doc.fullName || '';
        }
      }
    }

    // Handle the date for Appointment (keep a Date object for system-standard storage)
    const appointmentDate = reqDate ? new Date(reqDate) : new Date();
    appointmentDate.setHours(0, 0, 0, 0);

    // Anti-spam limits checks:
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const countBookingsToday = await Appointment.countDocuments({
      patientId: patient._id,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });
    if (countBookingsToday >= 5) {
      return fail(res, 'You cannot book more than 5 appointments within the same day.', 400);
    }

    const countSameDayDiag = await Appointment.countDocuments({
      patientId: patient._id,
      requestedDate: appointmentDate,
      status: { $ne: 'Canceled' }
    });
    if (countSameDayDiag >= 3) {
      return fail(res, 'You cannot book more than 3 appointments for the same treatment date.', 400);
    }

    // Normalize the time slot (shared by both tables)
    const finalTime = time || '08:00 - 09:00'; 

    // 1. Create the official system appointment
    const appt = await Appointment.create({
      patientId: patient._id,
      requestedDate: appointmentDate,
      requestedTime: finalTime, 
      symptoms: req.body.symptoms || '', 
      departmentId: departmentId || undefined,
      doctorId: doctorId || undefined,
      status: 'Pending',
    });

    // Trim the string so bookingDate is always YYYY-MM-DD (e.g. "2026-06-04")
    // Whether the frontend sends a full ISO string or a short one, the system extracts the date part.
    const stringDate = reqDate 
      ? String(reqDate).split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // 2. Create the QuickBooking record (store the raw date string only)
    const booking = await QuickBooking.create({ 
      name, 
      phone, 
      department: departmentNameForQuick || reqDept, 
      doctor: doctorNameForQuick || reqDoc, 
      bookingDate: stringDate, // Stores a short plain date string "2026-06-04" in the DB
      time: finalTime          
    });

    return ok(res, { appointment: appt, quickBooking: booking, createdUser }, 'Your booking request has been sent to the customer care team', 201);
  } catch (error) {
    console.error('createBooking error', error);
    return fail(res, 'Server error when creating booking', 500, error.message);
  }
};

module.exports = { createBooking };