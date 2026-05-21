// Module Clinical - Controller
// Xử lý: Medicines, Medical_Records, Prescriptions

const Medicine = require('../../models/Medicine');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');

const getMedicines = async (req, res) => {
  try {
    const items = await Medicine.find().lean();
    const { success: ok, fail } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách thuốc thành công');
  } catch (err) {
    console.error('getMedicines error', err);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách thuốc' });
  }
};

// Public: list doctors for frontend
const getDoctorsPublic = async (req, res) => {
  try {
    const docs = await Doctor.find({ isActive: true }).limit(50).populate('departmentId').lean();
    // Map to frontend-friendly fields
    const mapped = docs.map(d => ({
      id: d._id,
      fullName: d.fullName,
      avatar: d.avatarURL || null,
      specialization: d.specialization,
      department: d.departmentId ? d.departmentId.departmentName : null,
    }));
    const { success: ok, fail } = require('../../utils/response');
    return ok(res, mapped, 'Lấy danh sách bác sĩ thành công');
  } catch (err) {
    console.error('getDoctorsPublic error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bác sĩ', 500, err.message);
  }
};

const createMedicalRecord = (req, res) => {
  // TODO: Bác sĩ tạo hồ sơ bệnh án
  res.json({ message: 'Create medical record' });
};

const getMedicalRecords = (req, res) => {
  // TODO: Lấy hồ sơ bệnh án (patient, doctor, admin)
  res.json({ message: 'Get medical records' });
};

const createPrescription = (req, res) => {
  // TODO: Bác sĩ kê đơn
  res.json({ message: 'Create prescription' });
};

const getPrescriptions = (req, res) => {
  // TODO: Lấy danh sách đơn thuốc
  res.json({ message: 'Get prescriptions' });
};

module.exports = { getMedicines, createMedicalRecord, getMedicalRecords, createPrescription, getPrescriptions, getDoctorsPublic };
