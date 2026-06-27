// Module Profiles - Controller
// Handles: Users (Admin, Doctor, Staff), Patients, Doctors, Staffs

const User = require('../../models/User');
const Role = require('../../models/Role');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Staff = require('../../models/Staff');

const validatePatientAgeRequirements = (dob, body, existingPatient = {}) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 15) {
    const bc = body.birthCertificate !== undefined ? body.birthCertificate : existingPatient.birthCertificate;
    const pid = body.personalId !== undefined ? body.personalId : existingPatient.personalId;
    if (!(bc && bc.trim()) && !(pid && pid.trim())) {
      return 'Children under 15 years old must provide a Birth Certificate or a Personal Identification Code.';
    }
  } else if (age >= 60) {
    const idCard = body.identityCard !== undefined ? body.identityCard : existingPatient.identityCard;
    if (!idCard || !idCard.trim() || idCard.startsWith('REG-') || idCard.startsWith('ADM-') || idCard.startsWith('QUICK-')) {
      return 'Elderly patients aged 60 and above must provide a National ID Card (CCCD/CMND).';
    }
  }
  return null;
};

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
    return ok(res, mapped, 'User list loaded successfully');
  } catch (err) {
    console.error('getAllUsers error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the user list', 500, err.message);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if doctor profile id
    const doc = await Doctor.findById(id).populate('departmentId').lean();
    const { success: ok } = require('../../utils/response');
    if (doc) return ok(res, doc, 'Doctor information loaded successfully');
    
    // Otherwise check Patient profile id
    const pat = await Patient.findById(id).populate('parentId').lean();
    if (pat) {
      if (pat.parentId) {
        pat.phoneNumber = pat.phoneNumber || pat.parentId.phoneNumber || '';
        pat.address = pat.address && pat.address.trim() ? pat.address.trim() : (pat.parentId.address || '');
      }
      return ok(res, pat, 'Patient information loaded successfully');
    }

    // Otherwise check User
    const user = await User.findById(id).populate('roleId').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return ok(res, user, 'User information loaded successfully');
  } catch (err) {
    console.error('getUserById error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading user information', 500, err.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Check if it is a patient record
    let patient = await Patient.findById(id);
    if (patient) {
      const dob = body.dateOfBirth ? new Date(body.dateOfBirth) : patient.dateOfBirth;
      const validationError = validatePatientAgeRequirements(dob, body, patient);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      if (body.fullName) patient.fullName = body.fullName;
      if (body.dateOfBirth) patient.dateOfBirth = new Date(body.dateOfBirth);
      if (body.gender) patient.gender = body.gender;
      if (body.identityCard !== undefined) patient.identityCard = body.identityCard || undefined;
      if (body.identityCardImg !== undefined) patient.identityCardImg = body.identityCardImg || undefined;
      if (body.birthCertificate !== undefined) patient.birthCertificate = body.birthCertificate || undefined;
      if (body.birthCertificateImg !== undefined) patient.birthCertificateImg = body.birthCertificateImg || undefined;
      if (body.personalId !== undefined) patient.personalId = body.personalId || undefined;
      let parentPatient = null;
      if (patient.parentId) {
        parentPatient = await Patient.findById(patient.parentId);
      }

      if (body.phoneNumber !== undefined) {
        if (parentPatient) {
          patient.phoneNumber = (body.phoneNumber && body.phoneNumber.trim() && body.phoneNumber.trim() !== parentPatient.phoneNumber) ? body.phoneNumber.trim() : undefined;
        } else {
          patient.phoneNumber = body.phoneNumber || undefined;
        }
      }
      if (body.email !== undefined) patient.email = body.email || undefined;
      if (body.address !== undefined) {
        if (parentPatient) {
          patient.address = (body.address && body.address.trim() && body.address.trim() !== parentPatient.address) ? body.address.trim() : '';
        } else {
          patient.address = body.address;
        }
      }
      if (body.insuranceCode !== undefined) patient.insuranceCode = body.insuranceCode;
      if (body.emergencyContact !== undefined) patient.emergencyContact = body.emergencyContact;
      await patient.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, patient, 'Patient information updated successfully');
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
      return ok(res, doctor, 'Doctor information updated successfully');
    }

    // Check if staff
    let staff = await Staff.findById(id);
    if (staff) {
      if (body.fullName) staff.fullName = body.fullName;
      if (body.phoneNumber) staff.phoneNumber = body.phoneNumber;
      if (body.position) staff.position = body.position;
      await staff.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, staff, 'Staff updated successfully');
    }

    // Check if user
    let user = await User.findById(id);
    if (user) {
      if (body.email !== undefined) user.email = body.email;
      if (body.phone !== undefined) user.phone = body.phone;
      if (body.isActive !== undefined) user.isActive = body.isActive;
      await user.save();
      const { success: ok } = require('../../utils/response');
      return ok(res, user, 'Account updated successfully');
    }

    return res.status(404).json({ success: false, message: 'The record to update was not found' });
  } catch (err) {
    console.error('updateUser error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating information', 500, err.message);
  }
};

