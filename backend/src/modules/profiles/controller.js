// Module Profiles - Controller
// Xử lý: Users (Admin, Doctor, Staff), Patients, Doctors, Staffs

const User = require('../../models/User');
const Role = require('../../models/Role');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Staff = require('../../models/Staff');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('roleId').lean();
    const mapped = [];
    for (const u of users) {
      const roleName = u.roleId ? u.roleId.roleName : null;
      let details = null;
      if (roleName === 'doctor') {
        details = await Doctor.findOne({ userId: u._id }).populate('departmentId').lean();
      } else if (roleName === 'staff' || roleName === 'accountant') {
        details = await Staff.findOne({ userId: u._id }).lean();
      } else if (roleName === 'patient') {
        details = await Patient.findOne({ userId: u._id }).lean();
      }
      mapped.push({
        ...u,
        role: roleName,
        profile: details
      });
    }
    const { success: ok } = require('../../utils/response');
    return ok(res, mapped, 'Lấy danh sách người dùng thành công');
  } catch (err) {
    console.error('getAllUsers error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách người dùng', 500, err.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if doctor profile id
    const doc = await Doctor.findById(id).populate('departmentId').lean();
    const { success: ok } = require('../../utils/response');
    if (doc) return ok(res, doc, 'Lấy thông tin bác sĩ thành công');
    
    // Otherwise check Patient profile id
    const pat = await Patient.findById(id).lean();
    if (pat) return ok(res, pat, 'Lấy thông tin bệnh nhân thành công');

    // Otherwise check User
    const user = await User.findById(id).populate('roleId').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    return ok(res, user, 'Lấy thông tin người dùng thành công');
  } catch (err) {
    console.error('getUserById error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy thông tin người dùng', 500, err.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Check if it is a patient record
    let patient = await Patient.findById(id);
    if (patient) {
      if (body.fullName) patient.fullName = body.fullName;
      if (body.dateOfBirth) patient.dateOfBirth = new Date(body.dateOfBirth);
      if (body.gender) patient.gender = body.gender;
      if (body.identityCard) patient.identityCard = body.identityCard;
      if (body.phoneNumber) patient.phoneNumber = body.phoneNumber;
      if (body.address !== undefined) patient.address = body.address;
      if (body.insuranceCode !== undefined) patient.insuranceCode = body.insuranceCode;
      if (body.emergencyContact !== undefined) patient.emergencyContact = body.emergencyContact;
      await patient.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, patient, 'Cập nhật thông tin bệnh nhân thành công');
    }

    // Check if doctor
    let doctor = await Doctor.findById(id);
    if (doctor) {
      if (body.fullName) doctor.fullName = body.fullName;
      if (body.specialization) doctor.specialization = body.specialization;
      if (body.departmentId) doctor.departmentId = body.departmentId;
      if (body.qualifications) doctor.qualifications = body.qualifications;
      if (typeof body.experienceYears === 'number') doctor.experienceYears = body.experienceYears;
      if (typeof body.baseFee === 'number') doctor.baseFee = body.baseFee;
      if (body.bio !== undefined) doctor.bio = body.bio;
      if (body.avatarURL !== undefined) doctor.avatarURL = body.avatarURL;
      await doctor.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, doctor, 'Cập nhật thông tin bác sĩ thành công');
    }

    // Check if staff
    let staff = await Staff.findById(id);
    if (staff) {
      if (body.fullName) staff.fullName = body.fullName;
      if (body.phoneNumber) staff.phoneNumber = body.phoneNumber;
      if (body.position) staff.position = body.position;
      await staff.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, staff, 'Cập nhật nhân viên thành công');
    }

    // Check if user
    let user = await User.findById(id);
    if (user) {
      if (body.email !== undefined) user.email = body.email;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.isActive !== undefined) user.isActive = body.isActive;
      await user.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, user, 'Cập nhật tài khoản thành công');
    }

    return res.status(404).json({ success: false, message: 'Không tìm thấy đối tượng cần cập nhật' });
  } catch (err) {
    console.error('updateUser error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật thông tin', 500, err.message);
  }
};

