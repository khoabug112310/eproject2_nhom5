// Module Clinical - Controller
// Handles: Medicines, Medical_Records, Prescriptions

const Medicine = require('../../models/Medicine');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');

const getMedicines = async (req, res) => {
  try {
    const items = await Medicine.find().lean();
    const { success: ok, fail } = require('../../utils/response');
    return ok(res, items, 'Medicine list loaded successfully');
  } catch (err) {
    console.error('getMedicines error', err);
    return res.status(500).json({ message: 'Error loading the medicine list' });
  }
};

// Public: list doctors for frontend
const getDoctorsPublic = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.department) {
      query.departmentId = req.query.department;
    }
    const docs = await Doctor.find(query).limit(50).populate('departmentId').lean();
    // Map to frontend-friendly fields
    const mapped = docs.map(d => ({
      _id: d._id,
      id: d._id,
      fullName: d.fullName,
      avatar: d.avatarURL || null,
      specialization: d.specialization,
      departmentId: d.departmentId ? d.departmentId._id : null,
      department: d.departmentId ? d.departmentId.departmentName : null,
      experienceYears: d.experienceYears,
      qualifications: d.qualifications,
      baseFee: d.baseFee,
      bio: d.bio,
    }));
    const { success: ok, fail } = require('../../utils/response');
    return ok(res, mapped, 'Doctor list loaded successfully');
  } catch (err) {
    console.error('getDoctorsPublic error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading the doctor list', 500, err.message);
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
      return res.status(400).json({ success: false, message: 'appointmentId and diagnosis are required' });
    }

    const doc = await Doctor.findOne({ userId: req.user.id });
    if (!doc) {
      return res.status(403).json({ success: false, message: 'Only a doctor account can create medical records' });
    }

    const appt = await Appointment.findById(appointmentId);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const recordFields = {
      patientId: appt.patientId,
      doctorId: doc._id,
      height: Number(height) || undefined,
      weight: Number(weight) || undefined,
      bloodPressure: bloodPressure || undefined,
      heartRate: Number(heartRate) || undefined,
      temperature: Number(temperature) || undefined,
      diagnosis,
      clinicalNotes: clinicalNotes || undefined,
    };

    let record = await Medical_Record.findOne({ appointmentId });
    let message = 'Medical record created successfully';

    if (record) {
      Object.assign(record, recordFields);
      await record.save();
      message = 'Medical record updated successfully';
    } else {
      record = await Medical_Record.create({
        appointmentId,
        ...recordFields,
      });
    }

    if (appt.status !== 'Completed') {
      appt.status = 'Completed';
      await appt.save();
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, record, message);
  } catch (err) {
    console.error('createMedicalRecord error', err);
    const { fail } = require('../../utils/response');
    if (err.code === 11000) {
      return fail(res, 'This appointment already has a medical record', 409, err.message);
    }
    return fail(res, 'Error creating the medical record', 500, err.message);
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
          return ok(res, [], 'Medical record list loaded successfully');
        }
        // Fetch medical records for primary patient and all dependents (sub-accounts)
        const dependents = await Patient.find({ parentId: patient._id });
        const patientIds = [patient._id, ...dependents.map(d => d._id)];
        q.patientId = { $in: patientIds };
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
    return ok(res, items, 'Medical record list loaded successfully');
  } catch (err) {
    console.error('getMedicalRecords error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading medical records', 500, err.message);
  }
};

const createPrescription = async (req, res) => {
  try {
    const { recordId, medicines } = req.body;
    if (!recordId || !Array.isArray(medicines)) {
      return res.status(400).json({ success: false, message: 'recordId and the medicines list are required' });
    }

    const record = await Medical_Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    let invoice = await Invoice.findOne({ appointmentId: record.appointmentId, invoiceType: INVOICE_TYPE.PHARMACY, status: INVOICE_STATUS.UNPAID });
    if (!invoice && medicines.length > 0) {
      invoice = await Invoice.create({
        appointmentId: record.appointmentId,
        patientId: record.patientId,
        invoiceType: INVOICE_TYPE.PHARMACY,
        totalAmount: 0,
        status: INVOICE_STATUS.UNPAID,
        issuedAt: new Date(),
      });
    }

    const prescriptionsCreated = [];

    for (const item of medicines) {
      const med = await Medicine.findById(item.medicineId);
      if (!med) {
        return res.status(404).json({ success: false, message: `Medicine with ID ${item.medicineId} not found` });
      }

      const qty = Number(item.quantity) || 1;
      const subTotal = (med.unitPrice || 0) * qty;

      let presc = await Prescription.findOne({ recordId, medicineId: item.medicineId });
      if (presc) {
        presc.quantity += qty;
        presc.dosage = item.dosage || presc.dosage;
        presc.frequency = item.frequency || presc.frequency;
        presc.durationDays = Number(item.durationDays) || presc.durationDays;
        presc.specialInstructions = item.specialInstructions || presc.specialInstructions;
        await presc.save();
      } else {
        presc = await Prescription.create({
          recordId,
          medicineId: item.medicineId,
          quantity: qty,
          dosage: item.dosage || '1 tablet',
          frequency: item.frequency || 'Twice a day',
          durationDays: Number(item.durationDays) || 7,
          specialInstructions: item.specialInstructions || '',
        });
      }
      prescriptionsCreated.push(presc);

      // Handle invoice detail
      if (invoice) {
        let existingDetail = await Invoice_Detail.findOne({ invoiceId: invoice._id, medicineId: item.medicineId });
        if (existingDetail) {
          existingDetail.quantity += qty;
          existingDetail.subTotal += subTotal;
          await existingDetail.save();
        } else {
          await Invoice_Detail.create({
            invoiceId: invoice._id,
            medicineId: item.medicineId,
            quantity: qty,
            unitPrice: med.unitPrice,
            subTotal: subTotal,
          });
        }
        invoice.totalAmount += subTotal;
        await invoice.save();
      }

      // Deduct stock quantity
      if (typeof med.stockQuantity === 'number') {
        med.stockQuantity = Math.max(0, med.stockQuantity - qty);
        await med.save();
      }
    }

    const { success: ok } = require('../../utils/response');
    return ok(res, prescriptionsCreated, 'Prescription created successfully');
  } catch (err) {
    console.error('createPrescription error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error creating the prescription', 500, err.message);
  }
};

