// Module Scheduling - Controller
// Xử lý: Departments, Schedules, Appointments

const Department = require('../../models/Department');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Staff = require('../../models/Staff');
const User = require('../../models/User');
const { APPOINTMENT_STATUS } = require('../../constants/enums');

const getDepartments = async (req, res) => {
  try {
    // Aggregate doctor counts per department for frontend display
    const items = await Department.aggregate([
      { $sort: { departmentName: 1 } },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: 'departmentId',
          as: 'doctors',
        },
      },
      {
        $addFields: {
          doctorCount: { $size: '$doctors' },
        },
      },
      {
        $project: { doctors: 0 },
      },
    ]);

    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách khoa thành công');
  } catch (err) {
    console.error('getDepartments error', err);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách khoa' });
  }
};

const Doctor_Schedule = require('../../models/Doctor_Schedule');

const getSchedules = async (req, res) => {
  try {
    const { doctor, date } = req.query;
    const q = {};
    if (doctor) q.doctorId = doctor;
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      q.workDate = d;
    }
    const items = await Doctor_Schedule.find(q).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy lịch làm việc thành công');
  } catch (err) {
    console.error('getSchedules error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy lịch làm việc', 500, err.message);
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { requestedDate, requestedTime, departmentId, doctorId, symptoms } = req.body;

    if (!requestedDate || !requestedTime || !departmentId) {
      return res.status(400).json({ success: false, message: 'requestedDate, requestedTime và departmentId là bắt buộc' });
    }

    // Determine patientId from authenticated user (User ID mapped to Patient ID)
    let patientId = req.body.patientId;
    if (req.user && (req.user.id || req.user._id)) {
      const uId = req.user.id || req.user._id;
      const patient = await Patient.findOne({ userId: uId });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Hồ sơ bệnh nhân không tồn tại.' });
      }
      patientId = patient._id;
    }
    if (!patientId) return res.status(400).json({ success: false, message: 'Patient identity required' });

    // Check if patient already has a pending appointment
    const pendingAppointment = await Appointment.findOne({
      patientId,
      status: APPOINTMENT_STATUS.PENDING
    });

    if (pendingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có một lịch hẹn đang chờ xác nhận. Không thể đăng ký thêm lịch mới.'
      });
    }

    // Normalize date (strip time) for day-based matching
    const dateOnly = new Date(requestedDate);
    dateOnly.setHours(0, 0, 0, 0);

    // Basic conflict check: doctor already has appointment at same date+time
    if (doctorId) {
      const exists = await Appointment.findOne({
        doctorId,
        requestedDate: dateOnly,
        requestedTime,
        status: { $ne: APPOINTMENT_STATUS.CANCELLED },
      });

      if (exists) {
        return res.status(409).json({ success: false, message: 'Thời gian đã được đặt trước. Vui lòng chọn khung giờ khác.' });
      }
    }

    const appt = await Appointment.create({
      patientId,
      requestedDate: dateOnly,
      requestedTime,
      symptoms,
      departmentId,
      doctorId,
      status: APPOINTMENT_STATUS.PENDING,
    });

    const { success: ok } = require('../../utils/response');
    return ok(res, appt, 'Đặt lịch thành công', 201);
  } catch (err) {
    console.error('bookAppointment error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi server khi đặt lịch', 500, err.message);
  }
};