const createDoctor = async (req, res) => {
  try {
    const { username, password, roleName, fullName, email, phone, departmentId, specialization, experienceYears, qualifications, baseFee, bio, position } = req.body;
    if (!username || !password || !roleName || !fullName) {
      return res.status(400).json({ success: false, message: 'username, password, roleName, and fullName are required' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const role = await Role.findOne({ roleName });
    if (!role) {
      return res.status(400).json({ success: false, message: 'The roleName is invalid or not configured' });
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
        specialization: specialization || 'Specialist',
        departmentId: departmentId,
        experienceYears: Number(experienceYears) || 0,
        qualifications: qualifications || 'Specialist Doctor',
        baseFee: Number(baseFee) || 150000,
        bio: bio || '',
        avatarURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'
      });
    } else if (roleName === 'staff' || roleName === 'accountant') {
      details = await Staff.create({
        userId: user._id,
        fullName,
        phoneNumber: phone || username,
        position: position || (roleName === 'accountant' ? 'Accountant' : 'Customer Care')
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
    return ok(res, { user, profile: details }, 'Account registered successfully', 201);
  } catch (err) {
    console.error('createDoctor error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error registering the account', 500, err.message);
  }
};

const getPatients = async (req, res) => {
  try {
    const { Appointment, Invoice, Medical_Record } = require('../../models');

    // 1. Fetch all patients
    let patients = await Patient.find().populate('userId').populate('parentId').lean();

    // Group patients by phone number to identify duplicates
    const phoneMap = {};
    for (const patient of patients) {
      const phone = (patient.phoneNumber || '').trim();
      if (!phone) continue;
      if (!phoneMap[phone]) {
        phoneMap[phone] = [];
      }
      phoneMap[phone].push(patient);
    }

    let mergedAny = false;

    // Process duplicates
    for (const phone of Object.keys(phoneMap)) {
      const group = phoneMap[phone];
      if (group.length <= 1) continue;

      // Find the normal registered patient (userId.isRegistered === true)
      const normalPatient = group.find(p => p.userId && p.userId.isRegistered === true);
      if (!normalPatient) continue; // If no normal registered patient, we don't merge

      // Find any quick booking patients (userId.isRegistered === false or missing userId)
      const quickPatients = group.filter(p => p._id.toString() !== normalPatient._id.toString());

      for (const quickPatient of quickPatients) {
        const quickPatientId = quickPatient._id;
        const normalPatientId = normalPatient._id;

        // Merge references in other tables
        await Appointment.updateMany({ patientId: quickPatientId }, { $set: { patientId: normalPatientId } });
        await Invoice.updateMany({ patientId: quickPatientId }, { $set: { patientId: normalPatientId } });
        await Medical_Record.updateMany({ patientId: quickPatientId }, { $set: { patientId: normalPatientId } });
        await Patient.updateMany({ parentId: quickPatientId }, { $set: { parentId: normalPatientId } });

        // Delete the temporary Quick Booking Patient record
        await Patient.deleteOne({ _id: quickPatientId });

        // Delete the temporary Quick Booking User record (if it exists)
        if (quickPatient.userId) {
          const quickUserId = quickPatient.userId._id || quickPatient.userId;
          if (normalPatient.userId && normalPatient.userId._id.toString() !== quickUserId.toString()) {
            await User.deleteOne({ _id: quickUserId });
          }
        }
        
        mergedAny = true;
      }
    }

    // 2. Re-fetch patients if we merged any to get the clean list
    if (mergedAny) {
      patients = await Patient.find().populate('userId').populate('parentId').lean();
    }

    // 3. Categorize patients
    const normal = [];
    const dependents = [];
    const quickBooking = [];

    for (const p of patients) {
      if (p.userId && p.userId.isRegistered === true) {
        normal.push(p);
      } else if (p.parentId) {
        const parentInfo = p.parentId;
        const mappedP = {
          ...p,
          phoneNumber: p.phoneNumber || (parentInfo && parentInfo.phoneNumber) || '',
          address: p.address && p.address.trim() ? p.address.trim() : ((parentInfo && parentInfo.address) || '')
        };
        dependents.push(mappedP);
      } else {
        quickBooking.push(p);
      }
    }

    // Sort all arrays by fullName
    const sortByFullName = (a, b) => (a.fullName || '').localeCompare(b.fullName || '');
    normal.sort(sortByFullName);
    dependents.sort(sortByFullName);
    quickBooking.sort(sortByFullName);

    const { success: ok } = require('../../utils/response');
    return ok(res, { normal, dependents, quickBooking }, 'Patient list loaded successfully');
  } catch (err) {
    console.error('getPatients error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the patient list', 500, err.message);
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

    // === CALCULATE TIME SERIES DATA FOR CHARTS ===
    // 1. WEEK CHART (Monday to Sunday of the current week)
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekRevenue = [];
    const weekTraffic = [];

    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dStart = new Date(monday);
      dStart.setDate(monday.getDate() + i);
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      const dailyRevRes = await Invoice.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: dStart, $lte: dEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const dailyRev = dailyRevRes.length > 0 ? dailyRevRes[0].total : 0;
      weekRevenue.push(dailyRev);

      const dailyPatients = await Appointment.countDocuments({
        requestedDate: { $gte: dStart, $lte: dEnd }
      });
      weekTraffic.push(dailyPatients);
    }

    // 2. MONTH CHART (4 weeks of the current month)
    const monthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const monthRevenue = [];
    const monthTraffic = [];

    for (let w = 1; w <= 4; w++) {
      const wStart = new Date(now.getFullYear(), now.getMonth(), (w - 1) * 7 + 1, 0, 0, 0, 0);
      let wEnd;
      if (w === 4) {
        wEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        wEnd = new Date(now.getFullYear(), now.getMonth(), w * 7, 23, 59, 59, 999);
      }

      const weeklyRevRes = await Invoice.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: wStart, $lte: wEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const weeklyRev = weeklyRevRes.length > 0 ? weeklyRevRes[0].total : 0;
      monthRevenue.push(weeklyRev);

      const weeklyPatients = await Appointment.countDocuments({
        requestedDate: { $gte: wStart, $lte: wEnd }
      });
      monthTraffic.push(weeklyPatients);
    }

    // 3. YEAR CHART (12 months of the current year)
    const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearRevenue = [];
    const yearTraffic = [];

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(now.getFullYear(), m, 1, 0, 0, 0, 0);
      const mEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);

      const monthlyRevRes = await Invoice.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: mStart, $lte: mEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const monthlyRev = monthlyRevRes.length > 0 ? monthlyRevRes[0].total : 0;
      yearRevenue.push(monthlyRev);

      const monthlyPatients = await Appointment.countDocuments({
        requestedDate: { $gte: mStart, $lte: mEnd }
      });
      yearTraffic.push(monthlyPatients);
    }

    // === YEAR-OVER-YEAR COMPARISON DATA ===
    const prevYearNum = now.getFullYear() - 1;
    const prevYearRevenue = [];
    const prevYearTraffic = [];
    const prevYearRegistrations = [];

    for (let m = 0; m < 12; m++) {
      const mStart = new Date(prevYearNum, m, 1, 0, 0, 0, 0);
      const mEnd = new Date(prevYearNum, m + 1, 0, 23, 59, 59, 999);

      const prevRevRes = await Invoice.aggregate([
        { $match: { status: 'Paid', paidAt: { $gte: mStart, $lte: mEnd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      prevYearRevenue.push(prevRevRes.length > 0 ? prevRevRes[0].total : 0);

      const prevTraffic = await Appointment.countDocuments({ requestedDate: { $gte: mStart, $lte: mEnd } });
      prevYearTraffic.push(prevTraffic);

      const prevRegs = await Appointment.countDocuments({ createdAt: { $gte: mStart, $lte: mEnd } });
      prevYearRegistrations.push(prevRegs);
    }

    // Same month last year
    const sameMonthPrevYearStart = new Date(prevYearNum, now.getMonth(), 1);
    const sameMonthPrevYearEnd = new Date(prevYearNum, now.getMonth() + 1, 0, 23, 59, 59, 999);
    const smlyRevRes = await Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: sameMonthPrevYearStart, $lte: sameMonthPrevYearEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const smlyRev = smlyRevRes.length > 0 ? smlyRevRes[0].total : 0;
    const smlyExams = await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: sameMonthPrevYearStart, $lte: sameMonthPrevYearEnd } });
    const smlyRegs = await Appointment.countDocuments({ createdAt: { $gte: sameMonthPrevYearStart, $lte: sameMonthPrevYearEnd } });

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lmRevRes = await Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const lmRev = lmRevRes.length > 0 ? lmRevRes[0].total : 0;
    const lmExams = await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: lastMonthStart, $lte: lastMonthEnd } });
    const lmRegs = await Appointment.countDocuments({ createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } });

    // === CALCULATE QUALITY METRICS ===
    const Doctor = require('../../models/Doctor');
    const Staff = require('../../models/Staff');
    const User = require('../../models/User');

    const confirmedAppts = await Appointment.find({
      status: { $in: ['Confirmed', 'Completed'] },
      confirmedBy: { $exists: true }
    }).select('createdAt updatedAt');
    
    let totalMinutes = 0;
    let count = 0;
    confirmedAppts.forEach(appt => {
      const diffMs = appt.updatedAt - appt.createdAt;
      if (diffMs > 0) {
        totalMinutes += diffMs / 1000 / 60;
        count++;
      }
    });
    const avgConfirmationTime = count > 0 ? Math.round(totalMinutes / count) : 15;

    // Rates: Success vs Canceled
    const successCount = await Appointment.countDocuments({ status: { $in: ['Confirmed', 'Completed'] } });
    const canceledCount = await Appointment.countDocuments({ status: 'Canceled' });
    const pendingCount = await Appointment.countDocuments({ status: 'Pending' });
    const totalAppts = successCount + canceledCount + pendingCount;
    
    const successRate = totalAppts > 0 ? Math.round((successCount / totalAppts) * 100) : 100;
    const cancellationRate = totalAppts > 0 ? Math.round((canceledCount / totalAppts) * 100) : 0;
    const pendingRate = totalAppts > 0 ? Math.round((pendingCount / totalAppts) * 100) : 0;

    // Peak Hours
    const timeSlots = await Appointment.aggregate([
      { $match: { status: { $ne: 'Canceled' } } },
      { $group: { _id: '$requestedTime', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const peakHours = timeSlots.slice(0, 3).map(slot => ({
      time: slot._id || 'Not scheduled',
      count: slot.count
    }));

    // Performance comparison
    const doctorStats = await Appointment.aggregate([
      { $match: { status: 'Completed', doctorId: { $ne: null } } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const doctorsPerformance = [];
    for (const docStat of doctorStats) {
      const doc = await Doctor.findById(docStat._id).select('fullName');
      if (doc) {
        doctorsPerformance.push({
          name: doc.fullName,
          count: docStat.count
        });
      }
    }

    const cskhStats = await Appointment.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Completed'] }, confirmedBy: { $ne: null } } },
      { $group: { _id: '$confirmedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const cskhPerformance = [];
    for (const staffStat of cskhStats) {
      const staff = await Staff.findOne({ userId: staffStat._id }).select('fullName');
      if (staff) {
        cskhPerformance.push({
          name: staff.fullName,
          count: staffStat.count
        });
      } else {
        const usr = await User.findById(staffStat._id).select('username');
        cskhPerformance.push({
          name: usr ? usr.username : `NV #${staffStat._id.toString().substring(18)}`,
          count: staffStat.count
        });
      }
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, {
      registrations: { day: regToday, week: regThisWeek, month: regThisMonth },
      examinations: { day: examToday, week: examThisWeek, month: examThisMonth },
      revenue: { day: revToday, week: revThisWeek, month: revThisMonth },
      breakdown: breakdownData,
      qualityMetrics: {
        avgConfirmationTime,
        rates: {
          success: successRate,
          canceled: cancellationRate,
          pending: pendingRate,
          counts: {
            success: successCount,
            canceled: canceledCount,
            pending: pendingCount
          }
        },
        peakHours,
        performance: {
          doctors: doctorsPerformance,
          cskh: cskhPerformance
        }
      },
      charts: {
        week: { labels: weekLabels, revenue: weekRevenue, traffic: weekTraffic },
        month: { labels: monthLabels, revenue: monthRevenue, traffic: monthTraffic },
        year: { labels: yearLabels, revenue: yearRevenue, traffic: yearTraffic }
      },
      yoy: {
        labels: yearLabels,
        thisYear: { revenue: yearRevenue, traffic: yearTraffic, registrations: yearRevenue.map((_, i) => yearTraffic[i]) },
        lastYear: { revenue: prevYearRevenue, traffic: prevYearTraffic, registrations: prevYearRegistrations },
        currentYear: now.getFullYear(),
        previousYear: prevYearNum
      },
      comparison: {
        thisMonth: { revenue: revThisMonth, examinations: examThisMonth, registrations: regThisMonth },
        sameMonthLastYear: { revenue: smlyRev, examinations: smlyExams, registrations: smlyRegs },
        lastMonth: { revenue: lmRev, examinations: lmExams, registrations: lmRegs }
      }
    }, 'Statistics loaded successfully');
  } catch (err) {
    console.error('getAdminStats error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading statistics', 500, err.message);
  }
};

const getReportData = async (req, res) => {
  try {
    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');

    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || 0; // 0 = all months (yearly view)
    const compareYear = parseInt(req.query.compareYear) || (year - 1);

    const sumArr = (arr) => arr.reduce((a, b) => a + b, 0);

    const getSliceData = async (yr, mo) => {
      const revenue = [], patients = [], registrations = [], cancellations = [];
      const slices = mo === 0 ? 12 : 4;

      for (let i = 0; i < slices; i++) {
        let sStart, sEnd;
        if (mo === 0) {
          sStart = new Date(yr, i, 1, 0, 0, 0, 0);
          sEnd = new Date(yr, i + 1, 0, 23, 59, 59, 999);
        } else {
          sStart = new Date(yr, mo - 1, i * 7 + 1, 0, 0, 0, 0);
          sEnd = i === 3
            ? new Date(yr, mo, 0, 23, 59, 59, 999)
            : new Date(yr, mo - 1, (i + 1) * 7, 23, 59, 59, 999);
        }

        const revRes = await Invoice.aggregate([
          { $match: { status: 'Paid', paidAt: { $gte: sStart, $lte: sEnd } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        revenue.push(revRes[0]?.total || 0);
        patients.push(await Appointment.countDocuments({ status: 'Completed', requestedDate: { $gte: sStart, $lte: sEnd } }));
        registrations.push(await Appointment.countDocuments({ createdAt: { $gte: sStart, $lte: sEnd } }));
        cancellations.push(await Appointment.countDocuments({ status: 'Canceled', updatedAt: { $gte: sStart, $lte: sEnd } }));
      }
      return { revenue, patients, registrations, cancellations };
    };

    const labels = month === 0
      ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      : ['Week 1','Week 2','Week 3','Week 4'];

    const [currentData, compareData] = await Promise.all([
      getSliceData(year, month),
      getSliceData(compareYear, month)
    ]);

    const totals = {
      current: { revenue: sumArr(currentData.revenue), patients: sumArr(currentData.patients), registrations: sumArr(currentData.registrations), cancellations: sumArr(currentData.cancellations) },
      compare: { revenue: sumArr(compareData.revenue), patients: sumArr(compareData.patients), registrations: sumArr(compareData.registrations), cancellations: sumArr(compareData.cancellations) }
    };

    const { success: ok } = require('../../utils/response');
    return ok(res, {
      labels,
      period: { year, month, compareYear, granularity: month === 0 ? 'monthly' : 'weekly' },
      current: currentData,
      compare: compareData,
      totals
    }, 'Report data loaded');
  } catch (err) {
    console.error('getReportData error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading report data', 500, err.message);
  }
};

const queryClinicAI = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'An AI query is required' });
    }

    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');
    const User = require('../../models/User');
    const Post = require('../../models/Post');

    // 1. Fetch clinic figures to construct the system prompt context
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usersCount = await User.countDocuments({});
    const doctorsCount = await User.countDocuments({ role: 'doctor', isActive: true });
    const staffCount = await User.countDocuments({ role: { $in: ['staff', 'accountant'] }, isActive: true });
    const inactiveCount = await User.countDocuments({ isActive: false });

    const postsCount = await Post.countDocuments({});
    const publishedPostsCount = await Post.countDocuments({ status: 'Published' });
    const draftPostsCount = await Post.countDocuments({ status: 'Draft' });

    // Revenue month
    const match = await Invoice.aggregate([
      { $match: { status: 'Paid', paidAt: { $gte: startOfMonth } } },
      { $group: { _id: '$invoiceType', total: { $sum: '$totalAmount' } } }
    ]);
    let revenueMonth = 0;
    let consultationRev = 0;
    let pharmacyRev = 0;
    match.forEach(item => {
      revenueMonth += item.total;
      if (item._id === 'Consultation') consultationRev = item.total;
      if (item._id === 'Pharmacy') pharmacyRev = item.total;
    });

    // Peak hours
    const timeSlots = await Appointment.aggregate([
      { $match: { status: { $ne: 'Canceled' } } },
      { $group: { _id: '$requestedTime', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const peakTime = timeSlots.length > 0 ? timeSlots[0]._id : 'Undetermined';
    const peakCount = timeSlots.length > 0 ? timeSlots[0].count : 0;

    // CSKH stats
    const confirmedAppts = await Appointment.find({
      status: { $in: ['Confirmed', 'Completed'] },
      confirmedBy: { $exists: true }
    }).select('createdAt updatedAt');
    
    let totalMinutes = 0;
    let confirmedCount = 0;
    confirmedAppts.forEach(appt => {
      const diffMs = appt.updatedAt - appt.createdAt;
      if (diffMs > 0) {
        totalMinutes += diffMs / 1000 / 60;
        confirmedCount++;
      }
    });
    const avgConfirmationTime = confirmedCount > 0 ? Math.round(totalMinutes / confirmedCount) : 15;

    const successCount = await Appointment.countDocuments({ status: { $in: ['Confirmed', 'Completed'] } });
    const canceledCount = await Appointment.countDocuments({ status: 'Canceled' });
    const pendingCount = await Appointment.countDocuments({ status: 'Pending' });
    const totalAppts = successCount + canceledCount + pendingCount;
    const successRate = totalAppts > 0 ? Math.round((successCount / totalAppts) * 100) : 100;
    const cancellationRate = totalAppts > 0 ? Math.round((canceledCount / totalAppts) * 100) : 0;

    // 2. Load API Key
    const env = require('../../config/env');
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      const fallbackReport = `### 📊 AI Clinic Analytics (Dev Fallback Mode)

> [!NOTE]
> Bạn chưa cấu hình \`GEMINI_API_KEY\` trong tệp \`.env\`. Dưới đây là báo cáo thống kê nhanh được hệ thống tự động tổng hợp:
> *Vui lòng cấu hình khóa Gemini để nhận phân tích chuyên sâu từ AI.*

- **Tổng tài khoản:** ${usersCount} (Bác sĩ: ${doctorsCount}, Nhân viên: ${staffCount})
- **Tài khoản bị khoá:** ${inactiveCount}
- **Tin tức y tế (CMS):** ${postsCount} bài viết (Đăng: ${publishedPostsCount}, Nháp: ${draftPostsCount})
- **Doanh thu tháng này:** ${revenueMonth.toLocaleString('vi-VN')} VND
  - *Doanh thu khám:* ${consultationRev.toLocaleString('vi-VN')} VND
  - *Doanh thu bán thuốc:* ${pharmacyRev.toLocaleString('vi-VN')} VND
- **Giờ cao điểm:** ${peakTime} (${peakCount} lượt đặt lịch)
- **Thời gian xác nhận trung bình:** ${avgConfirmationTime} phút
- **Tỷ lệ đặt lịch thành công:** ${successRate}% (Hủy: ${cancellationRate}%)`;
      
      const { success: ok } = require('../../utils/response');
      return ok(res, { text: fallbackReport }, 'AI system analysis completed in simulation mode');
    }

    // 3. Construct System Prompt
    const systemPrompt = `You are the AI Analysis Assistant integrated into the Hopsontai Clinic management system.
Below are the clinic's current statistics for you to analyze:
- Total user accounts: ${usersCount}
- Active doctors: ${doctorsCount}
- Active care & accounting staff: ${staffCount}
- Locked (deactivated) accounts: ${inactiveCount}
- Total medical articles (CMS): ${postsCount} (Published: ${publishedPostsCount}, Drafts: ${draftPostsCount})
- Total revenue this month: ${revenueMonth} VND (Consultation fees: ${consultationRev} VND, Pharmacy revenue: ${pharmacyRev} VND)
- Busiest examination hours: ${peakTime} (${peakCount} bookings)
- Average care-team approval time: ${avgConfirmationTime} min (Success rate: ${successRate}%, Cancellation rate: ${cancellationRate}%)

Respond to the administrator's request or question in English, professionally and accurately based on the data above, concise and with specific, actionable optimization recommendations.
Format the entire answer in Markdown (use ### for section headings, ** for bold, and - or numbered lists). Do not use HTML or script tags.

The administrator's analysis request: "${query}"`;

    // 4. Call Gemini API
    const https = require('https');
    
    const callGemini = (prompt, key) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        });

        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) {
                return reject(new Error(`Gemini API returned status code ${res.statusCode}: ${body}`));
              }
              const json = JSON.parse(body);
              if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) {
                resolve(json.candidates[0].content.parts[0].text);
              } else {
                reject(new Error(json.error?.message || 'Could not parse the response from the Gemini API'));
              }
            } catch (e) {
              reject(e);
            }
          });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
      });
    };

    const aiResponseText = await callGemini(systemPrompt, apiKey);
    
    const { success: ok } = require('../../utils/response');
    return ok(res, { text: aiResponseText }, 'AI system analysis completed successfully');
  } catch (err) {
    console.error('queryClinicAI error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error calling the AI analysis assistant', 500, err.message);
  }
};

