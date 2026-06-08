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
      experienceYears: d.experienceYears,
      qualifications: d.qualifications,
      baseFee: d.baseFee,
      bio: d.bio,
    }));
    const { success: ok, fail } = require('../../utils/response');
    return ok(res, mapped, 'Lấy danh sách bác sĩ thành công');
  } catch (err) {
    console.error('getDoctorsPublic error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bác sĩ', 500, err.message);
  }
};

const Medical_Record = require('../../models/Medical_Record');
const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Invoice = require('../../models/Invoice');
const Invoice_Detail = require('../../models/Invoice_Detail');
const { INVOICE_TYPE, INVOICE_STATUS } = require('../../constants/enums');

const createMedicalRecord = async (req, res) => {
  try {
    const { appointmentId, height, weight, bloodPressure, heartRate, temperature, diagnosis, clinicalNotes } = req.body;
    if (!appointmentId || !diagnosis) {
      return res.status(400).json({ success: false, message: 'appointmentId và diagnosis là bắt buộc' });
    }

    const doc = await Doctor.findOne({ userId: req.user.id });
    if (!doc) {
      return res.status(403).json({ success: false, message: 'Chỉ tài khoản bác sĩ mới có thể tạo bệnh án' });
    }

    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Lịch khám không tồn tại' });
    }

    // Create the Medical Record
    const record = await Medical_Record.create({
      appointmentId,
      patientId: appt.patientId,
      doctorId: doc._id,
      height: Number(height) || undefined,
      weight: Number(weight) || undefined,
      bloodPressure,
      heartRate: Number(heartRate) || undefined,
      temperature: Number(temperature) || undefined,
      diagnosis,
      clinicalNotes,
    });

    // Update appointment status to Completed
    appt.status = 'Completed';
    await appt.save();

    const { success: ok } = require('../../utils/response');
    return ok(res, record, 'Tạo hồ sơ bệnh án thành công');
  } catch (err) {
    console.error('createMedicalRecord error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi tạo hồ sơ bệnh án', 500, err.message);
  }
};

const getMedicalRecords = async (req, res) => {
  try {
    let q = {};
    if (req.user) {
      if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ userId: req.user.id });
        if (!patient) {
          const { success: ok } = require('../../utils/response');
          return ok(res, [], 'Lấy danh sách bệnh án thành công');
        }
        q.patientId = patient._id;
      } else {
        if (req.query.patientId) q.patientId = req.query.patientId;
        if (req.query.appointmentId) q.appointmentId = req.query.appointmentId;
      }
    }

    const items = await Medical_Record.find(q)
      .populate('doctorId patientId appointmentId')
      .populate({
        path: 'appointmentId',
        populate: { path: 'departmentId' }
      })
      .sort({ createdAt: -1 })
      .lean();

    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách bệnh án thành công');
  } catch (err) {
    console.error('getMedicalRecords error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách bệnh án', 500, err.message);
  }
};

const createPrescription = async (req, res) => {
  try {
    const { recordId, medicines } = req.body;
    if (!recordId || !Array.isArray(medicines)) {
      return res.status(400).json({ success: false, message: 'recordId và danh sách medicines là bắt buộc' });
    }

    const record = await Medical_Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Hồ sơ bệnh án không tồn tại' });
    }

    let totalAmount = 0;
    const detailItems = [];
    const prescriptionsCreated = [];

    for (const item of medicines) {
      const med = await Medicine.findById(item.medicineId);
      if (!med) {
        return res.status(404).json({ success: false, message: `Thuốc với ID ${item.medicineId} không tồn tại` });
      }

      const qty = Number(item.quantity) || 1;
      const subTotal = (med.unitPrice || 0) * qty;
      totalAmount += subTotal;

      const presc = await Prescription.create({
        recordId,
        medicineId: item.medicineId,
        quantity: qty,
        dosage: item.dosage || '1 viên',
        frequency: item.frequency || '2 lần/ngày',
        durationDays: Number(item.durationDays) || 7,
        specialInstructions: item.specialInstructions || '',
      });
      prescriptionsCreated.push(presc);

      detailItems.push({
        medicineId: item.medicineId,
        quantity: qty,
        unitPrice: med.unitPrice,
        subTotal,
      });

      // Deduct stock quantity
      if (typeof med.stockQuantity === 'number') {
        med.stockQuantity = Math.max(0, med.stockQuantity - qty);
        await med.save();
      }
    }

    // Auto-create Pharmacy Invoice
    if (detailItems.length > 0) {
      const invoice = await Invoice.create({
        appointmentId: record.appointmentId,
        patientId: record.patientId,
        invoiceType: INVOICE_TYPE.PHARMACY,
        totalAmount,
        status: INVOICE_STATUS.UNPAID,
        issuedAt: new Date(),
      });

      for (const d of detailItems) {
        await Invoice_Detail.create({
          invoiceId: invoice._id,
          medicineId: d.medicineId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          subTotal: d.subTotal,
        });
      }
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, prescriptionsCreated, 'Kê đơn thuốc thành công');
  } catch (err) {
    console.error('createPrescription error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi kê đơn thuốc', 500, err.message);
  }
};

const getPrescriptions = async (req, res) => {
  try {
    let q = {};
    if (req.query.recordId) q.recordId = req.query.recordId;
    const items = await Prescription.find(q).populate('medicineId').lean();

    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Lấy danh sách đơn thuốc thành công');
  } catch (err) {
    console.error('getPrescriptions error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy danh sách đơn thuốc', 500, err.message);
  }
};

const getPublicStats = async (req, res) => {
  try {
    const Department = require('../../models/Department');
    const Doctor = require('../../models/Doctor');
    const Patient = require('../../models/Patient');
    const Appointment = require('../../models/Appointment');

    const departmentCount = await Department.countDocuments();
    const doctorCount = await Doctor.countDocuments({ isActive: true });
    const patientCount = await Patient.countDocuments();
    const appointmentCount = await Appointment.countDocuments();

    const { success: ok } = require('../../utils/response');
    return ok(res, {
      departments: departmentCount,
      doctors: doctorCount,
      patients: patientCount,
      appointments: appointmentCount
    }, 'Lấy số liệu thống kê công khai thành công');
  } catch (err) {
    console.error('getPublicStats error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Lỗi khi lấy số liệu thống kê công khai', 500, err.message);
  }
};

module.exports = { getMedicines, createMedicalRecord, getMedicalRecords, createPrescription, getPrescriptions, getDoctorsPublic, getPublicStats };
