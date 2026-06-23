// Module Auth - Controller
// Handles: Login, Register, Refresh Token, Logout

const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const { User, Role, Patient, Doctor, Staff } = require('../../models');
const { success: ok, fail } = require('../../utils/response');
const { sendEmail } = require('../../utils/email');
const { sendSMS, sendVerifyOTP, checkVerifyOTP } = require('../../utils/sms');

// Login: authenticate username (phone) + password
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, 'username and password required', 400);
    const user = await User.findOne({ $or: [{ username }, { phone: username }, { email: username }] });
    if (!user) return fail(res, 'Invalid credentials', 401);
    const valid = await user.comparePassword(password);
    if (!valid) return fail(res, 'Invalid credentials', 401);
    
    // Check if account is active
    if (user.isActive === false) {
      return fail(res, 'Your account has been locked. Please contact the administrator.', 403);
    }
    // Fetch role name for payload & frontend convenience
    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;
    const payload = { id: user._id, roleId: user.roleId, role: roleName };
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
    return ok(res, { token, role: roleName, username: user.username, displayName, userId: user._id }, 'Login successful');
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
    const { phone, password, fullName, dateOfBirth, gender, identityCard, address, email } = req.body;
    if (!phone) return fail(res, 'Phone is required', 400);

    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    let user = await User.findOne({ $or: [{ username: phone }, { phone }] });
    if (user) {
      if (user.isRegistered) {
        return fail(res, 'This phone number is already registered. Please log in.', 422);
      }

      // Account exists but not registered: if password provided, update password (activate)
      if (!password) {
        const patient = await Patient.findOne({ userId: user._id });
        const patientName = patient ? patient.fullName : '';
        return res.status(409).json({
          success: false,
          message: 'Account exists. Please provide password to activate.',
          data: { fullName: patientName }
        });
      }

      // Validate email uniqueness if provided
      if (email) {
        const emailExists = await User.findOne({ email });
        if (emailExists && String(emailExists._id) !== String(user._id)) {
          return fail(res, 'Email address is already in use by another account', 400);
        }
        user.email = email;
      }

      user.passwordHash = password;
      user.isRegistered = true;
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
        await Patient.create({ userId: user._id, fullName: fullName || 'Guest', dateOfBirth: dob, gender: gender || 'Khác', identityCard: idCard, phoneNumber: phone });
      }

      return ok(res, { userId: user._id }, 'Account activated successfully');
    }

    // Create new user
    if (!password) return fail(res, 'Password required for new registration', 400);

    // Validate email uniqueness if provided
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return fail(res, 'Email address is already in use by another account', 400);
      }
    }

    const newUser = await User.create({ username: phone, passwordHash: password, roleId: patientRole._id, phone, email, isActive: true, isRegistered: true });

    // Create patient record (fill placeholders if not provided)
    const dob = dateOfBirth ? new Date(dateOfBirth) : new Date('1900-01-01');
    const idCard = identityCard || `REG-${Date.now()}-${phone}`;
    await Patient.create({ userId: newUser._id, fullName: fullName || 'Guest', dateOfBirth: dob, gender: gender || 'Khác', identityCard: idCard, phoneNumber: phone, address: address || '' });

    return ok(res, { userId: newUser._id }, 'Registration successful');
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
  res.status(501).json({ message: 'Not implemented' });
};

