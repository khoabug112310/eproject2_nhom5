// Module Profiles - Controller
// Xử lý: Users (Admin, Doctor, Staff), Patients, Doctors, Staffs

const getAllUsers = (req, res) => {
  // TODO: Lấy danh sách tất cả users
  res.json({ message: 'Get all users' });
};

const getUserById = (req, res) => {
  // TODO: Lấy chi tiết user theo ID
  res.json({ message: 'Get user by ID' });
};

const updateUser = (req, res) => {
  // TODO: Cập nhật thông tin user
  res.json({ message: 'Update user' });
};

const createDoctor = (req, res) => {
  // TODO: Tạo bác sĩ mới (đặc biệt: specialty, license, schedule)
  res.json({ message: 'Create doctor' });
};

const getPatients = (req, res) => {
  // TODO: Lấy danh sách bệnh nhân
  res.json({ message: 'Get patients' });
};

module.exports = { getAllUsers, getUserById, updateUser, createDoctor, getPatients };
