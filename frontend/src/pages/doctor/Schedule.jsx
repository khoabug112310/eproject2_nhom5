import React, { useState, useEffect } from 'react';
import { clinicalAPI, schedulingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Swal from 'sweetalert2';
import '../../styles/work-dashboard.css';

const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const translateSpecialty = (str) => {
  if (!str) return '';
  const s = str.toLowerCase();
  if (s.includes('nội tim mạch') || s.includes('can thiệp')) return 'Cardiology & Intervention';
  if (s.includes('nội khoa') || s.includes('tổng quát')) return 'Internal Medicine';
  if (s.includes('ngoại khoa')) return 'Surgery';
  if (s.includes('sản phụ khoa')) return 'Obstetrics & Gynecology';
  if (s.includes('tai mũi họng')) return 'ENT (Ear, Nose, Throat)';
  if (s.includes('nha khoa') || s.includes('răng hàm mặt')) return 'Dentistry';
  if (s.includes('da liễu')) return 'Dermatology';
  if (s.includes('nhi khoa')) return 'Pediatrics';
  if (s.includes('chẩn đoán hình ảnh')) return 'Imaging & Diagnostics';
  if (s.includes('xét nghiệm') || s.includes('vi sinh')) return 'Laboratory';
  if (s.includes('y học cổ truyền') || s.includes('phục hồi')) return 'Traditional Medicine';
  return str;
};

const getTodayYMD = () => {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export default function DoctorSchedule() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [currentUser, setCurrentUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState(getTodayYMD());
  const [filterToDate, setFilterToDate] = useState(getTodayYMD());
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [scheduleFilterDate, setScheduleFilterDate] = useState(getTodayStr());

  // Print prescription state
  const [printData, setPrintData] = useState(null);

  // Active examination state
  const [activeAppt, setActiveAppt] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [examForm, setExamForm] = useState({
    height: '',
    weight: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    diagnosis: '',
    clinicalServices: [],
    clinicalNotes: '',
  });
  
  const [showServicesModal, setShowServicesModal] = useState(false);
  let availableServices = [
    'Electro-acupuncture',
    'Pharmacopuncture',
    'Catgut Embedding',
    'Moxibustion',
    'Medical Massage & Acupressure',
    'Cupping Therapy',
    'Infrared Therapy',
    'Herbal Steam Therapy'
  ];

  const spec = doctor?.specialization?.toLowerCase() || '';

  if (spec.includes('cardiology') || spec.includes('tim mạch') || spec.includes('nội tim mạch')) {
    availableServices = [
      'Cardiac Catheterization',
      'Coronary Angiography',
      'Stent Placement',
      'Ventricular Septal Defect Closure',
      'Atrial Septal Defect Closure',
      'Patent Ductus Arteriosus Closure',
      'Aortic Coarctation Angioplasty',
      'Thoracic/Abdominal & Peripheral Stenting'
    ];
  } else if (spec.includes('pediatric')) {
    availableServices = [
      'Well-child Care / Vaccination Counseling',
      'Vaccination',
      'Odonto-Stomatology',
      'Ophthalmology',
      'Speech Therapy',
      'Nutrition Counseling',
      'Psychology Counseling'
    ];
  } else if (spec.includes('general medicine') || spec.includes('nội tổng hợp')) {
    availableServices = [
      'Neurology',
      'Gastroenterology',
      'Pulmonology',
      'Dermatology',
      'Endocrinology',
      'Nephrology & Urology',
      'Cardiology'
    ];
  }

  // Active prescription state
  const [activeRecordForPrescription, setActiveRecordForPrescription] = useState(null);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [medForm, setMedForm] = useState({
    quantity: 1,
    dosage: '1 tablet',
    frequency: 'Twice a day',
    durationDays: 7,
    specialInstructions: 'After meals',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Get Me
      const meRes = await authAPI.me();
      const me = meRes.data.data;
      setCurrentUser(me);

      // 2. Find doctor profile
      const doctorsRes = await clinicalAPI.getDoctors();
      const matchedDoc = doctorsRes.data.data.find(d => d.fullName === me.displayName);
      if (matchedDoc) {
        setDoctor(matchedDoc);
        
        // Fetch appointments for this doctor
        const apptsRes = await schedulingAPI.getAppointments();
        setAppointments(apptsRes.data.data);

        // Fetch schedules
        const schedsRes = await schedulingAPI.getSchedules(matchedDoc.id);
        setSchedules(schedsRes.data.data);
      }

      // Fetch medicines for prescription search
      const medsRes = await clinicalAPI.getMedicines();
      setMedicinesList(medsRes.data.data);

      // Fetch all medical records
      const recordsRes = await clinicalAPI.getMedicalRecords();
      setMedicalRecords(recordsRes.data.data);

      // Fetch all prescriptions
      const prescRes = await clinicalAPI.getPrescriptions();
      setAllPrescriptions(prescRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error loading doctor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecordForAppointment = (apptId) => {
    const id = apptId?.toString?.() || apptId;
    return medicalRecords.find((rec) => {
      const recApptId = rec.appointmentId?._id || rec.appointmentId;
      return recApptId?.toString?.() === id;
    });
  };

  const prescribedRecordIds = new Set(allPrescriptions.map(p => p.recordId?._id || p.recordId));
  const recordsWaitingForPrescription = medicalRecords.filter(rec => !prescribedRecordIds.has(rec._id));

  const handleSelectAppointment = async (appt) => {
    setActiveAppt(appt);
    const existingRecord = getRecordForAppointment(appt._id);
    setExamForm({
      height: existingRecord?.height?.toString() || '',
      weight: existingRecord?.weight?.toString() || '',
      bloodPressure: existingRecord?.bloodPressure || '',
      heartRate: existingRecord?.heartRate?.toString() || '',
      temperature: existingRecord?.temperature?.toString() || '',
      diagnosis: existingRecord?.diagnosis || '',
      clinicalNotes: existingRecord?.clinicalNotes || '',
    });

    // Load patient history
    try {
      const patientId = appt.patientId?._id || appt.patientId;
      const historyRes = await clinicalAPI.getMedicalRecords({ patientId });
      setPatientHistory(historyRes.data.data);
    } catch (err) {
      console.error('Error loading patient history', err);
    }
  };

  const handleSelectRecordForPrescription = (rec) => {
    setActiveRecordForPrescription(rec);
    setPrescriptionItems([]);
    setMedSearch('');
    setSelectedMed(null);
  };

  const handleAddMedicine = () => {
    if (!selectedMed) return;
    
    if (selectedMed.stockQuantity < medForm.quantity) {
      Swal.fire({
        title: 'Stock warning',
        text: `Note: Only ${selectedMed.stockQuantity} ${selectedMed.unit} left in stock. Continue prescribing?`,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
    }

    const newItem = {
      medicineId: selectedMed._id,
      name: selectedMed.medicineName || selectedMed.name,
      dosageForm: selectedMed.usageRoute || selectedMed.dosageForm || 'Oral',
      quantity: Number(medForm.quantity),
      dosage: medForm.dosage,
      frequency: medForm.frequency,
      durationDays: Number(medForm.durationDays),
      specialInstructions: medForm.specialInstructions,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
    setSelectedMed(null);
    setMedSearch('');
    setMedForm({
      quantity: 1,
      dosage: '1 tablet',
      frequency: 'Twice a day',
      durationDays: 7,
      specialInstructions: 'After meals',
    });
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const handleSubmitExamination = async (e) => {
    e.preventDefault();
    if (!examForm.diagnosis) {
      Swal.fire({
        title: 'Missing information',
        text: 'Please enter the diagnosis.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await clinicalAPI.createMedicalRecord({
        appointmentId: activeAppt._id,
        height: examForm.height || undefined,
        weight: examForm.weight || undefined,
        bloodPressure: examForm.bloodPressure || undefined,
        heartRate: examForm.heartRate || undefined,
        temperature: examForm.temperature || undefined,
        diagnosis: examForm.diagnosis,
        clinicalNotes: (examForm.clinicalServices?.length > 0 ? `[Ordered Services: ${examForm.clinicalServices.join(', ')}]\n` : '') + examForm.clinicalNotes,
      });

      setSuccessMessage(`Examination completed for patient ${activeAppt.patientId?.fullName || ''}. The patient has been moved to the Prescription queue.`);
      setActiveAppt(null);
      fetchInitialData();
    } catch (err) {
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'An error occurred while creating the medical record.';
      setErrorMessage(details ? `${baseMsg} (${details})` : baseMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (prescriptionItems.length === 0) {
      Swal.fire({
        title: 'Missing information',
        text: 'Please add at least one medicine to the prescription.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Medicines are already saved to the database via handleAddPrescription.
      // We just need to map the items and trigger the print dialog.
      const mappedMedicines = prescriptionItems.map(item => ({
        name: item.medicineId?.medicineName || item.medicineId?.name || item.name || 'Medicine',
        dosageForm: item.medicineId?.unit || item.medicineId?.dosageForm || item.dosageForm || 'Oral',
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        specialInstructions: item.specialInstructions,
      }));

      setPrintData({
        patient: activeRecordForPrescription.patientId,
        doctor: currentUser,
        appointment: activeRecordForPrescription.appointmentId,
        diagnosis: activeRecordForPrescription.diagnosis,
        clinicalNotes: activeRecordForPrescription.clinicalNotes,
        medicines: mappedMedicines,
        date: new Date(),
      });
      
      setActiveRecordForPrescription(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred while preparing the prescription print.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toDateString();
  const isDefaultView = (!filterFromDate && !filterToDate) || (filterFromDate === getTodayYMD() && filterToDate === getTodayYMD());
  
  const filteredAppointments = appointments
    .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
    .filter(a => {
      const aDate = new Date(a.requestedDate);
      aDate.setHours(0, 0, 0, 0);

      let isMatch = true;

      if (filterFromDate || filterToDate) {
        if (filterFromDate) {
          const from = new Date(filterFromDate);
          from.setHours(0, 0, 0, 0);
          if (aDate < from) isMatch = false;
        }
        if (filterToDate) {
          const to = new Date(filterToDate);
          to.setHours(0, 0, 0, 0);
          if (aDate > to) isMatch = false;
        }
      } else {
        isMatch = new Date(a.requestedDate).toDateString() === todayStr;
      }

      if (isMatch && patientSearchQuery) {
        const q = patientSearchQuery.trim().toLowerCase();
        const pName = (a.patientId?.fullName || '').toLowerCase();
        const pPhone = (a.patientId?.phoneNumber || '').toLowerCase();
        if (!pName.includes(q) && !pPhone.includes(q)) {
          isMatch = false;
        }
      }

      return isMatch;
    });

  const filteredMeds = medSearch
    ? medicinesList.filter(m => 
        (m.medicineName || m.name || '').toLowerCase().includes(medSearch.toLowerCase())
      )
    : [];



  const handleOpenPrescription = async (apptId) => {
    const record = getRecordForAppointment(apptId);
    if (!record) {
      Swal.fire('Lỗi', 'Bệnh nhân chưa được khám (chưa có hồ sơ). Vui lòng khám trước!', 'error');
      return;
    }
    setActiveRecordForPrescription(record);
    try {
      const res = await clinicalAPI.getPrescriptions(record._id);
      setPrescriptionItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!selectedMed || !activeRecordForPrescription) return;
    try {
      const data = {
        recordId: activeRecordForPrescription._id,
        medicines: [
          {
            medicineId: selectedMed._id,
            quantity: Number(medForm.quantity),
            dosage: medForm.dosage,
            frequency: medForm.frequency,
            durationDays: Number(medForm.durationDays),
            specialInstructions: medForm.specialInstructions
          }
        ]
      };
      await clinicalAPI.createPrescription(data);
      const res = await clinicalAPI.getPrescriptions(activeRecordForPrescription._id);
      setPrescriptionItems(res.data.data || []);
      setSelectedMed(null);
      setMedSearch('');
      Swal.fire({ title: 'Thành công', text: 'Đã thêm thuốc vào đơn', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch(err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể thêm thuốc', 'error');
    }
  };

  const handleRemovePrescription = async (prescId) => {
    try {
      const result = await Swal.fire({
        title: 'Xóa thuốc này?',
        text: 'Bạn có chắc chắn muốn xóa thuốc này khỏi đơn?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await clinicalAPI.deletePrescription(prescId);
        const res = await clinicalAPI.getPrescriptions(activeRecordForPrescription._id);
        setPrescriptionItems(res.data.data || []);
        Swal.fire({ title: 'Đã xóa', icon: 'success', timer: 1000, showConfirmButton: false });
      }
    } catch(err) {
      console.error(err);
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'Không thể xóa thuốc';
      Swal.fire('Lỗi', details ? `${baseMsg} (${details})` : baseMsg, 'error');
    }
  };

  const handleBlockSlot = async (schedule) => {
    const isVirtual = String(schedule._id).startsWith('virtual_');

    const result = await Swal.fire({
      title: 'Block this slot / Request Leave',
      input: 'text',
      inputLabel: 'Reason for blocking this shift',
      inputPlaceholder: 'e.g. Sick leave, Meeting',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write a reason!';
        }
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        let targetId = schedule._id;
        
        // If the schedule hasn't been created yet, create it on the backend first
        if (isVirtual) {
          const createRes = await schedulingAPI.createDoctorSchedule({
             doctorId: doctor._id || doctor.id,
             workDate: schedule.workDate,
             startTime: schedule.startTime,
             endTime: schedule.endTime,
             maxPatients: 5
          });
          targetId = createRes.data.data._id;
        }

        await schedulingAPI.blockSchedule(targetId, result.value);
        Swal.fire('Success', 'Shift blocked successfully', 'success');
        
        // Refresh schedule
        const schedsRes = await schedulingAPI.getSchedules(doctor.id || doctor._id);
        setSchedules(schedsRes.data.data);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.message || 'Could not block this shift', 'error');
      }
    }
  };

  const handleUnblockSlot = async (schedule) => {
    try {
      const result = await Swal.fire({
        title: 'Unblock this slot',
        input: 'text',
        inputValue: schedule.blockReason || '',
        inputAttributes: {
          readonly: true,
          disabled: true
        },
        inputLabel: 'Reason for blocking this shift',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Unblock',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        await schedulingAPI.unblockSchedule(schedule._id);
        Swal.fire('Success', 'Shift unblocked successfully', 'success');
        // Refresh schedule
        const schedsRes = await schedulingAPI.getSchedules(doctor.id || doctor._id);
        setSchedules(schedsRes.data.data);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Could not unblock this shift', 'error');
    }
  };

  const SERVICE_PRICES = { 
    'Electro-acupuncture': 150000,
    'Pharmacopuncture': 200000,
    'Catgut Embedding': 500000,
    'Moxibustion': 100000,
    'Medical Massage & Acupressure': 200000,
    'Cupping Therapy': 100000,
    'Infrared Therapy': 80000,
    'Herbal Steam Therapy': 150000
  };

  const formatCurrency = (amount) => {
    return '₫' + amount.toLocaleString('en-US');
  };

  const handlePrintBill = (appt) => {
    const rec = getRecordForAppointment(appt._id);
    if (!rec) return;

    let srvs = [];
    if (rec.clinicalNotes && rec.clinicalNotes.includes('[Ordered Services:')) {
      const match = rec.clinicalNotes.match(/\[Ordered Services: (.*?)\]/);
      if (match) {
        srvs = match[1].split(',').map(s => s.trim());
      }
    }

    if (srvs.length === 0) {
      Swal.fire('Info', 'No additional clinical services ordered to bill.', 'info');
      return;
    }

    let totalAmount = 0;
    const servicesWithPrices = srvs.map(s => {
      const price = SERVICE_PRICES[s] || 150000;
      totalAmount += price;
      return { name: s, price };
    });

    const billHtml = `
      <div style="text-align: left; font-size: 15px; line-height: 1.6; padding: 10px; color: #111; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 20px; text-transform: uppercase;">Clinical Services Bill</h2>
          <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">Date: ${new Date().toLocaleDateString('en-US')} | Record: ${rec._id.slice(-6).toUpperCase()}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="margin: 4px 0;"><strong>Patient:</strong> ${rec.patientId?.fullName || appt.patientId?.fullName}</p>
          <p style="margin: 4px 0;"><strong>Doctor:</strong> ${doctor?.fullName || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Diagnosis:</strong> <span style="color: #ef4444">${rec.diagnosis || 'None'}</span></p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <th style="text-align: left; padding: 8px 0; color: #475569;">Service</th>
              <th style="text-align: right; padding: 8px 0; color: #475569;">Fee</th>
            </tr>
          </thead>
          <tbody>
            ${servicesWithPrices.map(s => `
              <tr style="border-bottom: 1px dashed #e2e8f0;">
                <td style="padding: 10px 0;">${s.name}</td>
                <td style="text-align: right; padding: 10px 0;">${formatCurrency(s.price)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 15px 0; font-weight: bold; font-size: 16px;">Total Amount:</td>
              <td style="text-align: right; padding: 15px 0; font-weight: bold; font-size: 16px; color: #ef4444;">${formatCurrency(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="text-align: center; font-size: 12px; color: #94a3b8; font-style: italic;">Please proceed to the cashier to complete the payment.<br/>Thank you!</p>
      </div>
    `;

    Swal.fire({
      title: '',
      html: billHtml,
      width: '450px',
      showCancelButton: true,
      confirmButtonText: '🖨️ Print Bill',
      cancelButtonText: 'Close',
      confirmButtonColor: '#3b82f6'
    }).then(res => {
      if (res.isConfirmed) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head><title>Print Bill</title></head>
            <body style="padding: 20px;" onload="window.print(); window.close();">
              ${billHtml}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    });
  };

  if (loading) {
    return (
      <div className="role-dashboard-shell work-dashboard">
        <RoleTopNav role="doctor" />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading doctor data. Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell work-dashboard">
      <RoleTopNav role="doctor" />

      <div className="dashboard-layout" style={{ maxWidth: '100%', padding: '24px 40px' }}>
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar" style={{ fontSize: '40px', width: '80px', height: '80px' }}>🩺</div>
            <h4 style={{ fontSize: '20px', fontWeight: 'bold' }}>Dr. {removeVietnameseTones(currentUser?.displayName || 'Doctor')}</h4>
            <p className="p-card-number" style={{ fontSize: '16px' }}>{translateSpecialty(doctor?.specialization || 'Clinic doctor')}</p>
          </div>
          <nav className="sidebar-nav">
            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => { setActiveTab('appointments'); setActiveAppt(null); setActiveRecordForPrescription(null); }}
              className={activeTab === 'appointments' ? 'active' : ''}
            >
              📋 Patient list
            </button>

            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => { setActiveTab('history'); setActiveAppt(null); setActiveRecordForPrescription(null); }}
              className={activeTab === 'history' ? 'active' : ''}
            >
              📚 Medical history
            </button>
            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => { setActiveTab('schedule'); setActiveAppt(null); setActiveRecordForPrescription(null); }}
              className={activeTab === 'schedule' ? 'active' : ''}
            >
              📅 Work schedule
            </button>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Appointments Queue */}
          {activeTab === 'appointments' && !activeAppt && (
              <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2>{isDefaultView ? 'Patients to examine' : `Exam History`}</h2>
                </div>
                 <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search name or phone..." 
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px', width: '220px' }}
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>From:</label>
                    <input 
                      type="date" 
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px' }}
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>To:</label>
                    <input 
                      type="date" 
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px' }}
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="table-responsive" style={{ minHeight: '250px', maxHeight: '600px', overflowY: 'auto', width: '100%' }}>
                <table className="custom-table" style={{ fontSize: '18px', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '16px', padding: '14px 10px' }}>Patient</th>
                      {!isDefaultView && <th style={{ fontSize: '16px', padding: '14px 10px' }}>Date</th>}
                      <th style={{ fontSize: '16px', padding: '14px 10px' }}>Time</th>
                      <th style={{ fontSize: '16px', padding: '14px 10px' }}>Phone</th>
                      <th style={{ fontSize: '16px', padding: '14px 10px' }}>Status</th>
                      <th style={{ fontSize: '16px', padding: '14px 10px', textAlign: 'center' }}>Prescribe</th>
                      <th style={{ fontSize: '16px', padding: '14px 10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '120px 20px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#64748b', background: '#f8fafc' }}>
                          No patients in today's examination list.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt) => (
                          <tr key={appt._id}>
                            <td style={{ padding: '16px 10px' }}>
                              <strong style={{ fontSize: '20px' }}>{appt.patientId?.fullName}</strong><br />
                              <small className="text-muted" style={{ fontSize: '15px', marginTop: '6px' }}>DOB: {appt.patientId?.dateOfBirth ? new Date(appt.patientId.dateOfBirth).toLocaleDateString('en-GB') : ''} | Gender: {appt.patientId?.gender}</small>
                            </td>
                            {!isDefaultView && <td style={{ padding: '16px 10px', fontSize: '18px' }}>{new Date(appt.requestedDate).toLocaleDateString('en-GB')}</td>}
                            <td style={{ padding: '16px 10px', fontSize: '18px' }}>{appt.requestedTime}</td>
                            <td style={{ padding: '16px 10px', fontSize: '18px' }}>{appt.patientId?.phoneNumber}</td>
                            <td style={{ padding: '16px 10px' }}>
                              <span className={`badge ${appt.status === 'Completed' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                                {appt.status === 'Completed' ? 'Examined' : 'Waiting'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                              {getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '8px', border: '1px solid #3b82f6', color: '#3b82f6', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  onClick={() => handleOpenPrescription(appt._id)}
                                >
                                  💊 Prescriptions
                                </button>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '15px', whiteSpace: 'nowrap' }}>Not examined yet</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 10px' }}>
                              {appt.status === 'Confirmed' && !getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '10px 16px', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  🩺 Start exam
                                </button>
                              ) : appt.status === 'Confirmed' && getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: '10px 16px', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  ✏️ Update
                                </button>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                                  <span className="text-muted" style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>Record saved</span>
                                  <button
                                    className="btn"
                                    style={{ padding: '8px 14px', fontSize: '14px', fontWeight: 'bold', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    onClick={() => handleSelectAppointment(appt)}
                                  >
                                    👁️ View
                                  </button>
                                  <button
                                    className="btn"
                                    style={{ padding: '8px 14px', fontSize: '14px', fontWeight: 'bold', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    onClick={() => handlePrintBill(appt)}
                                  >
                                    🖨️ Print
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Examination workspace */}
          {activeTab === 'appointments' && activeAppt && (
            <div className="exam-workspace-container">
              <div className="workspace-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveAppt(null)}>
                  ⬅️ Back to list
                </button>
                <h2>Examination room: {activeAppt.patientId?.fullName}</h2>
                <span className="badge badge-primary">Record no.: {activeAppt.patientId?._id?.substring(18)}</span>
              </div>

              <div className="exam-panels-grid">
                {/* Left Panel: Historical EHR records */}
                <div className="exam-panel panel-left">
                  <h3>Patient medical history</h3>
                  {patientHistory.length === 0 ? (
                    <p className="empty-text">This patient has no medical history in the system yet.</p>
                  ) : (
                    <div className="history-timeline">
                      {patientHistory.map((rec) => (
                        <div className="history-card" key={rec._id}>
                          <div className="h-card-header" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            <span>📅 {new Date(rec.createdAt).toLocaleDateString('en-US')}</span>
                            <span>Examined by: Dr. {rec.doctorId?.fullName}</span>
                          </div>
                          <div className="h-card-body" style={{ fontSize: '16px' }}>
                            <p style={{ fontSize: '18px', marginBottom: '8px' }}><strong>Diagnosis:</strong> <span className="diagnosis-highlight">{rec.diagnosis}</span></p>
                            {rec.clinicalNotes && <p style={{ fontSize: '16px', marginBottom: '8px' }}><strong>Notes:</strong> {rec.clinicalNotes}</p>}
                            <div className="h-card-vitals" style={{ fontSize: '16px', color: '#4b5563' }}>
                              {rec.bloodPressure && <span>BP: {rec.bloodPressure} | </span>}
                              {rec.heartRate && <span>Heart rate: {rec.heartRate} bpm | </span>}
                              {rec.temperature && <span>Temp: {rec.temperature}°C</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Panel: Exam Form */}
                <div className="exam-panel panel-right">
                  <form onSubmit={handleSubmitExamination}>
                    <h3>
                      {getRecordForAppointment(activeAppt._id)
                        ? 'Update current medical record'
                        : 'Create medical record'}
                    </h3>
                    
                    {/* Vitals inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '15px' }}>
                      <div className="form-group-sm" style={{ margin: 0 }}>
                        <label style={{ fontSize: '15px', fontWeight: 'bold' }}>Height (cm)</label>
                        <input type="number" placeholder="170" value={examForm.height} onChange={(e) => setExamForm({ ...examForm, height: e.target.value })} style={{ padding: '10px', fontSize: '16px' }} />
                      </div>
                      <div className="form-group-sm" style={{ margin: 0 }}>
                        <label style={{ fontSize: '15px', fontWeight: 'bold' }}>Weight (kg)</label>
                        <input type="number" placeholder="65" value={examForm.weight} onChange={(e) => setExamForm({ ...examForm, weight: e.target.value })} style={{ padding: '10px', fontSize: '16px' }} />
                      </div>
                      <div className="form-group-sm" style={{ margin: 0 }}>
                        <label style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626' }}>BP (mmHg) *</label>
                        <input type="text" placeholder="120/80" value={examForm.bloodPressure} onChange={(e) => setExamForm({ ...examForm, bloodPressure: e.target.value })} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #fca5a5' }} />
                      </div>
                      <div className="form-group-sm" style={{ margin: 0 }}>
                        <label style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626' }}>HR (bpm) *</label>
                        <input type="number" placeholder="75" value={examForm.heartRate} onChange={(e) => setExamForm({ ...examForm, heartRate: e.target.value })} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #fca5a5' }} />
                      </div>
                      <div className="form-group-sm" style={{ margin: 0 }}>
                        <label style={{ fontSize: '15px', fontWeight: 'bold' }}>Temp (°C)</label>
                        <input type="number" step="0.1" placeholder="36.5" value={examForm.temperature} onChange={(e) => setExamForm({ ...examForm, temperature: e.target.value })} style={{ padding: '10px', fontSize: '16px' }} />
                      </div>
                    </div>

                    {/* Clinical Services */}
                    <div className="form-group" style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ marginBottom: '12px', display: 'block', fontWeight: 'bold', fontSize: '16px' }}>Clinical Services</label>
                      <button 
                        type="button" 
                        onClick={() => setShowServicesModal(true)}
                        style={{ padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        🔬 + Order Medical Services
                      </button>
                      {examForm.clinicalServices?.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {examForm.clinicalServices.map(srv => (
                            <span key={srv} style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                              ✓ {srv}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Diagnosis */}
                    <div className="form-group">
                      <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Diagnosis *</label>
                      <input
                        type="text"
                        style={{ padding: '12px', fontSize: '16px' }}
                        placeholder="e.g., Hypertension, Heart Failure, Type 2 Diabetes..."
                        value={examForm.diagnosis}
                        onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Doctor's notes / Treatment plan</label>
                      <textarea
                        rows="4"
                        style={{ padding: '12px', fontSize: '16px' }}
                        placeholder="e.g., Low-salt diet, restrict fluids, re-examine in 4 weeks, follow up at specialized clinic..."
                        value={examForm.clinicalNotes}
                        onChange={(e) => setExamForm({ ...examForm, clinicalNotes: e.target.value })}
                      />
                    </div>

                    <div className="form-actions" style={{ marginTop: 20 }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setActiveAppt(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Processing...' : '💾 Complete Examination'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}



          {/* Tab: Medical Records Lookup */}
          {activeTab === 'history' && (
            <div className="dashboard-card">
              <h2>My Patients' MRecords history</h2>
              <p className="subtitle">Search and review recent diagnoses and prescriptions from your examinations.</p>

              {medicalRecords.filter(r => doctor && ((r.doctorId?._id || r.doctorId) === (doctor._id || doctor.id))).length === 0 ? (
                <div className="empty-state">
                  <p>You haven't examined any patients yet.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '18px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>Patient</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>Record date</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>DIAGNOSIS</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>Clinical Services</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalRecords.filter(r => doctor && ((r.doctorId?._id || r.doctorId) === (doctor._id || doctor.id))).map((rec) => {
                        let servicesStr = 'None';
                        if (rec.clinicalNotes && rec.clinicalNotes.includes('[Ordered Services:')) {
                          const match = rec.clinicalNotes.match(/\[Ordered Services: (.*?)\]/);
                          if (match) servicesStr = match[1];
                        }
                        return (
                        <tr key={rec._id}>
                          <td style={{ padding: '24px' }}>
                            <strong style={{ fontSize: '20px' }}>{rec.patientId?.fullName}</strong><br />
                            <small className="text-muted" style={{ fontSize: '15px', marginTop: '6px' }}>ID: {rec.patientId?.identityCard} | Phone: {rec.patientId?.phoneNumber}</small>
                          </td>
                          <td style={{ padding: '24px', fontSize: '18px' }}>{new Date(rec.createdAt).toLocaleDateString('en-US')}</td>
                          <td className="font-bold text-danger" style={{ padding: '24px', fontSize: '18px' }}>{rec.diagnosis}</td>
                          <td style={{ padding: '24px', fontSize: '18px', maxWidth: '350px' }}>
                            <span className="badge badge-info" style={{ fontSize: '15px', padding: '8px 12px', whiteSpace: 'normal', display: 'inline-block', textAlign: 'left', lineHeight: '1.5' }}>
                              {servicesStr}
                            </span>
                          </td>
                          <td style={{ padding: '24px' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '8px 16px', fontSize: '15px', fontWeight: 'bold' }}
                              onClick={() => {
                                clinicalAPI.getPrescriptions(rec._id)
                                  .then((res) => {
                                    let srvs = '';
                                    let notes = rec.clinicalNotes || 'None';
                                    if (notes.includes('[Ordered Services:')) {
                                      const match = notes.match(/\[Ordered Services: (.*?)\]/);
                                      if (match) {
                                        srvs = match[1];
                                        notes = notes.replace(match[0], '').trim();
                                      }
                                    }

                                    Swal.fire({
                                      title: 'Medical record details',
                                      width: '850px',
                                      html: `
                                        <div style="text-align: left; font-size: 18px; line-height: 1.8; padding: 10px;">
                                          <p style="margin-bottom: 12px; font-size: 20px;"><strong>Doctor:</strong> ${removeVietnameseTones(rec.doctorId?.fullName || doctor?.fullName || 'N/A')}</p>
                                          <p style="margin-bottom: 12px; font-size: 20px;"><strong>Specialty:</strong> ${translateSpecialty(rec.doctorId?.specialization || doctor?.specialization || 'Clinic doctor')}</p>
                                          <p style="margin-bottom: 12px; font-size: 20px;"><strong>Patient:</strong> ${rec.patientId?.fullName || 'N/A'}</p>
                                          <p style="margin-bottom: 12px;"><strong>Diagnosis:</strong> <span style="color: #ef4444; font-weight: bold; font-size: 20px;">${rec.diagnosis || 'None'}</span></p>
                                          <p style="margin-bottom: 12px;"><strong>Vital signs:</strong> Height: ${rec.height || '--'} cm | Weight: ${rec.weight || '--'} kg | BP: <span style="color: #ef4444">${rec.bloodPressure || '--'} mmHg</span> | HR: <span style="color: #ef4444">${rec.heartRate || '--'} bpm</span> | Temp: ${rec.temperature || '--'} °C</p>
                                          ${srvs ? '<p style="margin-bottom: 12px;"><strong>Clinical Services:</strong> <span style="color: #3b82f6;">' + srvs + '</span></p>' : ''}
                                          <p style="margin-bottom: 12px;"><strong>Treatment Plan / Notes:</strong> ${notes || 'None'}</p>
                                          <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;">
                                          <p style="margin-bottom: 12px; font-size: 20px; font-weight: bold; color: #0f172a;">PRESCRIPTION DETAILS:</p>
                                          <ul style="padding-left: 25px; margin: 0; font-size: 18px;">
                                            ${res.data.data.length === 0
                                              ? '<li>No medication prescribed</li>'
                                              : res.data.data.map(p => `<li style="margin-bottom: 8px;"><strong>${p.medicineId?.medicineName || p.medicineId?.name || 'Medicine'}</strong>: ${p.quantity} units (${p.dosage} - ${p.frequency} - for ${p.durationDays} days)</li>`).join('')
                                            }
                                          </ul>
                                        </div>
                                      `,
                                      icon: 'info',
                                      showCancelButton: true,
                                      confirmButtonText: '<span style="font-size: 18px; padding: 4px 8px;">Print Prescription</span>',
                                      confirmButtonColor: '#3b82f6',
                                      cancelButtonText: '<span style="font-size: 18px; padding: 4px 8px;">Close</span>',
                                      cancelButtonColor: '#94a3b8'
                                    }).then((result) => {
                                      if (result.isConfirmed) {
                                        if (res.data.data.length === 0) {
                                          Swal.fire('Info', 'No prescription to print', 'info');
                                          return;
                                        }
                                        setPrintData({
                                          date: new Date(rec.createdAt),
                                          appointment: rec.appointmentId,
                                          patient: rec.patientId,
                                          diagnosis: rec.diagnosis,
                                          clinicalNotes: rec.clinicalNotes,
                                          medicines: res.data.data.map(p => ({
                                            name: p.medicineId?.medicineName || p.medicineId?.name,
                                            dosageForm: p.medicineId?.unit || p.medicineId?.dosageForm,
                                            quantity: p.quantity,
                                            dosage: p.dosage,
                                            frequency: p.frequency,
                                            durationDays: p.durationDays,
                                            specialInstructions: p.specialInstructions
                                          })),
                                          doctor: rec.doctorId
                                        });
                                      }
                                    });
                                  })
                                  .catch(console.error);
                              }}
                            >
                              Quick view
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Doctor Schedules */}
          {activeTab === 'schedule' && (() => {
            const myAppts = appointments.filter(a => 
              (a.doctorId?._id === doctor?.id) || (a.doctorId === doctor?.id) || 
              (a.doctorId?._id === doctor?._id) || (a.doctorId === doctor?._id)
            );
            const apptDates1 = {};
            const apptDates2 = {};
            const apptDates3 = {};
            const apptDates4 = {};
            myAppts.forEach(a => {
              if (a.status !== 'Cancelled') {
                const d = new Date(a.requestedDate);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dStr = `${yyyy}-${mm}-${dd}`;
                
                const timeStr = a.requestedTime || '08:00';
                const timeParts = timeStr.split(':');
                const minutes = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1] || '0', 10);
                
                if (minutes < 10 * 60) {
                  apptDates1[dStr] = (apptDates1[dStr] || 0) + 1;
                } else if (minutes < 12 * 60) {
                  apptDates2[dStr] = (apptDates2[dStr] || 0) + 1;
                } else if (minutes < 15 * 60 + 30) {
                  apptDates3[dStr] = (apptDates3[dStr] || 0) + 1;
                } else {
                  apptDates4[dStr] = (apptDates4[dStr] || 0) + 1;
                }
              }
            });

            const augmentedSchedules = [...schedules];
            const allDates = Array.from(new Set([...Object.keys(apptDates1), ...Object.keys(apptDates2), ...Object.keys(apptDates3), ...Object.keys(apptDates4)]));
            
            const expectedShifts = [
              { startTime: '08:00', endTime: '10:00', label: '_1', bookedCount: apptDates1 },
              { startTime: '10:00', endTime: '12:00', label: '_2', bookedCount: apptDates2 },
              { startTime: '13:30', endTime: '15:30', label: '_3', bookedCount: apptDates3 },
              { startTime: '15:30', endTime: '17:30', label: '_4', bookedCount: apptDates4 }
            ];

            allDates.forEach(dStr => {
               expectedShifts.forEach(shift => {
                 const exists = augmentedSchedules.some(s => {
                    const sd = new Date(s.workDate);
                    const sDateStr = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}`;
                    return sDateStr === dStr && s.startTime === shift.startTime;
                 });
                 if (!exists) {
                    augmentedSchedules.push({
                       _id: 'virtual_' + dStr + shift.label,
                       workDate: new Date(dStr + 'T00:00:00Z').toISOString(),
                       startTime: shift.startTime,
                       endTime: shift.endTime,
                       maxPatients: 5,
                       currentBooked: shift.bookedCount[dStr] || 0,
                       status: 'Available'
                    });
                 }
               });
            });

            augmentedSchedules.sort((a,b) => new Date(a.workDate) - new Date(b.workDate));

            let filteredSchedules = scheduleFilterDate 
              ? augmentedSchedules.filter(s => {
                  const d = new Date(s.workDate);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  const localDateStr = `${yyyy}-${mm}-${dd}`;
                  return localDateStr === scheduleFilterDate;
                })
              : augmentedSchedules;
              
            if (scheduleFilterDate) {
               expectedShifts.forEach(shift => {
                 const exists = filteredSchedules.some(s => s.startTime === shift.startTime);
                 if (!exists) {
                    filteredSchedules.push({
                       _id: 'virtual_' + scheduleFilterDate + shift.label,
                       workDate: new Date(scheduleFilterDate + 'T00:00:00Z').toISOString(),
                       startTime: shift.startTime,
                       endTime: shift.endTime,
                       maxPatients: 5,
                       currentBooked: 0,
                       status: 'Available'
                    });
                 }
               });
               filteredSchedules.sort((a,b) => {
                 const timeA = a.startTime.split(':').map(Number);
                 const timeB = b.startTime.split(':').map(Number);
                 return (timeA[0]*60 + timeA[1]) - (timeB[0]*60 + timeB[1]);
               });
            }
            
            return (
              <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2>My work schedule</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Work Date:</label>
                    <input 
                      type="date" 
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '15px' }}
                      value={scheduleFilterDate}
                      onChange={(e) => setScheduleFilterDate(e.target.value)}
                    />
                  </div>
                </div>

                {filteredSchedules.length === 0 ? (
                  <div className="empty-state">
                    <p>No shifts found for the selected date.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table" style={{ fontSize: '18px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>WORK DATE</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>START TIME</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>END TIME</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>PATIENT LIMIT</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>BOOKED</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>SHIFT STATUS</th>
                        <th style={{ fontSize: '16px', padding: '18px 24px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.map((s) => (
                        <tr key={s._id}>
                          <td style={{ padding: '16px 24px' }} className="font-bold">{new Date(s.workDate).toLocaleDateString('en-US')}</td>
                          <td style={{ padding: '16px 24px' }}>{s.startTime}</td>
                          <td style={{ padding: '16px 24px' }}>{s.endTime}</td>
                          <td style={{ padding: '16px 24px' }}>{s.maxPatients} patients</td>
                          <td style={{ padding: '16px 24px' }}>
                            <strong>{s.currentBooked}</strong> / {s.maxPatients}
                            <div className="progress-bar-container" style={{ marginTop: '8px', height: '8px' }}>
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${Math.min(100, (s.currentBooked / s.maxPatients) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span className={`badge ${s.status === 'Available' ? 'badge-success' : s.status === 'Blocked' ? 'badge-secondary' : 'badge-danger'}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                              {s.status === 'Available' ? 'Active' : s.status === 'Blocked' ? `Blocked: ${s.blockReason || 'No reason'}` : 'Paused / Full'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                              {s.currentBooked > 0 ? (
                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#2563eb' }}>Patients booked</span>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280' }}>No patients</span>
                              )}
                              
                              {s.status === 'Available' && (
                                <button className="btn" style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '100%' }} onClick={() => handleBlockSlot(s)}>
                                  Block this slot
                                </button>
                              )}
                              {s.status === 'Blocked' && (
                                <button className="btn" style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', width: '100%' }} onClick={() => handleUnblockSlot(s)}>
                                  Unblock this slot
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
          })()}
        </main>
      </div>

      {/* Print Prescription Modal */}
      {printData && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>Prescription completed — Ready to print</h3>
              <button className="close-btn" onClick={() => setPrintData(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div id="prescription-print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.6, color: '#111' }}>
                {/* Clinic header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0066cc', paddingBottom: 12, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0066cc' }}>HOPSONTAI GENERAL CLINIC</div>
                  <div style={{ fontSize: 11, color: '#555' }}>123 Hop Son Street, Hai Ba Trung District, Hanoi | Hotline: 1900 6868</div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8, letterSpacing: 2 }}>PRESCRIPTION</div>
                  <div style={{ fontSize: 11, color: '#555' }}>Date: {printData.date.toLocaleDateString('en-US')} — Record no.: {printData.appointment?._id?.slice(-8).toUpperCase()}</div>
                </div>

                {/* Patient info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: 14, padding: '10px 0', borderBottom: '1px solid #ddd' }}>
                  <div><strong>Full name:</strong> {printData.patient?.fullName}</div>
                  <div><strong>Date of birth:</strong> {printData.patient?.dateOfBirth ? new Date(printData.patient.dateOfBirth).toLocaleDateString('en-US') : '--'}</div>
                  <div><strong>Gender:</strong> {printData.patient?.gender}</div>
                  <div><strong>Phone:</strong> {printData.patient?.phoneNumber}</div>
                  <div style={{ gridColumn: '1/-1' }}><strong>Address:</strong> {printData.patient?.address || '--'}</div>
                </div>

                {/* Diagnosis */}
                <div style={{ marginBottom: 14, padding: '8px 12px', background: '#f0f7ff', borderLeft: '4px solid #0066cc', borderRadius: 4 }}>
                  <strong>Diagnosis:</strong> {printData.diagnosis}
                  {printData.clinicalNotes && <div style={{ marginTop: 4, fontSize: 12, color: '#333' }}><strong>Notes:</strong> {printData.clinicalNotes}</div>}
                </div>

                {/* Medicine table */}
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Medication list:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#e8f0fe' }}>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>STT</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Medicine</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center' }}>Route</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center' }}>SL</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.medicines.map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 600 }}>{m.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.dosageForm || 'Oral'}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.quantity}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{m.dosage} — {m.frequency} — {m.durationDays} days ({m.specialInstructions})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingRight: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#555' }}>{printData.date.toLocaleDateString('en-US')}</div>
                    <div style={{ fontWeight: 700 }}>Examining doctor</div>
                    <div style={{ marginTop: 48, fontWeight: 600 }}>Dr. {printData.doctor?.fullName || printData.doctor?.displayName}</div>
                  </div>
                </div>

                <div style={{ marginTop: 20, fontSize: 11, color: '#888', borderTop: '1px solid #ddd', paddingTop: 8 }}>
                  * This prescription is valid for 5 days from the date of issue. Please bring it to the cashier to pay and collect your medication.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPrintData(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const content = document.getElementById('prescription-print-area').innerHTML;
                  const w = window.open('', '_blank');
                  w.document.write(`<html><head><title>Prescription</title><style>body{margin:24px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style></head><body>${content}</body></html>`);
                  w.document.close();
                  w.print();
                }}
              >
                Print prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription UI Modal */}
      {activeRecordForPrescription && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="modal-content" style={{ width: '900px', maxWidth: '95vw', background: '#fff', borderRadius: '12px', padding: '0', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '22px' }}>Đơn thuốc - {activeRecordForPrescription.patientId?.fullName}</h3>
              <button onClick={() => setActiveRecordForPrescription(null)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', padding: '20px', gap: '30px', overflowY: 'auto' }}>
              {/* Left Side: Search and Add Medicine */}
              <div style={{ flex: '1 1 50%' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>🔍 Chọn thuốc</h4>
                <input 
                  type="text" 
                  placeholder="Nhập tên thuốc để tìm..." 
                  value={medSearch} 
                  onChange={e => setMedSearch(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px', fontSize: '15px' }} 
                />
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '20px' }}>
                  {filteredMeds.length === 0 ? (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#888' }}>Không tìm thấy thuốc</div>
                  ) : (
                    filteredMeds.map(m => (
                      <div 
                        key={m._id} 
                        style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: selectedMed?._id === m._id ? '#e0f2fe' : '#fff', transition: 'background 0.2s' }} 
                        onClick={() => setSelectedMed(m)}
                      >
                        <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>{m.medicineName || m.name}</strong>
                        <small style={{ color: '#64748b' }}>Đóng gói: {m.unit || m.dosageForm} | Tồn kho: {m.stockQuantity}</small>
                      </div>
                    ))
                  )}
                </div>

                {selectedMed ? (
                  <form onSubmit={handleAddPrescription} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h5 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>Kê đơn: {selectedMed.medicineName || selectedMed.name}</h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Số lượng</label>
                        <input type="number" value={medForm.quantity} onChange={e => setMedForm({...medForm, quantity: e.target.value})} min="1" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Số ngày uống</label>
                        <input type="number" value={medForm.durationDays} onChange={e => setMedForm({...medForm, durationDays: e.target.value})} min="1" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Liều dùng (mỗi lần)</label>
                        <input type="text" value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Tần suất</label>
                        <input type="text" value={medForm.frequency} onChange={e => setMedForm({...medForm, frequency: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Ghi chú (Ví dụ: sau ăn)</label>
                      <input type="text" value={medForm.specialInstructions} onChange={e => setMedForm({...medForm, specialInstructions: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                      ➕ Thêm vào đơn thuốc
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    Hãy chọn một loại thuốc ở danh sách trên để kê đơn.
                  </div>
                )}
              </div>

              {/* Right Side: Current Prescriptions */}
              <div style={{ flex: '1 1 50%', borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '20px', color: '#10b981' }}>📋 Đơn thuốc hiện tại</h4>
                
                {prescriptionItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Chưa có thuốc nào được kê cho bệnh nhân này.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {prescriptionItems.map(p => (
                      <div key={p._id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', position: 'relative' }}>
                        <button 
                          onClick={() => handleRemovePrescription(p._id)}
                          style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', padding: '0 5px' }}
                          title="Xóa thuốc này"
                        >
                          ✕
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: '25px' }}>
                          <strong style={{ fontSize: '16px', color: '#0f172a' }}>{p.medicineId?.medicineName || p.medicineId?.name}</strong>
                          <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '16px' }}>x{p.quantity}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span><span style={{ color: '#94a3b8' }}>Liều/Tần suất:</span> {p.dosage} - {p.frequency}</span>
                          <span><span style={{ color: '#94a3b8' }}>Thời gian uống:</span> {p.durationDays} ngày</span>
                          {p.specialInstructions && <span><span style={{ color: '#94a3b8' }}>Lưu ý:</span> {p.specialInstructions}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '10px 24px', fontSize: '16px', fontWeight: 'bold' }}
                onClick={handleSubmitPrescription}
                disabled={submitting}
              >
                {submitting ? '⏳ Submitting...' : '✅ Confirm Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {showServicesModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div className="modal-content" style={{ width: '500px', maxWidth: '90vw', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Order Medical Services</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px' }}>
              {availableServices.map(srv => (
                <label key={srv} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    checked={examForm.clinicalServices?.includes(srv) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExamForm({...examForm, clinicalServices: [...(examForm.clinicalServices || []), srv]});
                      } else {
                        setExamForm({...examForm, clinicalServices: (examForm.clinicalServices || []).filter(s => s !== srv)});
                      }
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '15px' }}>{srv}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => setShowServicesModal(false)} style={{ padding: '8px 24px' }}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