const bcrypt = require('bcryptjs');

const editUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, phone, isActive, fullName, departmentId, specialization, experienceYears, baseFee, bio, position } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' });

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(409).json({ success: false, message: 'Username already exists' });
      user.username = username;
    }

    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;

    if (roleName === 'doctor') {
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        doctor = new Doctor({ userId: user._id });
      }
      if (fullName !== undefined) doctor.fullName = fullName;
      if (specialization !== undefined) doctor.specialization = specialization;
      if (departmentId !== undefined) doctor.departmentId = departmentId;
      if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears) || 0;
      if (baseFee !== undefined) doctor.baseFee = Number(baseFee) || 150000;
      if (bio !== undefined) doctor.bio = bio;
      await doctor.save();
    } else if (roleName === 'staff' || roleName === 'accountant') {
      let staff = await Staff.findOne({ userId: user._id });
      if (!staff) {
        staff = new Staff({ userId: user._id, fullName: fullName || 'Staff' });
      }
      if (fullName !== undefined) staff.fullName = fullName;
      if (phone !== undefined) staff.phoneNumber = phone;
      if (position !== undefined) staff.position = position;
      await staff.save();
    } else if (roleName === 'patient') {
      let patient = await Patient.findOne({ userId: user._id });
      if (!patient) {
        patient = new Patient({ userId: user._id, fullName: fullName || 'Patient' });
      }
      if (fullName !== undefined) patient.fullName = fullName;
      if (phone !== undefined) patient.phoneNumber = phone;
      await patient.save();
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, user, 'Account updated successfully');
  } catch (err) {
    console.error('editUserAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the account', 500, err.message);
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' });

    const role = await Role.findById(user.roleId);
    const roleName = role ? role.roleName : null;

    if (roleName === 'doctor') {
      await Doctor.deleteOne({ userId: user._id });
    } else if (roleName === 'staff' || roleName === 'accountant') {
      await Staff.deleteOne({ userId: user._id });
    } else if (roleName === 'patient') {
      await Patient.deleteOne({ userId: user._id });
    }

    await User.deleteOne({ _id: user._id });

    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Account deleted successfully');
  } catch (err) {
    console.error('deleteUserAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the account', 500, err.message);
  }
};

const deleteAppointmentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');
    const Invoice_Detail = require('../../models/Invoice_Detail');
    const Medical_Record = require('../../models/Medical_Record');
    const Prescription = require('../../models/Prescription');

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const invoices = await Invoice.find({ appointmentId: appt._id });
    for (const inv of invoices) {
      await Invoice_Detail.deleteMany({ invoiceId: inv._id });
    }
    await Invoice.deleteMany({ appointmentId: appt._id });

    const medRecords = await Medical_Record.find({ appointmentId: appt._id });
    for (const rec of medRecords) {
      await Prescription.deleteMany({ recordId: rec._id });
    }
    await Medical_Record.deleteMany({ appointmentId: appt._id });

    await Appointment.deleteOne({ _id: appt._id });

    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Appointment and related data deleted successfully');
  } catch (err) {
    console.error('deleteAppointmentAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the appointment', 500, err.message);
  }
};

const updateTimelineStepAdmin = async (req, res) => {
  try {
    const { appointmentId, stepIndex, action, status } = req.body;
    if (!appointmentId || typeof stepIndex !== 'number') {
      return res.status(400).json({ success: false, message: 'appointmentId and stepIndex are required' });
    }

    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');
    const Medical_Record = require('../../models/Medical_Record');
    const Prescription = require('../../models/Prescription');

    const appt = await Appointment.findById(appointmentId);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    if (stepIndex === 2) {
      if (action === 'update') {
        appt.status = status;
        if (status === 'Confirmed') {
          appt.confirmedBy = req.user.id;
          const existingInv = await Invoice.findOne({ appointmentId: appt._id, invoiceType: 'Consultation' });
          if (!existingInv) {
            let fee = 150000;
            if (appt.doctorId) {
              const doc = await Doctor.findOne({ userId: appt.doctorId }) || await Doctor.findById(appt.doctorId);
              if (doc && typeof doc.baseFee === 'number') fee = doc.baseFee;
            }
            await Invoice.create({
              appointmentId: appt._id,
              patientId: appt.patientId,
              invoiceType: 'Consultation',
              totalAmount: fee,
              status: 'Unpaid',
              issuedAt: new Date()
            });
          }
        } else {
          appt.confirmedBy = undefined;
        }
      } else if (action === 'delete') {
        appt.status = 'Pending';
        appt.confirmedBy = undefined;
      }
      await appt.save();
    }
    else if (stepIndex === 3) {
      let inv = await Invoice.findOne({ appointmentId: appt._id, invoiceType: 'Consultation' });
      if (action === 'update') {
        if (!inv) {
          let fee = 150000;
          if (appt.doctorId) {
            const doc = await Doctor.findById(appt.doctorId);
            if (doc && typeof doc.baseFee === 'number') fee = doc.baseFee;
          }
          inv = await Invoice.create({
            appointmentId: appt._id,
            patientId: appt.patientId,
            invoiceType: 'Consultation',
            totalAmount: fee,
            status: 'Unpaid',
            issuedAt: new Date()
          });
        }
        inv.status = status;
        if (status === 'Paid') {
          inv.paidAt = new Date();
          const staff = await Staff.findOne({ userId: req.user.id });
          if (staff) inv.processedBy = staff._id;
        } else {
          inv.paidAt = undefined;
          inv.processedBy = undefined;
        }
        await inv.save();
      } else if (action === 'delete') {
        if (inv) {
          await Invoice.deleteOne({ _id: inv._id });
        }
      }
    }
    else if (stepIndex === 4) {
      if (action === 'update') {
        if (status === 'Completed') {
          appt.status = 'Completed';
          await appt.save();
          let rec = await Medical_Record.findOne({ appointmentId: appt._id });
          if (!rec) {
            let doc = await Doctor.findOne({ userId: req.user.id });
            if (!doc) doc = await Doctor.findById(appt.doctorId);
            await Medical_Record.create({
              appointmentId: appt._id,
              patientId: appt.patientId,
              doctorId: doc ? doc._id : undefined,
              diagnosis: 'Clinical examination (admin override)',
              clinicalNotes: 'Updated by admin via the workflow'
            });
          }
        } else {
          appt.status = 'Confirmed';
          await appt.save();
          const rec = await Medical_Record.findOne({ appointmentId: appt._id });
          if (rec) {
            await Prescription.deleteMany({ recordId: rec._id });
            await Medical_Record.deleteOne({ _id: rec._id });
          }
        }
      } else if (action === 'delete') {
        appt.status = 'Confirmed';
        await appt.save();
        const rec = await Medical_Record.findOne({ appointmentId: appt._id });
        if (rec) {
          await Prescription.deleteMany({ recordId: rec._id });
          await Medical_Record.deleteOne({ _id: rec._id });
        }
      }
    }
    else if (stepIndex === 5) {
      let inv = await Invoice.findOne({ appointmentId: appt._id, invoiceType: 'Pharmacy' });
      if (action === 'update') {
        if (!inv) {
          inv = await Invoice.create({
            appointmentId: appt._id,
            patientId: appt.patientId,
            invoiceType: 'Pharmacy',
            totalAmount: 100000,
            status: 'Unpaid',
            issuedAt: new Date()
          });
        }
        inv.status = status;
        if (status === 'Paid') {
          inv.paidAt = new Date();
          const staff = await Staff.findOne({ userId: req.user.id });
          if (staff) inv.processedBy = staff._id;
        } else {
          inv.paidAt = undefined;
          inv.processedBy = undefined;
        }
        await inv.save();
      } else if (action === 'delete') {
        if (inv) {
          const Invoice_Detail = require('../../models/Invoice_Detail');
          await Invoice_Detail.deleteMany({ invoiceId: inv._id });
          await Invoice.deleteOne({ _id: inv._id });
        }
      }
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Workflow step updated successfully');
  } catch (err) {
    console.error('updateTimelineStepAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the workflow step', 500, err.message);
  }
};

// ── Patient self-service (GET / POST / PUT /profiles/patient/me) ──────────────

const getMyPatientProfile = async (req, res) => {
  try {
    const { success: ok } = require('../../utils/response');
    const patient = await Patient.findOne({ userId: req.user.id }).lean();
    return ok(res, patient || null, patient ? 'Profile loaded' : 'No profile yet');
  } catch (err) {
    console.error('getMyPatientProfile error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading patient profile', 500, err.message);
  }
};

const createMyPatientProfile = async (req, res) => {
  try {
    const { success: ok } = require('../../utils/response');
    const { fail } = require('../../utils/response');
    const existing = await Patient.findOne({ userId: req.user.id });
    if (existing) return fail(res, 'Profile already exists — use PUT to update', 409);

    const { fullName, dateOfBirth, gender, phoneNumber, address, identityCard, insuranceCode, email, birthCertificate, personalId, birthCertificateImg, identityCardImg } = req.body;
    if (!fullName || !dateOfBirth || !gender || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'fullName, dateOfBirth, gender, and phoneNumber are required' });
    }

    const validationError = validatePatientAgeRequirements(dateOfBirth, req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const patient = await Patient.create({
      userId: req.user.id,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phoneNumber,
      identityCard: identityCard || undefined,
      birthCertificate: birthCertificate || undefined,
      personalId: personalId || undefined,
      address: address || '',
      insuranceCode: insuranceCode || undefined,
      email: email || undefined,
      birthCertificateImg: birthCertificateImg || undefined,
      identityCardImg: identityCardImg || undefined,
    });
    return ok(res, patient, 'Profile created successfully', 201);
  } catch (err) {
    console.error('createMyPatientProfile error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating patient profile', 500, err.message);
  }
};