const getPrescriptions = async (req, res) => {
  try {
    let q = {};
    if (req.query.recordId) q.recordId = req.query.recordId;
    const items = await Prescription.find(q).populate('medicineId').lean();

    const { success: ok } = require('../../utils/response');
    return ok(res, items, 'Prescription list loaded successfully');
  } catch (err) {
    console.error('getPrescriptions error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading prescriptions', 500, err.message);
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
    }, 'Public statistics loaded successfully');
  } catch (err) {
    console.error('getPublicStats error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error loading public statistics', 500, err.message);
  }
};

const createMedicine = async (req, res) => {
  try {
    const { medicineName, medicineCode, activeIngredient, usageRoute, unit, unitPrice, stockQuantity } = req.body;
    if (!medicineName || !medicineCode || !unit || unitPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Required medicine information is missing' });
    }
    const med = await Medicine.create({ medicineName, medicineCode, activeIngredient, usageRoute, unit, unitPrice: Number(unitPrice), stockQuantity: Number(stockQuantity) || 0, isActive: true });
    const { success: ok } = require('../../utils/response');
    return ok(res, med, 'Medicine added successfully', 201);
  } catch (err) {
    const { fail } = require('../../utils/response');
    if (err.code === 11000) return fail(res, 'Medicine code already exists', 409);
    return fail(res, 'Error adding the medicine', 500, err.message);
  }
};

const updateMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    const { success: ok } = require('../../utils/response');
    return ok(res, med, 'Medicine updated successfully');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error updating the medicine', 500, err.message);
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Medicine deactivated');
  } catch (err) {
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the medicine', 500, err.message);
  }
};

const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const presc = await Prescription.findById(id);
    if (!presc) {
      const { fail } = require('../../utils/response');
      return fail(res, 'Prescription not found', 404);
    }

    const med = await Medicine.findById(presc.medicineId);
    
    // Find the medical record to get appointmentId
    const record = await Medical_Record.findById(presc.recordId);
    if (record) {
      // Find the unpaid pharmacy invoice
      let invoice = await Invoice.findOne({ appointmentId: record.appointmentId, invoiceType: INVOICE_TYPE.PHARMACY, status: INVOICE_STATUS.UNPAID });
      if (invoice) {
        // Find and delete the invoice detail
        const existingDetail = await Invoice_Detail.findOne({ invoiceId: invoice._id, medicineId: presc.medicineId });
        if (existingDetail) {
           invoice.totalAmount -= existingDetail.subTotal;
           if (invoice.totalAmount < 0) invoice.totalAmount = 0;
           await Invoice_Detail.findByIdAndDelete(existingDetail._id);
           
           if (invoice.totalAmount === 0) {
              await Invoice.findByIdAndDelete(invoice._id);
           } else {
              await invoice.save();
           }
        }
      }
    }

    // Restore stock
    if (med && typeof med.stockQuantity === 'number') {
      med.stockQuantity += presc.quantity;
      await med.save();
    }

    await Prescription.findByIdAndDelete(id);

    const { success: ok } = require('../../utils/response');
    return ok(res, null, 'Prescription deleted successfully');
  } catch (err) {
    console.error('deletePrescription error', err);
    const { fail } = require('../../utils/response');
    return fail(res, 'Error deleting the prescription', 500, err.message);
  }
};

module.exports = { getMedicines, createMedicine, updateMedicine, deleteMedicine, createMedicalRecord, getMedicalRecords, createPrescription, getPrescriptions, deletePrescription, getDoctorsPublic, getPublicStats };