const createDoctor = async (req, res) => {
  try {
    const { username, password, roleName, fullName, email, phone, departmentId, specialization, experienceYears, qualifications, baseFee, bio, position } = req.body;
    if (!username || !password || !roleName || !fullName) {
      return res.status(400).json({ success: false, message: 'username, password, roleName, fullName là bắt buộc' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
    }

    const role = await Role.findOne({ roleName });
    if (!role) {
      return res.status(400).json({ success: false, message: 'Quyền roleName không hợp lệ hoặc chưa định cấu hình' });
    }

    const user = await User.create({
      username,
      passwordHash: password, // auto hashed by User pre-save middleware
      roleId: role._id,
      email,
      phone: phone || username,
      isActive: true,
      isRegistered: true
    });

    let details = null;
    if (roleName === 'doctor') {
      details = await Doctor.create({
        userId: user._id,
        fullName,
        specialization: specialization || 'Chuyên khoa',
        departmentId: departmentId,
        experienceYears: Number(experienceYears) || 0,
        qualifications: qualifications || 'Bác sĩ chuyên khoa',
        baseFee: Number(baseFee) || 150000,
        bio: bio || '',
        avatarURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
      });
    } else if (roleName === 'staff' || roleName === 'accountant') {
      details = await Staff.create({
        userId: user._id,
        fullName,
        phoneNumber: phone || username,
        position: position || (roleName === 'accountant' ? 'Kế toán' : 'CSKH')
      });
    } else if (roleName === 'patient') {
      details = await Patient.create({
        userId: user._id,
        fullName,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Khác',
        identityCard: `ADM-${Date.now()}`,
        phoneNumber: phone || username
      });
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, { user, profile: details }, 'Đăng ký tài khoản thành công', 201);
  } catch (err) {
    console.error('createDoctor error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi đăng ký tài khoản', 500, err.message);
  }
};

const getPatients = async (req, res) => {
  try {
    const list = await Patient.find().populate('userId').sort({ fullName: 1 }).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, list, 'Lấy danh sách bệnh nhân thành công');
  } catch (err) {
    console.error('getPatients error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bệnh nhân', 500, err.message);
  }
};

const getAdminStats = async (req, res) => {
  try {
    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');

    const now = new Date();
    
    // Start of Day
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Start of Week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Registrations
    const regToday = await Appointment.countDocuments({ createdAt: { $gte: startOfDay } });
    const regThisWeek = await Appointment.countDocuments({ createdAt: { $gte: startOfWeek } });
    const regThisMonth = await Appointment.countDocuments({ createdAt: { $gte: startOfMonth } });

    // 2. Examined Patients (Completed appointments)
    const examToday = await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: startOfDay } });
    const examThisWeek = await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: startOfWeek } });
    const examThisMonth = await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: startOfMonth } });

    // 3. Revenues (Sum of totalAmount for paid invoices)
    const getRevenue = async (startDate) => {
      const match = await Invoice.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return match.length > 0 ? match[0].total : 0;
    };

    const revToday = await getRevenue(startOfDay);
    const revThisWeek = await getRevenue(startOfWeek);
    const revThisMonth = await getRevenue(startOfMonth);

    // Breakdown: consultation vs pharmacy for this month
    const breakdown = await Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: '$invoiceType', total: { $sum: '$totalAmount' } } }
    ]);

    const breakdownData = {
      consultation: 0,
      pharmacy: 0
    };
    breakdown.forEach(item => {
      if (item._id === 'Consultation') breakdownData.consultation = item.total;
      if (item._id === 'Pharmacy') breakdownData.pharmacy = item.total;
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, {
      registrations: { day: regToday, week: regThisWeek, month: regThisMonth },
      examinations: { day: examToday, week: examThisWeek, month: examThisMonth },
      revenue: { day: revToday, week: revThisWeek, month: revThisMonth },
      breakdown: breakdownData
    }, 'Lấy số liệu thống kê thành công');
  } catch (err) {
    console.error('getAdminStats error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy số liệu thống kê', 500, err.message);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, createDoctor, getPatients, getAdminStats };