const getAppointments = async (req, res) => {
  try {
    let q = {};
    if (req.user) {
      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient) {
          const { success: ok } = require('../../utils/response');
          return ok(res, [], 'Lấy danh sách lịch khám');
        }
        q.patientId = patient._id;
      } else if (req.user.role === 'doctor') {
        const doc = await Doctor.findOne({ userId: req.user.id });
        if (!doc) {
          const { success: ok } = require('../../utils/response');
          return ok(res, [], 'Lấy danh sách lịch khám');
        }
        q.doctorId = doc._id;
      }
    }

    const items = await Appointment.find(q)
      .populate('patientId doctorId departmentId scheduleId confirmedBy')
      .sort({ requestedDate: -1, requestedTime: -1 })
      .lean();

    const mappedItems = [];
    for (const appt of items) {
      if (appt.confirmedBy) {
        const userId = appt.confirmedBy._id;
        const staff = await Staff.findOne({ userId }).lean();
        let fullName = staff ? staff.fullName : appt.confirmedBy.username;
        if (!staff) {
          const doc = await Doctor.findOne({ userId }).lean();
          if (doc) fullName = doc.fullName;
        }
        appt.confirmedBy = {
          _id: userId,
          username: appt.confirmedBy.username,
          fullName: fullName
        };
      }
      mappedItems.push(appt);
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, mappedItems, 'Lấy danh sách lịch khám');
  } catch (err) {
    console.error('getAppointments error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy lịch khám', 500, err.message);
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const oldStatus = appt.status;
    const { APPOINTMENT_STATUS, INVOICE_TYPE, INVOICE_STATUS } = require('../../constants/enums');

    // If confirming, ensure schedule capacity
    if (oldStatus !== APPOINTMENT_STATUS.CONFIRMED && status === APPOINTMENT_STATUS.CONFIRMED) {
      // try to find schedule
      let schedule = null;
      if (appt.scheduleId) schedule = await Doctor_Schedule.findById(appt.scheduleId);
      if (!schedule) {
        schedule = await Doctor_Schedule.findOne({ doctorId: appt.doctorId, workDate: appt.requestedDate });
      }
      if (schedule) {
        if (typeof schedule.currentBooked !== 'number') schedule.currentBooked = 0;
        if (schedule.maxPatients && schedule.currentBooked >= schedule.maxPatients) {
          return res.status(409).json({ success: false, message: 'Lịch đã kín, không thể xác nhận' });
        }
        schedule.currentBooked = (schedule.currentBooked || 0) + 1;
        await schedule.save();
      }

      // Auto-create Consultation Invoice (Unpaid) if it doesn't exist
      const Invoice = require('../../models/Invoice');
      const existingConsultationInvoice = await Invoice.findOne({
        appointmentId: appt._id,
        invoiceType: INVOICE_TYPE.CONSULTATION,
      });

      if (!existingConsultationInvoice) {
        let fee = 150000; // default fee
        if (appt.doctorId) {
          const doc = await Doctor.findById(appt.doctorId);
          if (doc && typeof doc.baseFee === 'number') {
            fee = doc.baseFee;
          }
        }
        await Invoice.create({
          appointmentId: appt._id,
          patientId: appt.patientId,
          invoiceType: INVOICE_TYPE.CONSULTATION,
          totalAmount: fee,
          status: INVOICE_STATUS.UNPAID,
          issuedAt: new Date(),
        });
      }
    }

    // If cancelling after confirmed, decrement currentBooked
    if (oldStatus === APPOINTMENT_STATUS.CONFIRMED && status === APPOINTMENT_STATUS.CANCELED) {
      let schedule = null;
      if (appt.scheduleId) schedule = await Doctor_Schedule.findById(appt.scheduleId);
      if (!schedule) {
        schedule = await Doctor_Schedule.findOne({ doctorId: appt.doctorId, workDate: appt.requestedDate });
      }
      if (schedule && typeof schedule.currentBooked === 'number' && schedule.currentBooked > 0) {
        schedule.currentBooked = Math.max(0, schedule.currentBooked - 1);
        await schedule.save();
      }
    }

    appt.status = status;
    if (req.user && (req.user.id || req.user._id)) appt.confirmedBy = req.user.id || req.user._id;
    await appt.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, appt, 'Cập nhật trạng thái lịch khám thành công');
  } catch (err) {
    console.error('updateAppointmentStatus error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi cập nhật trạng thái', 500, err.message);
  }
};

module.exports = { getDepartments, getSchedules, bookAppointment, getAppointments, updateAppointmentStatus };
