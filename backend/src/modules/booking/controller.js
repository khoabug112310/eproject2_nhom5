const { QuickBooking, User, Patient, Role, Appointment, Department, Doctor } = require('../../models');
const { success: ok, fail } = require('../../utils/response');
const { GENDER } = require('../../constants/enums');

// Quick booking flow for unauthenticated users:
// - create or reuse a User by phone (username=phone)
// - create a Patient placeholder if missing (fill required fields with placeholders)
// - create an Appointment with status PENDING for CSKH to confirm
// - also save a QuickBooking record for audit
const createBooking = async (req, res) => {
  try {
    const { name, phone, department, doctor, time } = req.body;
    if (!name || !phone) return fail(res, 'Name and phone are required', 400);

    // Find or create patient role
    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    // Find existing user by username or phone
    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    let createdUser = false;
    if (!user) {
      const tempPwd = Math.random().toString(36).slice(2) + Date.now();
      user = await User.create({ username: phone, passwordHash: tempPwd, roleId: patientRole._id, phone, isActive: true, isGuest: true });
      createdUser = true;
    }

    // Find or create Patient record (Patient model has many required fields)
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
    } else if (user.isGuest) {
      const updates = {};
      if (name && patient.fullName !== name) updates.fullName = name;
      if (phone && patient.phoneNumber !== phone) updates.phoneNumber = phone;
      if (Object.keys(updates).length) {
        await Patient.updateOne({ _id: patient._id }, { $set: updates });
        patient = await Patient.findById(patient._id);
      }
    }

    // Resolve departmentId if department provided (could be id or name)
    let departmentId = null;
    if (department) {
      // try by id
      if (/^[0-9a-fA-F]{24}$/.test(String(department))) {
        departmentId = department;
      } else {
        const dep = await Department.findOne({ departmentName: department });
        if (dep) departmentId = dep._id;
      }
    }

    // Resolve doctorId if doctor provided (could be id or fullName)
    let doctorId = null;
    if (doctor) {
      if (/^[0-9a-fA-F]{24}$/.test(String(doctor))) {
        doctorId = doctor;
      } else {
        const doc = await Doctor.findOne({ fullName: doctor });
        if (doc) doctorId = doc._id;
      }
    }

    // Normalize requestedDate to today if not provided
    const requestedDate = new Date();
    requestedDate.setHours(0, 0, 0, 0);

    // Create appointment with PENDING status for CSKH to confirm
    const appt = await Appointment.create({
      patientId: patient._id,
      requestedDate,
      requestedTime: time || '09:00',
      symptoms: '',
      departmentId: departmentId || undefined,
      doctorId: doctorId || undefined,
      status: 'Pending',
    });

    // Keep a QuickBooking audit record
    const booking = await QuickBooking.create({ name, phone, department, doctor, time });

    return ok(res, { appointment: appt, quickBooking: booking, createdUser }, 'Yêu cầu đặt lịch đã gửi cho nhân viên CSKH', 201);
  } catch (error) {
    console.error('createBooking error', error);
    return fail(res, 'Server error when creating booking', 500, error.message);
  }
};

module.exports = { createBooking };