const updateMyPatientProfile = async (req, res) => {
  try {
    const { success: ok } = require('../../utils/response');
    const { fail } = require('../../utils/response');
    let patient = await Patient.findOne({ userId: req.user.id });

    const { fullName, dateOfBirth, gender, phoneNumber, address, identityCard, insuranceCode, email, birthCertificate, personalId, birthCertificateImg, identityCardImg } = req.body;

    const targetDob = dateOfBirth ? new Date(dateOfBirth) : (patient ? patient.dateOfBirth : null);
    const validationError = validatePatientAgeRequirements(targetDob, req.body, patient || {});
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!patient) {
      if (!fullName || !dateOfBirth || !gender || !phoneNumber) {
        return res.status(400).json({ success: false, message: 'fullName, dateOfBirth, gender, and phoneNumber are required' });
      }
      patient = await Patient.create({
        userId: req.user.id,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phoneNumber,
        identityCard: identityCard || undefined,
        birthCertificate: birthCertificate || undefined,
        personalId: personalId || undefined,
        address: address || '',
        insuranceCode: insuranceCode || undefined,
        email: email || undefined,
        birthCertificateImg: birthCertificateImg || undefined,
        identityCardImg: identityCardImg || undefined,
      });
      return ok(res, patient, 'Profile created successfully', 201);
    }

    if (fullName !== undefined)       patient.fullName      = fullName;
    if (dateOfBirth !== undefined)    patient.dateOfBirth   = new Date(dateOfBirth);
    if (gender !== undefined)         patient.gender        = gender;
    if (phoneNumber !== undefined)    patient.phoneNumber   = phoneNumber;
    if (address !== undefined)        patient.address       = address;
    if (identityCard !== undefined)   patient.identityCard  = identityCard || undefined;
    if (birthCertificate !== undefined) patient.birthCertificate = birthCertificate || undefined;
    if (personalId !== undefined)     patient.personalId    = personalId || undefined;
    if (insuranceCode !== undefined)  patient.insuranceCode = insuranceCode || undefined;
    if (email !== undefined)          patient.email         = email || undefined;
    if (birthCertificateImg !== undefined) patient.birthCertificateImg = birthCertificateImg || undefined;
    if (identityCardImg !== undefined) patient.identityCardImg = identityCardImg || undefined;

    await patient.save();
    return ok(res, patient, 'Profile updated successfully');
  } catch (err) {
    console.error('updateMyPatientProfile error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating patient profile', 500, err.message);
  }
};

