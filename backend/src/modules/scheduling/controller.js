// Module Scheduling - Controller
// Handles: Departments, Schedules, Appointments

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
    return ok(res, items, 'Department list loaded successfully');
  } catch (err) {
    console.error('getDepartments error', err);
    return res.status(500).json({ message: 'Error loading the department list' });
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
    return ok(res, items, 'Schedule loaded successfully');
  } catch (err) {
    console.error('getSchedules error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the schedule', 500, err.message);
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { requestedDate, requestedTime, departmentId, doctorId, symptoms } = req.body;

    if (!requestedDate || !requestedTime || !departmentId) {
      return res.status(400).json({ success: false, message: 'requestedDate, requestedTime, and departmentId are required' });
    }

    // Determine patientId from authenticated user (User ID mapped to Patient ID)
    let patientId = req.body.patientId;
    if (req.user && (req.user.id || req.user._id)) {
      const uId = req.user.id || req.user._id;
      const patient = await Patient.findOne({ userId: uId });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient record not found.' });
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
        message: 'You already have an appointment awaiting confirmation. You cannot book another one.'
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
        return res.status(409).json({ success: false, message: 'This time slot is already booked. Please choose another one.' });
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
    return ok(res, appt, 'Appointment booked successfully', 201);
  } catch (err) {
    console.error('bookAppointment error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Server error while booking the appointment', 500, err.message);
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
          return ok(res, [], 'Appointment list loaded');
        }
        q.patientId = patient._id;
      } else if (req.user.role === 'doctor') {
        const doc = await Doctor.findOne({ userId: req.user.id });
        if (!doc) {
          const { success: ok } = require('../../utils/response');
          return ok(res, [], 'Appointment list loaded');
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
    return ok(res, mappedItems, 'Appointment list loaded');
  } catch (err) {
    console.error('getAppointments error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading appointments', 500, err.message);
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

    // Detect whether doctor is being changed in this update
    const newDoctorId = req.body.doctorId || appt.doctorId;
    if (req.body.doctorId) {
      appt.doctorId = req.body.doctorId;
    }

    const timeToMinutes = (time) => {
      if (!time) return null;
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const isWithinSchedule = (time, startTime, endTime) => {
      const minutes = timeToMinutes(time);
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);
      return minutes !== null && start !== null && end !== null && minutes >= start && minutes <= end;
    };

    // If confirming, ensure schedule capacity
    if (oldStatus !== APPOINTMENT_STATUS.CONFIRMED && status === APPOINTMENT_STATUS.CONFIRMED) {
      const dateOnly = new Date(appt.requestedDate);
      dateOnly.setHours(0, 0, 0, 0);

      // try to find schedule for the target doctor
      let schedule = null;
      if (appt.scheduleId) {
        const existingSchedule = await Doctor_Schedule.findById(appt.scheduleId);
        if (
          existingSchedule &&
          String(existingSchedule.doctorId) === String(newDoctorId) &&
          new Date(existingSchedule.workDate).toISOString().split('T')[0] === dateOnly.toISOString().split('T')[0]
        ) {
          schedule = existingSchedule;
        }
      }
      if (!schedule) {
        schedule = await Doctor_Schedule.findOne({ doctorId: newDoctorId, workDate: dateOnly });
      }

      if (schedule) {
        if (!isWithinSchedule(appt.requestedTime, schedule.startTime, schedule.endTime)) {
          return res.status(409).json({ success: false, message: 'The requested time is outside this work shift.' });
        }

        if (typeof schedule.currentBooked !== 'number') schedule.currentBooked = 0;
        if (schedule.maxPatients && schedule.currentBooked >= schedule.maxPatients) {
          return res.status(409).json({ success: false, message: 'This shift is full; no more appointments can be confirmed.' });
        }
        schedule.currentBooked = (schedule.currentBooked || 0) + 1;
        await schedule.save();
        appt.scheduleId = schedule._id;
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
    return ok(res, appt, 'Appointment status updated successfully');
  } catch (err) {
    console.error('updateAppointmentStatus error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the status', 500, err.message);
  }
};

const createDepartment = async (req, res) => {
  try {
    const { departmentName, description, contactPhone } = req.body;
    if (!departmentName) return res.status(400).json({ success: false, message: 'Department name is required' });
    const dept = await Department.create({ departmentName, description, contactPhone });
    const { success: ok } = require('../../utils/response');
    return ok(res, dept, 'Department added successfully', 201);
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error adding the department', 500, err.message);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    const { success: ok } = require('../../utils/response');
    return ok(res, dept, 'Department updated successfully');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the department', 500, err.message);
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Department deleted');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the department', 500, err.message);
  }
};

const createDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, workDate, startTime, endTime, maxPatients } = req.body;
    if (!doctorId || !workDate || !startTime || !endTime || !maxPatients) {
      return res.status(400).json({ success: false, message: 'Missing shift information' });
    }
    const dateOnly = new Date(workDate);
    dateOnly.setHours(0, 0, 0, 0);
    const existing = await Doctor_Schedule.findOne({ doctorId, workDate: dateOnly });
    if (existing) return res.status(409).json({ success: false, message: 'The doctor already has a shift on this day' });
    const schedule = await Doctor_Schedule.create({ doctorId, workDate: dateOnly, startTime, endTime, maxPatients: Number(maxPatients), currentBooked: 0, status: 'Available' });
    const populated = await Doctor_Schedule.findById(schedule._id).populate('doctorId').lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, populated, 'Shift created successfully', 201);
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating the shift', 500, err.message);
  }
};

const deleteDoctorSchedule = async (req, res) => {
  try {
    const schedule = await Doctor_Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Shift not found' });
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Shift deleted');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the shift', 500, err.message);
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const items = await Doctor_Schedule.find().populate('doctorId').sort({ workDate: 1 }).lean();
    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'All shifts loaded successfully');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the schedule', 500, err.message);
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, getSchedules, getAllSchedules, createDoctorSchedule, deleteDoctorSchedule, bookAppointment, getAppointments, updateAppointmentStatus };
