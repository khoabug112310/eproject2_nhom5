const { QuickBooking, User, Patient, Role, Appointment, Department, Doctor } = require('../../models');
const { success: ok, fail } = require('../../utils/response');
const { GENDER } = require('../../constants/enums');

// Quick booking flow for unauthenticated users:
const createBooking = async (req, res) => {
  try {
    const { name, phone, department: reqDept, doctor: reqDoc, bookingDate: reqDate, time } = req.body;    
    
    if (!name || !phone) return fail(res, 'Name and phone are required', 400);

    // Tìm hoặc tạo role patient
    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    // Tìm user cũ hoặc tạo mới
    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    let createdUser = false;
    if (!user) {
      const tempPwd = Math.random().toString(36) + Date.now();
      user = await User.create({ username: phone, passwordHash: tempPwd, roleId: patientRole._id, phone, isActive: true, isRegistered: false });
      createdUser = true;
    }

    // Tìm hoặc tạo thông tin Patient
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

    // Xử lý ngày cho Appointment (Vẫn giữ Date Object để bảng Appointment lưu chuẩn hệ thống)
    const appointmentDate = reqDate ? new Date(reqDate) : new Date();
    appointmentDate.setHours(0, 0, 0, 0);

    // Chuẩn hóa khung giờ (Dùng chung cho cả 2 bảng)
    const finalTime = time || '08:00 - 09:00'; 

    // 1. Tạo lịch hẹn chính thức hệ thống (Appointment)
    const appt = await Appointment.create({
      patientId: patient._id,
      requestedDate: appointmentDate,
      requestedTime: finalTime, 
      symptoms: req.body.symptoms || '', 
      departmentId: departmentId || undefined,
      doctorId: doctorId || undefined,
      status: 'Pending',
    });

    // 🛠️ ĐÃ SỬA: Cắt chuỗi để ép bookingDate luôn chỉ có định dạng YYYY-MM-DD (Ví dụ: "2026-06-04")
    // Dù Frontend gửi lên dạng ISO đầy đủ hay chuỗi ngắn, hệ thống vẫn sẽ bóc tách lấy phần ngày.
    const stringDate = reqDate 
      ? String(reqDate).split('T')[0] 
      : new Date().toISOString().split('T')[0];

    // 2. Tạo bản ghi QuickBooking (Chỉ lưu Chuỗi Ngày Tháng Năm thô)
    const booking = await QuickBooking.create({ 
      name, 
      phone, 
      department: departmentNameForQuick || reqDept, 
      doctor: doctorNameForQuick || reqDoc, 
      bookingDate: stringDate, // 📌 Sẽ lưu thuần chuỗi chữ ngắn gọn "2026-06-04" vào DB
      time: finalTime          
    });

    return ok(res, { appointment: appt, quickBooking: booking, createdUser }, 'Yêu cầu đặt lịch đã gửi cho nhân viên CSKH', 201);
  } catch (error) {
    console.error('createBooking error', error);
    return fail(res, 'Server error when creating booking', 500, error.message);
  }
};

module.exports = { createBooking };