const getSubAccounts = async (req, res) => {
  try {
    const primaryPatient = await Patient.findOne({ userId: req.user.id });
    if (!primaryPatient) {
      return res.status(404).json({ success: false, message: 'Primary patient profile not found' });
    }
    const list = await Patient.find({ parentId: primaryPatient._id }).sort({ fullName: 1 }).lean();
    
    // Fallback: If sub-account phone/address are not set, default to primary patient's info
    const mappedList = list.map(sub => ({
      ...sub,
      phoneNumber: sub.phoneNumber || primaryPatient.phoneNumber || '',
      address: sub.address && sub.address.trim() ? sub.address.trim() : (primaryPatient.address || ''),
    }));

    const { success: ok } = require('../../utils/response');
    return ok(res, mappedList, 'Sub-accounts loaded successfully');
  } catch (err) {
    console.error('getSubAccounts error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading sub-accounts', 500, err.message);
  }
};

const createSubAccount = async (req, res) => {
  try {
    const primaryPatient = await Patient.findOne({ userId: req.user.id });
    if (!primaryPatient) {
      return res.status(404).json({ success: false, message: 'Primary patient profile not found' });
    }
    const { fullName, dateOfBirth, gender, phoneNumber, address, identityCard, insuranceCode, category, birthCertificate, personalId, birthCertificateImg, identityCardImg } = req.body;
    if (!fullName || !dateOfBirth || !gender) {
      return res.status(400).json({ success: false, message: 'fullName, dateOfBirth, and gender are required' });
    }

    const validationError = validatePatientAgeRequirements(dateOfBirth, req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const finalPhone = (phoneNumber && phoneNumber.trim() && phoneNumber.trim() !== primaryPatient.phoneNumber) ? phoneNumber.trim() : undefined;
    const finalAddress = (address && address.trim() && address.trim() !== primaryPatient.address) ? address.trim() : '';

    const sub = await Patient.create({
      parentId: primaryPatient._id,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      category: category || 'Adult',
      phoneNumber: finalPhone,
      identityCard: identityCard || undefined,
      birthCertificate: birthCertificate || undefined,
      personalId: personalId || undefined,
      address: finalAddress,
      insuranceCode: insuranceCode || undefined,
      birthCertificateImg: birthCertificateImg || undefined,
      identityCardImg: identityCardImg || undefined,
    });
    const { success: ok } = require('../../utils/response');
    return ok(res, sub, 'Sub-account created successfully', 201);
  } catch (err) {
    console.error('createSubAccount error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating sub-account', 500, err.message);
  }
};

const updateSubAccount = async (req, res) => {
  try {
    const primaryPatient = await Patient.findOne({ userId: req.user.id });
    if (!primaryPatient) {
      return res.status(404).json({ success: false, message: 'Primary patient profile not found' });
    }
    const { id } = req.params;
    const sub = await Patient.findOne({ _id: id, parentId: primaryPatient._id });
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Sub-account not found' });
    }
    const { fullName, dateOfBirth, gender, phoneNumber, address, identityCard, insuranceCode, category, birthCertificate, personalId, birthCertificateImg, identityCardImg } = req.body;

    const targetDob = dateOfBirth ? new Date(dateOfBirth) : sub.dateOfBirth;
    const validationError = validatePatientAgeRequirements(targetDob, req.body, sub);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (fullName !== undefined) sub.fullName = fullName;
    if (dateOfBirth !== undefined) sub.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) sub.gender = gender;
    if (category !== undefined) sub.category = category;
    if (phoneNumber !== undefined) {
      sub.phoneNumber = (phoneNumber && phoneNumber.trim() && phoneNumber.trim() !== primaryPatient.phoneNumber) ? phoneNumber.trim() : undefined;
    }
    if (address !== undefined) {
      sub.address = (address && address.trim() && address.trim() !== primaryPatient.address) ? address.trim() : '';
    }
    if (identityCard !== undefined) sub.identityCard = identityCard || undefined;
    if (birthCertificate !== undefined) sub.birthCertificate = birthCertificate || undefined;
    if (personalId !== undefined) sub.personalId = personalId || undefined;
    if (insuranceCode !== undefined) sub.insuranceCode = insuranceCode || undefined;
    if (birthCertificateImg !== undefined) sub.birthCertificateImg = birthCertificateImg || undefined;
    if (identityCardImg !== undefined) sub.identityCardImg = identityCardImg || undefined;
    await sub.save();
    const { success: ok } = require('../../utils/response');
    return ok(res, sub, 'Sub-account updated successfully');
  } catch (err) {
    console.error('updateSubAccount error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating sub-account', 500, err.message);
  }
};

