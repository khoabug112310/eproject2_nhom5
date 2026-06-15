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

    // === CALCULATE TIME SERIES DATA FOR CHARTS ===
    // 1. WEEK CHART (Monday to Sunday of the current week)
    const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
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
    const monthLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
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
    const yearLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
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
      time: slot._id || 'Chưa xếp giờ',
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
      }
    }, 'Lấy số liệu thống kê thành công');
  } catch (err) {
    console.error('getAdminStats error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy số liệu thống kê', 500, err.message);
  }
};

const queryClinicAI = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Yêu cầu truy vấn AI (query) là bắt buộc' });
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
    const peakTime = timeSlots.length > 0 ? timeSlots[0]._id : 'Chưa xác định';
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

    // 3. Construct System Prompt
    const systemPrompt = `Bạn là Trợ lý Phân tích AI được tích hợp trong hệ thống quản lý phòng khám Hợp Sơn Tài.
Dưới đây là số liệu thống kê hiện tại của phòng khám để bạn phân tích:
- Tổng số tài khoản người dùng: ${usersCount}
- Số bác sĩ đang hoạt động: ${doctorsCount}
- Số nhân viên CSKH & Kế toán đang hoạt động: ${staffCount}
- Số tài khoản đang bị khóa (vô hiệu hóa): ${inactiveCount}
- Tổng số bài viết y khoa (CMS): ${postsCount} (Đã công bố: ${publishedPostsCount}, Bản nháp: ${draftPostsCount})
- Tổng doanh thu tháng này: ${revenueMonth} VND (Phí khám lâm sàng: ${consultationRev} VND, Doanh thu nhà thuốc: ${pharmacyRev} VND)
- Khung giờ khám cao điểm nhất: ${peakTime} (${peakCount} lượt đặt lịch)
- Tốc độ duyệt lịch trung bình của CSKH: ${avgConfirmationTime} phút (Tỷ lệ duyệt thành công: ${successRate}%, Tỷ lệ hủy: ${cancellationRate}%)

Hãy trả lời yêu cầu hoặc câu hỏi của Quản trị viên bằng tiếng Việt một cách chuyên nghiệp, chính xác theo số liệu trên, ngắn gọn và có đề xuất tối ưu hóa hành động cụ thể.
Định dạng câu trả lời hoàn toàn bằng Markdown (sử dụng dấu ### cho tiêu đề phần, dấu ** cho chữ in đậm, dấu gạch đầu dòng - hoặc số thứ tự cho danh sách). Không sử dụng các định dạng HTML hay thẻ script.

Yêu cầu phân tích của Quản trị viên: "${query}"`;

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
                reject(new Error(json.error?.message || 'Không thể giải nghĩa phản hồi từ Gemini API'));
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
    return ok(res, { text: aiResponseText }, 'Phân tích hệ thống bằng AI thành công');
  } catch (err) {
    console.error('queryClinicAI error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi gọi trợ lý AI phân tích', 500, err.message);
  }
};

const bcrypt = require('bcryptjs');

const editUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, email, phone, isActive, fullName, departmentId, specialization, experienceYears, baseFee, bio, position } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
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
        staff = new Staff({ userId: user._id, fullName: fullName || 'Nhân sự' });
      }
      if (fullName !== undefined) staff.fullName = fullName;
      if (phone !== undefined) staff.phoneNumber = phone;
      if (position !== undefined) staff.position = position;
      await staff.save();
    } else if (roleName === 'patient') {
      let patient = await Patient.findOne({ userId: user._id });
      if (!patient) {
        patient = new Patient({ userId: user._id, fullName: fullName || 'Bệnh nhân' });
      }
      if (fullName !== undefined) patient.fullName = fullName;
      if (phone !== undefined) patient.phoneNumber = phone;
      await patient.save();
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, user, 'Cập nhật tài khoản thành công');
  } catch (err) {
    console.error('editUserAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật tài khoản', 500, err.message);
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });

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
    return ok(res, null, 'Xóa tài khoản thành công');
  } catch (err) {
    console.error('deleteUserAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi xóa tài khoản', 500, err.message);
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
    if (!appt) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });

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
    return ok(res, null, 'Xóa lịch hẹn và các dữ liệu liên quan thành công');
  } catch (err) {
    console.error('deleteAppointmentAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi xóa lịch hẹn', 500, err.message);
  }
};

const updateTimelineStepAdmin = async (req, res) => {
  try {
    const { appointmentId, stepIndex, action, status } = req.body;
    if (!appointmentId || typeof stepIndex !== 'number') {
      return res.status(400).json({ success: false, message: 'appointmentId và stepIndex là bắt buộc' });
    }

    const Appointment = require('../../models/Appointment');
    const Invoice = require('../../models/Invoice');
    const Medical_Record = require('../../models/Medical_Record');
    const Prescription = require('../../models/Prescription');

    const appt = await Appointment.findById(appointmentId);
    if (!appt) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });

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
              diagnosis: 'Khám lâm sàng (Admin chốt)',
              clinicalNotes: 'Do Admin cập nhật trạng thái quy trình'
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
    return ok(res, null, 'Cập nhật bước quy trình thành công');
  } catch (err) {
    console.error('updateTimelineStepAdmin error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật bước quy trình', 500, err.message);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, createDoctor, getPatients, getAdminStats, queryClinicAI, editUserAdmin, deleteUserAdmin, deleteAppointmentAdmin, updateTimelineStepAdmin };

