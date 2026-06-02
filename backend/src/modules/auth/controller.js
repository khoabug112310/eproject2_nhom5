// Module Auth - Controller
// Xử lý: Login, Register, Refresh Token, Logout

const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { User, Role, Patient, Doctor, Staff } = require('../../models');
const { success: ok, fail } = require('../../utils/response');

// Login: authenticate username (phone) + password
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, 'username and password required', 400);
    const user = await User.findOne({ $or: [{ username }, { phone: username }] });
    if (!user) return fail(res, 'Invalid credentials', 401);
    const valid = await user.comparePassword(password);
    if (!valid) return fail(res, 'Invalid credentials', 401);
    // Fetch role name for payload & frontend convenience
    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;
    const payload = { id: user._id, userId: user._id, roleId: user.roleId, role: roleName };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
    let displayName = user.username;
    if (roleName === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor && doctor.fullName) displayName = doctor.fullName;
    } else if (roleName === 'staff' || roleName === 'accountant') {
      const staff = await Staff.findOne({ userId: user._id });
      if (staff && staff.fullName) displayName = staff.fullName;
    } else if (roleName === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient && patient.fullName) displayName = patient.fullName;
    }
    return ok(res, { token, role: roleName, username: user.username, displayName }, 'Login successful');
  } catch (err) {
    console.error('login error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

// Register / Activate flow
// If phone exists and no password provided -> indicate account exists (409)
// If phone exists and password provided -> set password (activate)
// If phone not exists -> create user + patient (using provided info or placeholders)
const register = async (req, res) => {
  try {
    const { phone, password, fullName, dateOfBirth, gender, identityCard, address } = req.body;
    if (!phone) return fail(res, 'Phone is required', 400);

    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    if (user) {
      // Account exists: if password provided, update password (activate)
      if (!password) return fail(res, 'Account exists. Please provide password to activate.', 409);
      user.passwordHash = password;
      if (user.isGuest) user.isGuest = false;
      await user.save();

      // Update/create patient record if info provided
      let patient = await Patient.findOne({ userId: user._id });
      if (patient) {
        const updates = {};
        if (fullName) updates.fullName = fullName;
        if (dateOfBirth) updates.dateOfBirth = new Date(dateOfBirth);
        if (gender) updates.gender = gender;
        if (identityCard) updates.identityCard = identityCard;
        if (address) updates.address = address;
        if (Object.keys(updates).length) await Patient.updateOne({ _id: patient._id }, { $set: updates });
      } else {
        // create patient with placeholders where necessary
        const dob = dateOfBirth ? new Date(dateOfBirth) : new Date('1900-01-01');
        const idCard = identityCard || `REG-${Date.now()}-${phone}`;
        await Patient.create({ userId: user._id, fullName: fullName || 'Khách hàng', dateOfBirth: dob, gender: gender || 'Khác', identityCard: idCard, phoneNumber: phone });
      }

      return ok(res, { userId: user._id }, 'Tài khoản đã được kích hoạt');
    }

    // Create new user
    if (!password) return fail(res, 'Password required for new registration', 400);
    const newUser = await User.create({ username: phone, passwordHash: password, roleId: patientRole._id, phone, isActive: true, isGuest: false });

    // Create patient record (fill placeholders if not provided)
    const dob = dateOfBirth ? new Date(dateOfBirth) : new Date('1900-01-01');
    const idCard = identityCard || `REG-${Date.now()}-${phone}`;
    await Patient.create({ userId: newUser._id, fullName: fullName || 'Khách hàng', dateOfBirth: dob, gender: gender || 'Khác', identityCard: idCard, phoneNumber: phone, address: address || '' });

    return ok(res, { userId: newUser._id }, 'Đăng ký thành công');
  } catch (err) {
    console.error('register error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return fail(res, 'User not found', 404);

    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;
    let displayName = user.username;

    if (roleName === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor?.fullName) displayName = doctor.fullName;
    } else if (roleName === 'staff' || roleName === 'accountant') {
      const staff = await Staff.findOne({ userId: user._id });
      if (staff?.fullName) displayName = staff.fullName;
    } else if (roleName === 'patient') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient?.fullName) displayName = patient.fullName;
    }

    return ok(res, {
      userId: user._id,
      username: user.username,
      role: roleName,
      displayName,
    }, 'Current user');
  } catch (err) {
    console.error('me error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

const refreshToken = (req, res) => {
  return fail(res, 'Refresh token flow is not implemented yet', 501);
};

const logout = (req, res) => {
  // Với JWT stateless, backend chỉ cần trả về thành công.
  // Nếu dùng blacklist token thì logic sẽ được thêm vào sau.
  return ok(res, null, 'Logout successful');
};

module.exports = { login, register, me, refreshToken, logout };