const deleteSubAccount = async (req, res) => {
  try {
    const primaryPatient = await Patient.findOne({ userId: req.user.id });
    if (!primaryPatient) {
      return res.status(404).json({ success: false, message: 'Primary patient profile not found' });
    }
    const { id } = req.params;
    const sub = await Patient.findOneAndDelete({ _id: id, parentId: primaryPatient._id });
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Sub-account not found' });
    }
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Sub-account deleted successfully');
  } catch (err) {
    console.error('deleteSubAccount error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting sub-account', 500, err.message);
  }
};

const createPatientByStaff = async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, phoneNumber, identityCard, address, insuranceCode, email, birthCertificate, personalId, birthCertificateImg, identityCardImg } = req.body;
    if (!fullName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Full name and phone number are required' });
    }

    const { success: ok, fail } = require('../../utils/response');

    const patientRole = await Role.findOne({ roleName: 'patient' });
    if (!patientRole) return fail(res, 'Patient role not configured', 500);

    let user = await User.findOne({ $or: [{ username: phoneNumber }, { phone: phoneNumber }] });
    if (!user) {
      const tempPwd = Math.random().toString(36) + Date.now();
      user = await User.create({
        username: phoneNumber,
        passwordHash: await bcrypt.hash(tempPwd, 10),
        roleId: patientRole._id,
        phone: phoneNumber,
        email: email || undefined,
        isActive: true,
        isRegistered: false
      });
    }

    let patient = await Patient.findOne({ userId: user._id });
    const dob = dateOfBirth ? new Date(dateOfBirth) : (patient ? patient.dateOfBirth : new Date('1900-01-01'));
    const idCard = identityCard || (patient ? patient.identityCard : `REG-${Date.now()}-${phoneNumber}`);

    // Validate requirements
    const checkBody = { ...req.body, identityCard: idCard };
    const validationError = validatePatientAgeRequirements(dob, checkBody, patient || {});
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!patient) {
      patient = await Patient.create({
        userId: user._id,
        fullName,
        dateOfBirth: dob,
        gender: gender || 'Khác',
        identityCard: idCard,
        birthCertificate: birthCertificate || undefined,
        personalId: personalId || undefined,
        phoneNumber,
        address: address || '',
        insuranceCode: insuranceCode || undefined,
        email: email || undefined,
        birthCertificateImg: birthCertificateImg || undefined,
        identityCardImg: identityCardImg || undefined,
      });
    } else {
      if (fullName) patient.fullName = fullName;
      if (dateOfBirth) patient.dateOfBirth = dob;
      if (gender) patient.gender = gender;
      if (identityCard) patient.identityCard = idCard;
      if (birthCertificate !== undefined) patient.birthCertificate = birthCertificate || undefined;
      if (personalId !== undefined) patient.personalId = personalId || undefined;
      if (address !== undefined) patient.address = address;
      if (insuranceCode !== undefined) patient.insuranceCode = insuranceCode || undefined;
      if (email !== undefined) patient.email = email || undefined;
      if (birthCertificateImg !== undefined) patient.birthCertificateImg = birthCertificateImg || undefined;
      if (identityCardImg !== undefined) patient.identityCardImg = identityCardImg || undefined;
      await patient.save();
    }

    return ok(res, patient, 'Patient registered/loaded successfully', 201);
  } catch (err) {
    console.error('createPatientByStaff error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error registering patient', 500, err.message);
  }
};

