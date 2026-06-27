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

const isPublicHoliday = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 1 && day === 1) return true;
  if (month === 4 && day === 30) return true;
  if (month === 5 && day === 1) return true;
  if (month === 9 && (day === 2 || day === 3)) return true;
  return false;
};

const bookAppointment = async (req, res) => {
  try {
    const { requestedDate, requestedTime, departmentId, doctorId, symptoms } = req.body;

    if (!requestedDate || !requestedTime || !departmentId) {
      return res.status(400).json({ success: false, message: 'requestedDate, requestedTime, and departmentId are required' });
    }

    // Check if the date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(requestedDate);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly < today) {
      return res.status(400).json({ success: false, message: 'Cannot book appointments for past dates.' });
    }

    // Check if the date is a holiday
    if (isPublicHoliday(dateOnly)) {
      return res.status(400).json({ success: false, message: 'Appointments cannot be booked on public holidays.' });
    }

    // Determine patientId from authenticated user or body
    let patientId = req.body.patientId;
    if (req.user && req.user.role === 'patient') {
      const uId = req.user.id || req.user._id;
      const primaryPatient = await Patient.findOne({ userId: uId });
      if (!primaryPatient) {
        return res.status(404).json({ success: false, message: 'Patient record not found.' });
      }
      if (patientId) {
        // If booking for a sub-account, ensure it is linked to the primary patient
        const targetPatient = await Patient.findById(patientId);
        if (!targetPatient || (String(targetPatient.userId) !== String(uId) && String(targetPatient.parentId) !== String(primaryPatient._id))) {
          return res.status(403).json({ success: false, message: 'Unauthorized patient selection.' });
        }
      } else {
        patientId = primaryPatient._id;
      }
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

    // Anti-spam limits:
    // 1. Max 3 appointments for the same treatment date (requestedDate = dateOnly)
    const countSameDayDiag = await Appointment.countDocuments({
      patientId,
      requestedDate: dateOnly,
      status: { $ne: APPOINTMENT_STATUS.CANCELED }
    });
    if (countSameDayDiag >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book more than 3 appointments for the same treatment date.'
      });
    }

    // 2. Max 5 appointments registered on the same booking/creation day
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const countBookingsToday = await Appointment.countDocuments({
      patientId,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });
    if (countBookingsToday >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book more than 5 appointments within the same day.'
      });
    }

    // Basic conflict check: doctor already has appointment at same date+time
    if (doctorId) {
      const Doctor_Schedule = require('../../models/Doctor_Schedule');
      const shiftSchedule = await Doctor_Schedule.findOne({
        doctorId,
        workDate: dateOnly,
        startTime: requestedTime
      });

      if (shiftSchedule && shiftSchedule.status === 'Blocked') {
        return res.status(409).json({ success: false, message: 'This time slot has been blocked by the doctor. Please choose another one.' });
      }

      const exists = await Appointment.findOne({
        doctorId,
        requestedDate: dateOnly,
        requestedTime,
        status: { $ne: APPOINTMENT_STATUS.CANCELED },
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

    try {
      const { notifyPatient, notifyStaff } = require('../../utils/notificationHelper');
      const dateStr = dateOnly.toISOString().split('T')[0];
      const patientObj = await Patient.findById(patientId);
      const patientName = patientObj ? patientObj.fullName : 'Guest';

      await notifyPatient(
        patientId,
        'Appointment Request Pending',
        `Your booking request for ${dateStr} at ${requestedTime} is pending confirmation.`
      );

      await notifyStaff(
        'New Appointment Request',
        `Patient ${patientName} has requested an appointment on ${dateStr} at ${requestedTime}.`
      );
    } catch (notifErr) {
      console.error('Error sending booking notifications:', notifErr);
    }

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
        // Fetch appointments for primary patient and all dependents (sub-accounts)
        const dependents = await Patient.find({ parentId: patient._id });
        const patientIds = [patient._id, ...dependents.map(d => d._id)];
        q.patientId = { $in: patientIds };
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
      .populate({
        path: 'patientId',
        populate: { path: 'parentId' }
      })
      .populate('doctorId departmentId scheduleId confirmedBy')
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
    const { status, attendance, requestedDate, requestedTime, scheduleId, doctorId } = req.body;
    if (!status && !attendance && !requestedDate && !requestedTime && !scheduleId && !doctorId) {
      return res.status(400).json({ success: false, message: 'status, attendance, requestedDate, requestedTime, scheduleId or doctorId is required' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const oldStatus = appt.status;
    const oldScheduleId = appt.scheduleId;
    const oldDoctorId = appt.doctorId;
    const { APPOINTMENT_STATUS, INVOICE_TYPE, INVOICE_STATUS } = require('../../constants/enums');

    // Capture original values BEFORE mutating appt fields
    const originalRequestedDate = appt.requestedDate;

    // Update fields if provided
    if (requestedDate) {
      appt.requestedDate = new Date(requestedDate);
    }
    if (requestedTime) {
      appt.requestedTime = requestedTime;
    }
    if (doctorId) {
      appt.doctorId = doctorId;
    }

    const newDoctorId = appt.doctorId;

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

    const targetStatus = status || oldStatus;

    // If confirming or reassigned while confirmed, ensure schedule capacity
    if (targetStatus === APPOINTMENT_STATUS.CONFIRMED) {
      const dateOnly = new Date(appt.requestedDate);
      dateOnly.setHours(0, 0, 0, 0);

      const scheduleChanged = (status && oldStatus !== APPOINTMENT_STATUS.CONFIRMED) || 
                              (scheduleId && String(scheduleId) !== String(oldScheduleId)) ||
                              (requestedDate && new Date(requestedDate).getTime() !== new Date(originalRequestedDate).getTime()) ||
                              (doctorId && String(doctorId) !== String(oldDoctorId));

      if (scheduleChanged) {
        let schedule = null;
        if (scheduleId) {
          schedule = await Doctor_Schedule.findById(scheduleId);
        } else {
          schedule = await Doctor_Schedule.findOne({ doctorId: newDoctorId, workDate: dateOnly });
        }

        if (schedule) {
          if (!isWithinSchedule(appt.requestedTime, schedule.startTime, schedule.endTime)) {
            return res.status(409).json({ success: false, message: 'The requested time is outside this work shift.' });
          }

          const isSameSchedule = oldScheduleId && String(oldScheduleId) === String(schedule._id) && oldStatus === APPOINTMENT_STATUS.CONFIRMED;

          if (!isSameSchedule) {
            // Decrement old schedule first if already confirmed on a different slot
            if (oldStatus === APPOINTMENT_STATUS.CONFIRMED && oldScheduleId) {
              await Doctor_Schedule.findByIdAndUpdate(oldScheduleId, { $inc: { currentBooked: -1 } });
            }

            // Atomically check capacity and increment to prevent race conditions
            const capacityFilter = schedule.maxPatients
              ? { _id: schedule._id, $expr: { $lt: ['$currentBooked', '$maxPatients'] } }
              : { _id: schedule._id };
            const bookedSchedule = await Doctor_Schedule.findOneAndUpdate(
              capacityFilter,
              { $inc: { currentBooked: 1 } },
              { new: true }
            );
            if (!bookedSchedule) {
              if (oldStatus === APPOINTMENT_STATUS.CONFIRMED && oldScheduleId) {
                await Doctor_Schedule.findByIdAndUpdate(oldScheduleId, { $inc: { currentBooked: 1 } });
              }
              return res.status(409).json({ success: false, message: 'This shift is full; no more appointments can be confirmed.' });
            }
          }
          appt.scheduleId = schedule._id;
        } else {
          return res.status(409).json({ success: false, message: 'The selected doctor has no working schedule shift on this day.' });
        }
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

    // Capture oldAttendance BEFORE the cancel block may mutate appt.attendance
    const oldAttendance = appt.attendance || 'Unknown';

    // If cancelling after confirmed, decrement currentBooked and actualAttended
    if (oldStatus === APPOINTMENT_STATUS.CONFIRMED && status === APPOINTMENT_STATUS.CANCELED) {
      let schedule = null;
      if (appt.scheduleId) schedule = await Doctor_Schedule.findById(appt.scheduleId);
      if (!schedule) {
        schedule = await Doctor_Schedule.findOne({ doctorId: appt.doctorId, workDate: appt.requestedDate });
      }
      if (schedule) {
        if (typeof schedule.currentBooked === 'number' && schedule.currentBooked > 0) {
          schedule.currentBooked = Math.max(0, schedule.currentBooked - 1);
        }
        if (appt.attendance === 'Present' && typeof schedule.actualAttended === 'number' && schedule.actualAttended > 0) {
          schedule.actualAttended = Math.max(0, schedule.actualAttended - 1);
        }
        await schedule.save();
      }
      appt.attendance = 'Absent';
    }

    // Process attendance changes directly if provided
    if (attendance !== undefined && attendance !== oldAttendance) {
      let schedule = null;
      if (appt.scheduleId) schedule = await Doctor_Schedule.findById(appt.scheduleId);
      if (!schedule && appt.doctorId && appt.requestedDate) {
        schedule = await Doctor_Schedule.findOne({ doctorId: appt.doctorId, workDate: appt.requestedDate });
      }

      if (schedule) {
        if (typeof schedule.actualAttended !== 'number') {
          schedule.actualAttended = 0;
        }

        if (attendance === 'Present' && oldAttendance !== 'Present') {
          schedule.actualAttended += 1;
        } else if (attendance !== 'Present' && oldAttendance === 'Present') {
          schedule.actualAttended = Math.max(0, schedule.actualAttended - 1);
        }
        await schedule.save();
      }
      appt.attendance = attendance;
    }

    if (status) appt.status = status;
    if (status === APPOINTMENT_STATUS.CONFIRMED && req.user && (req.user.id || req.user._id)) appt.confirmedBy = req.user.id || req.user._id;
    await appt.save();

    // Send notifications if status changed
    if (status && status !== oldStatus) {
      try {
        const { notifyPatient, notifyStaff } = require('../../utils/notificationHelper');
        const dateStr = new Date(appt.requestedDate).toISOString().split('T')[0];
        const patientObj = await Patient.findById(appt.patientId);
        const patientName = patientObj ? patientObj.fullName : 'Guest';

        if (status === APPOINTMENT_STATUS.CONFIRMED) {
          await notifyPatient(
            appt.patientId,
            'Appointment Confirmed',
            `Your appointment on ${dateStr} at ${appt.requestedTime} has been confirmed.`
          );
        } else if (status === APPOINTMENT_STATUS.CANCELED) {
          await notifyPatient(
            appt.patientId,
            'Appointment Cancelled',
            `Your appointment on ${dateStr} at ${appt.requestedTime} has been cancelled.`
          );
          await notifyStaff(
            'Appointment Cancelled',
            `Patient ${patientName} cancelled their appointment for ${dateStr} at ${appt.requestedTime}.`
          );
        } else if (status === APPOINTMENT_STATUS.COMPLETED) {
          await notifyPatient(
            appt.patientId,
            'Appointment Completed',
            `Thank you for your visit! Your appointment on ${dateStr} at ${appt.requestedTime} is completed.`
          );
        }
      } catch (notifErr) {
        console.error('Error sending status update notifications:', notifErr);
      }
    }

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
    const existing = await Doctor_Schedule.findOne({ doctorId, workDate: dateOnly, startTime, endTime });
    if (existing) return res.status(409).json({ success: false, message: 'The doctor already has this specific shift on this day' });
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

const blockDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required to block a schedule' });
    }

    const schedule = await Doctor_Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (schedule.currentBooked > 0) {
      return res.status(400).json({ success: false, message: 'Cannot block this shift because patients are already booked.' });
    }

    schedule.status = 'Blocked';
    schedule.blockReason = reason;
    await schedule.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, schedule, 'Shift blocked successfully');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error blocking the shift', 500, err.message);
  }
};

const unblockDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Doctor_Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    if (schedule.status !== 'Blocked') {
      return res.status(400).json({ success: false, message: 'Shift is not blocked' });
    }

    schedule.status = 'Available';
    schedule.blockReason = null;
    await schedule.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, schedule, 'Shift unblocked successfully');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error unblocking the shift', 500, err.message);
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, getSchedules, getAllSchedules, createDoctorSchedule, deleteDoctorSchedule, bookAppointment, getAppointments, updateAppointmentStatus, blockDoctorSchedule, unblockDoctorSchedule };