const logout = (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const impersonate = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Safety check: only admins can impersonate (this is also guarded in routes)
    if (req.user.role !== 'admin') {
      return fail(res, 'Access denied. Only an administrator can impersonate users.', 403);
    }
    
    const user = await User.findById(userId);
    if (!user) return fail(res, 'User account not found', 404);
    
    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;
    
    const payload = { id: user._id, roleId: user.roleId, role: roleName };
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
    
    return ok(res, { token, role: roleName, username: user.username, displayName }, 'Impersonation successful');
  } catch (err) {
    console.error('impersonate error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

// Forgot Password: check phone/email + generate 6-digit code
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body; // keeps compatibility, can be email or phone
    if (!phone) return fail(res, 'Phone number or Email is required', 400);

    const user = await User.findOne({ $or: [{ username: phone }, { phone: phone }, { email: phone }] });
    if (!user) {
      return fail(res, 'This phone number or email is not registered in our system.', 404);
    }
    if (!user.email && !user.phone) {
      return fail(res, 'This account does not have a configured email or phone number. Please contact support.', 400);
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration
    await user.save();

    // Construct premium HTML email template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verification OTP - Hopsontai Clinic</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .email-container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); overflow: hidden; border: 1px solid #e2e8f0; }
        .email-header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; color: #ffffff; }
        .email-header h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .email-body { padding: 40px 30px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
        .instructions { font-size: 15px; color: #475569; margin-bottom: 30px; }
        .otp-card { background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1; }
        .otp-code { font-size: 36px; font-weight: 800; color: #1d4ed8; letter-spacing: 6px; margin: 0; font-family: 'Courier New', Courier, monospace; }
        .otp-expiration { font-size: 13px; color: #64748b; margin-top: 8px; margin-bottom: 0; font-weight: 500; }
        .security-notice { font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
        .email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h2>HOPSONTAI CLINIC</h2>
        </div>
        <div class="email-body">
          <p class="greeting">Hello,</p>
          <p class="instructions">You have requested to reset the password for your account registered at Hopsontai Clinic. Please use the following OTP code to verify your identity:</p>
          <div class="otp-card">
            <p class="otp-code">${code}</p>
            <p class="otp-expiration">This verification code is valid for 5 minutes</p>
          </div>
          <p class="instructions">If you did not make this request, please ignore this email or contact customer support if you have any questions.</p>
        </div>
        <div class="email-footer">
          <p>© 2026 Hopsontai Clinic. All rights reserved.</p>
          <p>Address: Cach Mang Thang 8 Street, District 3, Ho Chi Minh City</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const isEmailInput = phone.includes('@');
    let emailSent = false;
    let smsSent = false;
    let responseMsg = '';

    if (isEmailInput) {
      if (user.email) {
        try {
          await sendEmail(user.email, 'Verification OTP Code - Hopsontai Clinic', emailHtml);
          emailSent = true;
          responseMsg = 'Mã xác thực OTP đã được gửi đến email của bạn. / Verification OTP code has been sent to your email.';
        } catch (emailErr) {
          console.error('Failed to send Email OTP:', emailErr);
          return fail(res, 'Failed to send verification code via email. Please try again.', 500);
        }
      } else {
        return fail(res, 'Tài khoản này không có email đã cấu hình. / This account does not have a configured email address.', 400);
      }
    } else {
      if (user.phone) {
        try {
          // Use Twilio Verify API to bypass Vietnam carriers restrictions for US Trial numbers
          const result = await sendVerifyOTP(user.phone);
          if (result && result.success) {
            smsSent = true;
          } else {
            console.error('Failed to send SMS OTP via Twilio Verify:', result ? result.error : 'No response');
            // Fallback simulation so user is not blocked during demo/test if Twilio trial is restricted
            console.log(`\n======================================================`);
            console.log(`[SMS FALLBACK SIMULATION - TWILIO ERROR]`);
            console.log(`To: ${user.phone}`);
            console.log(`Message: "Your Hopsontai Clinic verification OTP code is: ${code}. Valid for 5 minutes."`);
            console.log(`======================================================\n`);
            smsSent = true;
          }
          responseMsg = 'Mã xác thực OTP đã được gửi đến số điện thoại của bạn. / Verification OTP code has been sent to your phone number.';
        } catch (smsErr) {
          console.error('Failed to send SMS OTP via Twilio Verify:', smsErr);
          // Fallback simulation so user is not blocked during demo/test if Twilio trial is restricted
          console.log(`\n======================================================`);
          console.log(`[SMS FALLBACK SIMULATION - TWILIO ERROR]`);
          console.log(`To: ${user.phone}`);
          console.log(`Message: "Your Hopsontai Clinic verification OTP code is: ${code}. Valid for 5 minutes."`);
          console.log(`======================================================\n`);
          smsSent = true;
          responseMsg = 'Mã xác thực OTP đã được gửi đến số điện thoại của bạn. / Verification OTP code has been sent to your phone number.';
        }
      } else {
        return fail(res, 'Tài khoản này không có số điện thoại đã cấu hình. / This account does not have a configured phone number.', 400);
      }
    }

    // Return the code in the response for test ease
    return ok(res, { code }, responseMsg);
  } catch (err) {
    console.error('forgotPassword error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

// Reset Password: verify code + change password
const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    if (!phone || !code || !newPassword) {
      return fail(res, 'Please provide all required info: phone number/email, verification code, and new password.', 400);
    }

    const user = await User.findOne({ $or: [{ username: phone }, { phone: phone }, { email: phone }] });
    if (!user) return fail(res, 'Account does not exist.', 404);

    const isEmail = phone.includes('@');
    let isValid = false;

    if (isEmail) {
      // For email, strictly check the local database reset code
      if (user.resetCode && user.resetCode === code && user.resetCodeExpires && user.resetCodeExpires >= new Date()) {
        isValid = true;
      }
    } else {
      // For phone, try Twilio Verify check first
      if (user.phone) {
        try {
          const verifyResult = await checkVerifyOTP(user.phone, code);
          if (verifyResult && verifyResult.success) {
            isValid = true;
          }
        } catch (verifyErr) {
          console.error('Twilio Verify Check API failed:', verifyErr);
        }
      }
      // Local database fallback for phone
      if (!isValid && user.resetCode && user.resetCode === code && user.resetCodeExpires && user.resetCodeExpires >= new Date()) {
        isValid = true;
      }
    }

    if (!isValid) {
      return fail(res, 'Invalid or expired verification code.', 400);
    }

    // Hash of newPassword is auto done by pre('save') hook
    user.passwordHash = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    return ok(res, null, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    console.error('resetPassword error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

// Verify OTP without resetting password
const verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return fail(res, 'Phone/Email and code are required.', 400);
    }

    const user = await User.findOne({ $or: [{ username: phone }, { phone }, { email: phone }] });
    if (!user) return fail(res, 'Account does not exist.', 404);

    const isEmail = phone.includes('@');
    let isValid = false;

    if (isEmail) {
      // For email, strictly check the local database reset code
      if (user.resetCode && user.resetCode === code && user.resetCodeExpires && user.resetCodeExpires >= new Date()) {
        isValid = true;
      }
    } else {
      // For phone, try Twilio Verify check first
      if (user.phone) {
        try {
          const verifyResult = await checkVerifyOTP(user.phone, code);
          if (verifyResult && verifyResult.success) {
            isValid = true;
          }
        } catch (verifyErr) {
          console.error('Twilio Verify Check API failed during validation:', verifyErr);
        }
      }
      // Local database fallback for phone
      if (!isValid && user.resetCode && user.resetCode === code && user.resetCodeExpires && user.resetCodeExpires >= new Date()) {
        isValid = true;
      }
    }

    if (!isValid) {
      return fail(res, 'Invalid or expired verification code.', 400);
    }

    return ok(res, null, 'Code is valid.');
  } catch (err) {
    console.error('verifyOtp error', err);
    return fail(res, 'Server error', 500, err.message);
  }
};

module.exports = { login, register, me, refreshToken, logout, impersonate, forgotPassword, resetPassword, verifyOtp };