const Notification = require('../../models/Notification');

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Notifications loaded successfully');
  } catch (err) {
    console.error('getMyNotifications error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading notifications', 500, err.message);
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const inq = await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
    const { success: ok } = require('../../utils/response');
    return ok(res, inq, 'Notification marked as read');
  } catch (err) {
    console.error('markNotificationRead error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating notification status', 500, err.message);
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'All notifications marked as read');
  } catch (err) {
    console.error('markAllNotificationsRead error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating notification statuses', 500, err.message);
  }
};

// Generate HTML blog post content via Gemini AI
const generatePostContent = async (req, res) => {
  const { success: ok, fail } = require('../../utils/response');
  try {
    const { title, topic, language = 'en' } = req.body;
    const subject = (title || topic || '').trim();
    if (!subject) return fail(res, 'Please provide a title or topic for the article.', 400);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) return fail(res, 'Gemini API key is not configured.', 503);

    const isVi = language === 'vi';
    const prompt = `You are a professional medical content writer for Hopsontai Clinic (Ho Chi Minh City, Vietnam).

Write a complete, well-structured health article about: "${subject}"

STRICT OUTPUT RULES:
- Output ONLY valid HTML fragment (no <!DOCTYPE>, no <html>, no <head>, no <body> wrapper tags).
- Use semantic HTML only: <h2> for main section headings, <h3> for sub-headings, <p> for paragraphs, <ul><li> for bullet lists, <strong> for key terms, <em> for emphasis.
- Article length: 600–900 words.
- Language: ${isVi ? 'Vietnamese (Tiếng Việt)' : 'English'}.
- Structure must include:
  1. An engaging opening <p> that introduces the topic and its importance.
  2. <h2> section on causes or background (what causes it / how it works).
  3. <h2> section on symptoms or key signs to watch for.
  4. <h2> section with practical prevention or treatment tips (use <ul><li>).
  5. A short closing <p> encouraging readers to schedule an appointment at Hopsontai Clinic.
- End with: <p><em>${isVi ? 'Nguồn: Đội ngũ Y tế Phòng khám Hopsontai' : 'Source: Hopsontai Clinic Medical Team'}</em></p>
- DO NOT include markdown, code fences (\`\`\`), or any text outside the HTML tags.`;

    const https = require('https');
    const callGemini = (promptText, key) => new Promise((resolve, reject) => {
      const payload = JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] });
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      };
      const req = https.request(options, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          try {
            if (response.statusCode !== 200) return reject(new Error(`Gemini HTTP ${response.statusCode}: ${body}`));
            const json = JSON.parse(body);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) resolve(text);
            else reject(new Error(json.error?.message || 'Cannot parse Gemini response'));
          } catch (e) { reject(e); }
        });
      });
      req.on('error', (e) => reject(e));
      req.write(payload);
      req.end();
    });

    let html = await callGemini(prompt, apiKey);
    // Strip markdown code fences if Gemini wrapped the output
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return ok(res, { html }, 'Content generated successfully');
  } catch (err) {
    console.error('generatePostContent error', err);
    const { fail: f } = require('../../utils/response');
    return f(res, 'Error generating content with AI', 500, err.message);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, createDoctor, getPatients, getAdminStats, getReportData, queryClinicAI, generatePostContent, editUserAdmin, deleteUserAdmin, deleteAppointmentAdmin, updateTimelineStepAdmin, getMyPatientProfile, createMyPatientProfile, updateMyPatientProfile, getSubAccounts, createSubAccount, updateSubAccount, deleteSubAccount, createPatientByStaff, getMyNotifications, markNotificationRead, markAllNotificationsRead };


