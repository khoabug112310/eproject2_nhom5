const { QuickBooking, User, Patient, Role, Appointment, Department, Doctor } = require('../../models');
const { success: ok, fail } = require('../../utils/response');
const { GENDER } = require('../../constants/enums');

// Quick booking flow for unauthenticated users:
const createBooking = async (req, res) => {
  try {
    // 🛠️ SỬA LẠI: Đồng bộ tên biến chính xác với các name/value từ form React gửi lên
    const { name, phone, departmentId: reqDept, doctorId: reqDoc, requestedDate: reqDate, requestedTime } = req.body;
    
    if (!name || !phone) return fail(res, 'Name and phone are required', 400);

    // Find or create patient role
    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    // Find existing user by username or phone
    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    let createdUser = false;
    if (!user) {
      const tempPwd = Math.random().toString(36) + Date.now();
      user = await User.create({ username: phone, passwordHash: tempPwd, roleId: patientRole._id, phone, isActive: true });
      createdUser = true;
    }

    // Find or create Patient record
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

    // Resolve departmentId
    let departmentId = null;
    if (reqDept) {
      if (/^[0-9a-fA-F]{24}$/.test(String(reqDept))) {
        departmentId = reqDept;
      } else {
        const dep = await Department.findOne({ departmentName: reqDept });
        if (dep) departmentId = dep._id;
      }
    }

    // Resolve doctorId
    let doctorId = null;
    if (reqDoc) {
      if (/^[0-9a-fA-F]{24}$/.test(String(reqDoc))) {
        doctorId = reqDoc;
      } else {
        const doc = await Doctor.findOne({ fullName: reqDoc });
        if (doc) doctorId = doc._id;
      }
    }

    // 🛠️ SỬA LẠI: Lấy ngày khám do người dùng chọn ở Form, nếu không có mới lấy ngày hôm nay
    const requestedDate = reqDate ? new Date(reqDate) : new Date();
    requestedDate.setHours(0, 0, 0, 0);

    // Create appointment with PENDING status for CSKH to confirm
    const appt = await Appointment.create({
      patientId: patient._id,
      requestedDate,
      requestedTime: requestedTime || '08:00 - 09:00', // Khớp với format khung giờ của bạn
      symptoms: req.body.symptoms || '', // Nhận thêm lý do khám từ textarea
      departmentId: departmentId || undefined,
      doctorId: doctorId || undefined,
      status: 'Pending',
    });

    // Keep a QuickBooking audit record (Lưu vết audit theo thông tin gốc gửi lên)
    const booking = await QuickBooking.create({ 
      name, 
      phone, 
      department: reqDept, 
      doctor: reqDoc, 
      time: requestedTime 
    });

    return ok(res, { appointment: appt, quickBooking: booking, createdUser }, 'Yêu cầu đặt lịch đã gửi cho nhân viên CSKH', 201);
  } catch (error) {
    console.error('createBooking error', error);
    return fail(res, 'Server error when creating booking', 500, error.message);
  }
};

module.exports = { createBooking };