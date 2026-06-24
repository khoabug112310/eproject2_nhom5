import React, { useState, useEffect, useMemo } from 'react';
import { schedulingAPI, profilesAPI, clinicalAPI, cmsAPI } from '../../services/api';
import Swal from 'sweetalert2';
import RoleTopNav from '../../components/RoleTopNav';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';

// ── helpers ───────────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const map = {
    Pending: 'status-pending',
    Confirmed: 'status-confirmed',
    Completed: 'status-completed',
    Canceled: 'status-canceled',
  };
  const labels = {
    Pending: 'Pending', Confirmed: 'Confirmed',
    Completed: 'Completed', Canceled: 'Canceled',
  };
  return <span className={`status-pill ${map[status] || ''}`}>{labels[status] || status}</span>;
}

function isIncompleteProfile(patient) {
  if (!patient) return true;
  const badDob = !patient.dateOfBirth || new Date(patient.dateOfBirth).getFullYear() <= 1905;
  const badCard = !patient.identityCard || patient.identityCard.startsWith('REG-') || patient.identityCard.startsWith('ADM-');
  const badName = !patient.fullName || patient.fullName === 'Khách hàng' || patient.fullName === 'Guest';
  return badDob || badCard || badName || !patient.address;
}

const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

const FILTERS = [
  { id: 'Pending', label: 'Pending' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'Completed', label: 'Completed' },
  { id: 'All', label: 'All' },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ msg: '', type: '' });

  const [filterStatus, setFilterStatus] = useState('Pending');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const yearsAgo = (years) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().slice(0, 10);
  };
  const minDobPrimary = yearsAgo(120);
  const maxDobPrimary = yearsAgo(14);

  // patient profile modal
  const [editingAppt, setEditingAppt] = useState(null);
  const [patientForm, setPatientForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'Nam',
    identityCard: '', phoneNumber: '', email: '', address: '',
    insuranceCode: '', emergencyContact: '',
    birthCertificate: '', personalId: '',
    birthCertificateImg: '', identityCardImg: ''
  });
  const [uploadingImg, setUploadingImg] = useState(false);

  // doctor schedule modal
  const [scheduleAppt, setScheduleAppt] = useState(null);
  const [apptDateFilter, setApptDateFilter] = useState('');

  // appointment detail drawer
  const [detailAppt, setDetailAppt] = useState(null);

  // Patient directory states
  const [activeView, setActiveView] = useState('appointments'); // 'appointments' | 'patients' | 'schedules'
  const [patients, setPatients] = useState({ normal: [], dependents: [], quickBooking: [] });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsTab, setPatientsTab] = useState('normal'); // 'normal' | 'dependents' | 'quick'
  const [patientSearch, setPatientSearch] = useState('');
  const [editingPatient, setEditingPatient] = useState(null);

  // Doctor schedules states
  const [schedulesList, setSchedulesList] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleDeptFilter, setScheduleDeptFilter] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthSearchVal, setMonthSearchVal] = useState(new Date().toISOString().slice(0, 7));

  const handleMonthSearchChange = (e) => {
    const val = e.target.value; // "YYYY-MM"
    setMonthSearchVal(val);
    if (val) {
      const [yr, mo] = val.split('-').map(Number);
      const parsed = new Date(yr, mo - 1, 1);
      if (!isNaN(parsed.getTime())) {
        setCurrentCalendarDate(parsed);
        setSelectedDate(parsed);
      }
    }
  };

  // Contact feedback states
  const [contactInquiries, setContactInquiries] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [expandedPhones, setExpandedPhones] = useState({});
  const [expandedDoctors, setExpandedDoctors] = useState({});
  const [expandedRosterShifts, setExpandedRosterShifts] = useState([]);

  const filteredSchedules = useMemo(() => {
    return schedulesList.filter(s => {
      const docName = s.doctorId?.fullName || '';
      const matchesSearch = !scheduleSearchQuery.trim() || docName.toLowerCase().includes(scheduleSearchQuery.toLowerCase().trim());

      const deptId = typeof s.doctorId?.departmentId === 'object' ? s.doctorId.departmentId?._id : s.doctorId?.departmentId;
      const matchesDept = !scheduleDeptFilter || deptId === scheduleDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [schedulesList, scheduleSearchQuery, scheduleDeptFilter]);

  const scheduleStats = useMemo(() => {
    let totalSlots = 0;
    let bookedSlots = 0;
    let availableCount = 0;
    let fullCount = 0;

    schedulesList.forEach(s => {
      totalSlots += s.maxPatients || 0;
      bookedSlots += s.currentBooked || 0;
      if (s.status === 'Available') {
        availableCount++;
      } else {
        fullCount++;
      }
    });

    return {
      totalSlots,
      bookedSlots,
      availableCount,
      fullCount,
    };
  }, [schedulesList]);

  // Walk-in modal states
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [depts, setDepts] = useState([]);
  const [docs, setDocs] = useState([]);
  const [allPatientsList, setAllPatientsList] = useState([]);
  const [walkInPatientSearch, setWalkInPatientSearch] = useState('');
  const [walkInForm, setWalkInForm] = useState({
    patientType: 'new',
    selectedPatientId: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    birthCertificate: '',
    personalId: '',
    birthCertificateImg: '',
    identityCardImg: '',
    insuranceCode: '',
    address: '',
    departmentId: '',
    doctorId: '',
    requestedDate: new Date().toISOString().slice(0, 10),
    requestedTime: '08:00',
    symptoms: '',
  });

  const filteredPatientsForDropdown = useMemo(() => {
    if (!walkInPatientSearch.trim()) return allPatientsList;
    const q = walkInPatientSearch.trim().toLowerCase();
    return allPatientsList.filter(p =>
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.phoneNumber || '').includes(q) ||
      (p.identityCard || '').toLowerCase().includes(q)
    );
  }, [allPatientsList, walkInPatientSearch]);

  // ── data ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (activeView === 'patients') {
      fetchPatients();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'schedules') {
      fetchSchedules();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'contacts') {
      fetchContactInquiries();
    }
  }, [activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await schedulingAPI.getAppointments();
      setAppointments(res.data?.data || []);
    } catch {
      setBanner({ msg: 'Failed to load appointments.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      const res = await profilesAPI.getPatients();
      setPatients(res.data?.data || { normal: [], dependents: [], quickBooking: [] });
    } catch {
      flash('Failed to load patient accounts.', 'danger');
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const [schedRes, deptRes] = await Promise.all([
        schedulingAPI.getAllDoctorSchedules(),
        schedulingAPI.getDepartments()
      ]);
      setSchedulesList(schedRes.data?.data || []);
      setDepts(deptRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      flash('Failed to load doctor schedules.', 'danger');
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchContactInquiries = async () => {
    try {
      setContactsLoading(true);
      const res = await cmsAPI.getContactInquiries();
      setContactInquiries(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching contact inquiries:', err);
      flash('Failed to load contact inquiries.', 'danger');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleResolveInquiry = async (id) => {
    const res = await Swal.fire({
      title: 'Resolve feedback?',
      text: 'Mark this contact inquiry as resolved?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Resolve',
      cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    setSubmitting(true);
    try {
      await cmsAPI.resolveContactInquiry(id);
      flash('Feedback resolved successfully.');
      fetchContactInquiries();
    } catch (err) {
      console.error('Error resolving inquiry:', err);
      flash(err?.response?.data?.message || 'Could not resolve feedback.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyInquiry = async (item) => {
    const templates = [
      {
        name: 'General Thank You & Feedback Acknowledgment',
        text: `Dear ${item.senderName || 'Valued Patient'},\n\nThank you for sharing your feedback with Hopsontai General Clinic. We have successfully received your message:\n"${item.message}"\n\nYour valuable comments have been forwarded to the clinic management team to help us improve our medical and care service quality in the future.\n\nShould you need any further information or immediate assistance, please feel free to reach out to our hotline at 1900 6868.\n\nBest regards,\nCustomer Care Team\nHopsontai General Clinic`
      },
      {
        name: 'Booking Issue Resolved',
        text: `Dear ${item.senderName || 'Valued Patient'},\n\nThank you for reaching out regarding the difficulty you experienced while booking an appointment online:\n"${item.message}"\n\nOur technical team has successfully resolved this issue. You can now log in and schedule your appointments online as usual.\n\nIf you still experience any issues, please call our hotline at 1900 6868 so our receptionists can assist you with your booking immediately.\n\nBest regards,\nCustomer Care Team\nHopsontai General Clinic`
      },
      {
        name: 'Service Quality Issue & Apology',
        text: `Dear ${item.senderName || 'Valued Patient'},\n\nHopsontai General Clinic sincerely regrets that your recent experience did not meet your expectations, as described in your message:\n"${item.message}"\n\nWe sincerely apologize for any inconvenience caused. Our management team has investigated the matter and taken appropriate corrective action with the respective department to prevent similar occurrences in the future.\n\nWe appreciate your understanding and hope to continue serving you with better healthcare experiences in your future visits.\n\nBest regards,\nCustomer Care Team\nHopsontai General Clinic`
      }
    ];

    const selectOptions = templates
      .map((t, idx) => `<option value="${idx}">${t.name}</option>`)
      .join('');

    const { value: formValues } = await Swal.fire({
      title: `Reply to ${item.senderName}`,
      html: `
        <div style="text-align: left; margin-bottom: 12px; font-family: inherit;">
          <p style="margin: 4px 0; font-size: 13.5px;"><strong>To:</strong> ${item.senderEmail}</p>
          <p style="margin: 4px 0 10px 0; font-size: 13.5px;"><strong>Inquiry Message:</strong></p>
          <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 13px; max-height: 80px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 15px; border: 1px solid #e2e8f0; color: #475569;">${item.message}</div>
          
          <label for="swal-template-select" style="font-weight: 600; display: block; margin-bottom: 6px; font-size: 13px;">Select Auto-Reply Template:</label>
          <select id="swal-template-select" style="width: 100%; box-sizing: border-box; margin: 0 0 15px 0; height: 38px; font-size: 13.5px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 0 10px; background: #fff;">
            ${selectOptions}
          </select>

          <label for="swal-reply-textarea" style="font-weight: 600; display: block; margin-bottom: 6px; font-size: 13px;">Response Content:</label>
          <textarea id="swal-reply-textarea" style="width: 100%; box-sizing: border-box; margin: 0; height: 160px; font-size: 13.5px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 10px; font-family: inherit; line-height: 1.5; resize: none; background: #fff;">${templates[0].text}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Send Reply',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        const select = document.getElementById('swal-template-select');
        const textarea = document.getElementById('swal-reply-textarea');
        if (select && textarea) {
          select.addEventListener('change', (e) => {
            const selectedIdx = e.target.value;
            textarea.value = templates[selectedIdx].text;
          });
        }
      },
      preConfirm: () => {
        const textarea = document.getElementById('swal-reply-textarea');
        const replyText = textarea ? textarea.value : '';
        if (!replyText || !replyText.trim()) {
          Swal.showValidationMessage('Vui lòng nhập nội dung trả lời / Reply message is required');
          return false;
        }
        return replyText.trim();
      }
    });

    if (!formValues) return;

    setSubmitting(true);
    try {
      await cmsAPI.replyContactInquiry(item._id, { replyMessage: formValues });
      flash('Reply sent successfully and feedback resolved.');
      fetchContactInquiries();
    } catch (err) {
      console.error('Error replying to inquiry:', err);
      flash(err?.response?.data?.message || 'Could not send reply.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const flash = (msg, type = 'success') => {
    setBanner({ msg, type });
    setTimeout(() => setBanner({ msg: '', type: '' }), 5000);
  };

  // ── derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    pending: appointments.filter(a => a.status === 'Pending').length,
    confirmedToday: appointments.filter(a => a.status === 'Confirmed' && isToday(a.requestedDate)).length,
    completedToday: appointments.filter(a => a.status === 'Completed' && isToday(a.requestedDate)).length,
    total: appointments.length,
  }), [appointments]);

  const filtered = useMemo(() => {
    let list = filterStatus === 'All' ? appointments : appointments.filter(a => a.status === filterStatus);

    // 1. Filter by Date Picker
    if (apptDateFilter) {
      list = list.filter(a => {
        const dStr = new Date(a.requestedDate).toISOString().split('T')[0];
        return dStr === apptDateFilter;
      });
    }

    // 2. Filter by text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => {
        const patientName = a.patientId?.fullName?.toLowerCase() || '';
        const phone = a.patientId?.phoneNumber || '';
        const deptName = a.departmentId?.departmentName?.toLowerCase() || '';
        const docName = a.doctorId?.fullName?.toLowerCase() || '';

        // Also support searching date via text search (e.g. "2026-06-23" or "Jun 23")
        const dateStr = new Date(a.requestedDate).toISOString().split('T')[0];
        const formattedDate = new Date(a.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();

        return patientName.includes(q) ||
          phone.includes(q) ||
          deptName.includes(q) ||
          docName.includes(q) ||
          dateStr.includes(q) ||
          formattedDate.includes(q);
      });
    }
    return list;
  }, [appointments, filterStatus, search, apptDateFilter]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleOpenWalkInModal = async () => {
    setWalkInPatientSearch('');
    setWalkInForm({
      patientType: 'new',
      selectedPatientId: '',
      fullName: '',
      phoneNumber: '',
      email: '',
      dateOfBirth: '',
      gender: 'Nam',
      identityCard: '',
      insuranceCode: '',
      address: '',
      departmentId: '',
      doctorId: '',
      requestedDate: new Date().toISOString().slice(0, 10),
      requestedTime: '08:00',
      symptoms: '',
    });
    setWalkInModalOpen(true);

    try {
      const [deptRes, docRes, patRes] = await Promise.all([
        schedulingAPI.getDepartments(),
        clinicalAPI.getDoctors(),
        profilesAPI.getPatients()
      ]);
      setDepts(deptRes.data?.data || []);
      setDocs(docRes.data?.data || []);

      const patData = patRes.data?.data || { normal: [], quickBooking: [] };
      const mergedList = [...patData.normal, ...patData.quickBooking];
      mergedList.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      setAllPatientsList(mergedList);
    } catch (err) {
      console.error('Error loading walk-in modal data:', err);
      flash('Failed to load initial data for walk-in booking.', 'danger');
    }
  };

  const handleWalkInPatientSelect = (patientId) => {
    if (!patientId) {
      setWalkInForm(prev => ({
        ...prev,
        selectedPatientId: '',
        fullName: '',
        phoneNumber: '',
        email: '',
        dateOfBirth: '',
        gender: 'Nam',
        identityCard: '',
        birthCertificate: '',
        personalId: '',
        birthCertificateImg: '',
        identityCardImg: '',
        insuranceCode: '',
        address: '',
      }));
      return;
    }

    const patient = allPatientsList.find(p => p._id === patientId);
    if (patient) {
      const dobStr = patient.dateOfBirth && new Date(patient.dateOfBirth).getFullYear() > 1905
        ? new Date(patient.dateOfBirth).toISOString().slice(0, 10)
        : '';

      const idCard = patient.identityCard && !patient.identityCard.startsWith('QUICK-') && !patient.identityCard.startsWith('REG-')
        ? patient.identityCard
        : '';

      setWalkInForm(prev => ({
        ...prev,
        selectedPatientId: patient._id,
        fullName: patient.fullName || '',
        phoneNumber: patient.phoneNumber || '',
        email: patient.email || '',
        dateOfBirth: dobStr,
        gender: patient.gender || 'Nam',
        identityCard: idCard,
        birthCertificate: patient.birthCertificate || '',
        personalId: patient.personalId || '',
        birthCertificateImg: patient.birthCertificateImg || '',
        identityCardImg: patient.identityCardImg || '',
        insuranceCode: patient.insuranceCode || '',
        address: patient.address || '',
      }));
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();

    const dobDate = new Date(walkInForm.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 0) {
      flash('Invalid date of birth.', 'danger');
      return;
    }
    if (age > 120) {
      flash('Patient age cannot exceed 120 years.', 'danger');
      return;
    }

    if (age < 15) {
      if (!walkInForm.birthCertificate?.trim() && !walkInForm.personalId?.trim()) {
        flash('Children under 15 years old must provide a Birth Certificate or a Personal Identification Code.', 'danger');
        return;
      }
    } else if (age >= 60) {
      if (!walkInForm.identityCard?.trim()) {
        flash('Elderly patients aged 60 and above must provide a National ID Card (CCCD/CMND).', 'danger');
        return;
      }
    }

    const phoneRegex = /^(84|0[3|5|7|8|9])([0-9]{8})$/;
    if (!phoneRegex.test(walkInForm.phoneNumber)) {
      flash('Invalid phone number. Please enter a valid Vietnamese phone number.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const patientPayload = {
        fullName: walkInForm.fullName,
        dateOfBirth: walkInForm.dateOfBirth,
        gender: walkInForm.gender,
        phoneNumber: walkInForm.phoneNumber,
        identityCard: walkInForm.identityCard || undefined,
        birthCertificate: walkInForm.birthCertificate || undefined,
        personalId: walkInForm.personalId || undefined,
        address: walkInForm.address,
        insuranceCode: walkInForm.insuranceCode || undefined,
        email: walkInForm.email || undefined,
        birthCertificateImg: walkInForm.birthCertificateImg || undefined,
        identityCardImg: walkInForm.identityCardImg || undefined,
      };

      const patRes = await profilesAPI.createPatientByStaff(patientPayload);
      const patient = patRes.data?.data;
      if (!patient || !patient._id) {
        throw new Error('Unable to register patient profile.');
      }

      const bookingPayload = {
        patientId: patient._id,
        departmentId: walkInForm.departmentId,
        doctorId: walkInForm.doctorId || undefined,
        requestedDate: walkInForm.requestedDate,
        requestedTime: walkInForm.requestedTime,
        symptoms: walkInForm.symptoms || 'Walk-in registration at counter',
      };

      const bookRes = await schedulingAPI.bookAppointment(bookingPayload);
      const appt = bookRes.data?.data;
      if (!appt || !appt._id) {
        throw new Error('Unable to book appointment.');
      }

      await schedulingAPI.updateAppointment(appt._id, { status: 'Confirmed' });

      flash('Direct counter registration completed successfully. Appointment confirmed!');
      setWalkInModalOpen(false);
      fetchData();
      fetchPatients();
    } catch (err) {
      console.error(err);
      flash(err?.response?.data?.message || err.message || 'An error occurred during registration.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (appt) => {
    const p = appt.patientId;
    setEditingAppt(appt);
    setPatientForm({
      fullName: p?.fullName || '',
      dateOfBirth: p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
      gender: p?.gender || 'Nam',
      identityCard: p?.identityCard || '',
      phoneNumber: p?.phoneNumber || '',
      email: p?.email || '',
      address: p?.address || '',
      insuranceCode: p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
      birthCertificate: p?.birthCertificate || '',
      personalId: p?.personalId || '',
      birthCertificateImg: p?.birthCertificateImg || '',
      identityCardImg: p?.identityCardImg || '',
    });
  };

  const handleOpenPatientEdit = (p) => {
    setEditingPatient(p);
    setPatientForm({
      fullName: p?.fullName || '',
      dateOfBirth: p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
      gender: p?.gender || 'Nam',
      identityCard: p?.identityCard || '',
      phoneNumber: p?.phoneNumber || '',
      email: p?.email || '',
      address: p?.address || '',
      insuranceCode: p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
      birthCertificate: p?.birthCertificate || '',
      personalId: p?.personalId || '',
      birthCertificateImg: p?.birthCertificateImg || '',
      identityCardImg: p?.identityCardImg || '',
    });
  };

  const handlePatientFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select a valid image file.' });
      return;
    }

    setUploadingImg(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await cmsAPI.uploadImage(base64Data);
        const url = res.data?.data?.url;
        if (url) {
          setPatientForm(prev => ({ ...prev, [fieldName]: url }));
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Upload failed. Please try again.' });
      } finally {
        setUploadingImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWalkInFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select a valid image file.' });
      return;
    }

    setUploadingImg(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        const res = await cmsAPI.uploadImage(base64Data);
        const url = res.data?.data?.url;
        if (url) {
          setWalkInForm(prev => ({ ...prev, [fieldName]: url }));
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: 'Upload failed. Please try again.' });
      } finally {
        setUploadingImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePatientDirect = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;

    // Check age limits
    const dobDate = new Date(patientForm.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 15) {
      if (!patientForm.birthCertificate?.trim() && !patientForm.personalId?.trim()) {
        flash('Children under 15 years old require a Birth Certificate or Personal ID Code.', 'danger');
        return;
      }
    } else if (age >= 60) {
      if (!patientForm.identityCard?.trim()) {
        flash('Elderly patients aged 60 or above are required to provide a National ID.', 'danger');
        return;
      }
    } else {
      if (age > 120) {
        flash('Patient age cannot exceed 120 years.', 'danger');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...patientForm };
      if (!payload.insuranceCode?.trim()) delete payload.insuranceCode;
      if (!payload.email?.trim()) delete payload.email;
      await profilesAPI.updateUser(editingPatient._id, payload);
      flash('Patient profile updated successfully.');
      setEditingPatient(null);
      fetchPatients();
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not update profile.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAndConfirm = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;

    // Check age limit
    const dobDate = new Date(patientForm.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 15) {
      if (!patientForm.birthCertificate?.trim() && !patientForm.personalId?.trim()) {
        flash('Children under 15 years old require a Birth Certificate or Personal ID Code.', 'danger');
        return;
      }
    } else if (age >= 60) {
      if (!patientForm.identityCard?.trim()) {
        flash('Elderly patients aged 60 or above are required to provide a National ID.', 'danger');
        return;
      }
    } else {
      if (age > 120) {
        flash('Patient age cannot exceed 120 years.', 'danger');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...patientForm };
      if (!payload.insuranceCode?.trim()) delete payload.insuranceCode;
      if (!payload.email?.trim()) delete payload.email;
      await profilesAPI.updateUser(editingAppt.patientId._id, payload);
      await schedulingAPI.updateAppointment(editingAppt._id, { status: 'Confirmed' });
      flash('Patient profile updated and appointment confirmed.');
      setEditingAppt(null);
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not confirm appointment.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (appt) => {
    if (!appt.doctorId) {
      setScheduleAppt(appt);
      return;
    }
    const res = await Swal.fire({
      title: 'Confirm appointment?',
      text: `Patient: ${appt.patientId?.fullName || '—'}. A consultation invoice will be created automatically.`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#0d9488', cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm', cancelButtonText: 'Cancel',
    });
    if (!res.isConfirmed) return;
    setSubmitting(true);
    try {
      await schedulingAPI.updateAppointment(appt._id, { status: 'Confirmed' });
      flash('Appointment confirmed. Consultation invoice created.');
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not confirm.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (appt) => {
    const res = await Swal.fire({
      title: 'Cancel appointment?',
      text: `Patient: ${appt.patientId?.fullName || '—'}`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, cancel', cancelButtonText: 'Keep',
    });
    if (!res.isConfirmed) return;
    setSubmitting(true);
    try {
      await schedulingAPI.updateAppointment(appt._id, { status: 'Canceled' });
      flash('Appointment cancelled.');
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not cancel.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAttendance = async (apptId, attendanceValue) => {
    setSubmitting(true);
    try {
      await schedulingAPI.updateAppointment(apptId, { attendance: attendanceValue });
      flash(`Attendance status updated to ${attendanceValue}.`);
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not update attendance status.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoctorConfirm = async (reassignPayload) => {
    if (!scheduleAppt) return;
    setSubmitting(true);
    try {
      await schedulingAPI.updateAppointment(scheduleAppt._id, {
        ...reassignPayload,
        status: 'Confirmed'
      });
      flash('Appointment successfully transferred and confirmed.');
      setScheduleAppt(null);
      fetchData();
    } catch (err) {
      flash(err?.response?.data?.message || 'Could not update appointment.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  // ── loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="role-dashboard-shell">
        <RoleTopNav role="staff" />
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Loading appointment queue…</p>
        </div>
      </div>
    );
  }

  const selectedDeptObj = depts.find(d => d._id === walkInForm.departmentId);
  const selectedDeptName = selectedDeptObj ? (selectedDeptObj.departmentName || selectedDeptObj.name) : '';
  const filteredDoctors = docs.filter(doc => {
    if (!walkInForm.departmentId) return false;
    return doc.department === selectedDeptName;
  });

  const getAgeFromFormDob = () => {
    if (!patientForm.dateOfBirth) return 30;
    const dobDate = new Date(patientForm.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age;
  };
  const formAge = getAgeFromFormDob();

  const getAgeFromWalkInDob = () => {
    if (!walkInForm.dateOfBirth) return 30;
    const dobDate = new Date(walkInForm.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age;
  };
  const walkInAge = getAgeFromWalkInDob();

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="staff" />

      <div className="dashboard-layout">

        {/* ── Sidebar ── */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar" style={{ fontSize: 22 }}>CS</div>
            <h4>Customer Care</h4>
            <p className="p-card-number">Reception &amp; Coordination</p>
          </div>

          {/* View Toggles */}
          <div className="sidebar-view-toggle" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, padding: 6, background: 'var(--color-bg)', borderRadius: 8, marginBottom: 16 }}>
            <button
              style={{
                padding: '8px 6px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeView === 'appointments' ? '#fff' : 'transparent',
                color: activeView === 'appointments' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                boxShadow: activeView === 'appointments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setActiveView('appointments')}
            >
              📅 Queue
            </button>
            <button
              style={{
                padding: '8px 6px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeView === 'patients' ? '#fff' : 'transparent',
                color: activeView === 'patients' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                boxShadow: activeView === 'patients' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setActiveView('patients')}
            >
              👥 Patients
            </button>
            <button
              style={{
                padding: '8px 6px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeView === 'schedules' ? '#fff' : 'transparent',
                color: activeView === 'schedules' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                boxShadow: activeView === 'schedules' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setActiveView('schedules')}
            >
              🗓️ Roster
            </button>
            <button
              style={{
                padding: '8px 6px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeView === 'contacts' ? '#fff' : 'transparent',
                color: activeView === 'contacts' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                boxShadow: activeView === 'contacts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setActiveView('contacts')}
            >
              💬 Feedback
            </button>
          </div>

          {activeView === 'appointments' ? (
            <nav className="sidebar-nav">
              {FILTERS.map(f => {
                const count = f.id === 'All' ? appointments.length : appointments.filter(a => a.status === f.id).length;
                return (
                  <button
                    key={f.id}
                    className={filterStatus === f.id ? 'active' : ''}
                    onClick={() => setFilterStatus(f.id)}
                  >
                    {f.label}
                    <span
                      className={`badge ${f.id === 'Pending' ? 'badge-warning' : f.id === 'Confirmed' ? 'badge-info' : f.id === 'Completed' ? 'badge-success' : 'badge-primary'}`}
                      style={{ marginLeft: 'auto', fontSize: 11 }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          ) : activeView === 'patients' ? (
            <>
              <nav className="sidebar-nav">
                <button
                  className={patientsTab === 'normal' ? 'active' : ''}
                  onClick={() => setPatientsTab('normal')}
                >
                  👥 Registered
                </button>
                <button
                  className={patientsTab === 'dependents' ? 'active' : ''}
                  onClick={() => setPatientsTab('dependents')}
                >
                  👪 Dependents
                </button>
                <button
                  className={patientsTab === 'quick' ? 'active' : ''}
                  onClick={() => setPatientsTab('quick')}
                >
                  ⚡ Quick Bookings
                </button>
              </nav>

              <div style={{ marginTop: 20, padding: 12, background: 'var(--color-bg)', borderRadius: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text)' }}>💡 Accounts Merging</strong>
                Duplicates with identical phone numbers are merged automatically upon listing. Online profiles take priority for conflicting fields.
              </div>
            </>
          ) : activeView === 'schedules' ? (
            <div style={{ marginTop: 20, padding: 12, background: 'var(--color-bg)', borderRadius: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text)' }}>💡 Roster Reference</strong>
              Use this view to verify doctor availability before counter bookings or manual slot allocation.
            </div>
          ) : (
            <div style={{ marginTop: 20, padding: 12, background: 'var(--color-bg)', borderRadius: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text)' }}>💡 Customer Feedback</strong>
              Review inquiries submitted via the public contact form. Grouped by sender phone number.
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 8 }}>Support line</p>
            <p style={{ fontSize: 13, margin: '0 0 2px' }}>Hotline: <strong>1900 6868</strong></p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-muted)' }}>Ext. 1 — Reception</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="dashboard-main-content animate-fade-in">

          {banner.msg && (
            <div className={`alert alert-${banner.type}`}>{banner.msg}</div>
          )}

          {activeView === 'appointments' ? (
            <div className="dashboard-card">
              {/* Stat summary cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Pending Approval</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-warning)' }}>{stats.pending}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>⏳</span>
                </div>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Confirmed Today</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-info)' }}>{stats.confirmedToday}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>✅</span>
                </div>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Completed Today</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-success)' }}>{stats.completedToday}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>🏁</span>
                </div>
              </div>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>
                    {filterStatus === 'All' ? 'All Appointments' : `${filterStatus} Appointments`}
                  </h2>
                  <p className="subtitle">
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                    {stats.pending > 0 && filterStatus !== 'Pending' && (
                      <span style={{ color: 'var(--color-warning)', fontWeight: 700, marginLeft: 8 }}>
                        · {stats.pending} pending
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions: Button and Search */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                    onClick={handleOpenWalkInModal}
                  >
                    <span>➕ Walk-in Registration</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Date search filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="date"
                        value={apptDateFilter}
                        onChange={e => setApptDateFilter(e.target.value)}
                        style={{ margin: 0, height: 38, padding: '6px 12px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-input)' }}
                        title="Filter by appointment date"
                      />
                      {apptDateFilter && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 10px', height: 38, fontSize: 12, margin: 0 }}
                          onClick={() => setApptDateFilter('')}
                        >
                          Clear Date
                        </button>
                      )}
                    </div>

                    {/* Text search */}
                    <div style={{ position: 'relative', minWidth: 240 }}>
                      <input
                        type="text"
                        placeholder="Search patient, dept, doctor…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 36, margin: 0, height: 38 }}
                      />
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                        &#128269;
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="empty-state">
                  {search ? `No results for "${search}".` : `No ${filterStatus === 'All' ? '' : filterStatus.toLowerCase() + ' '}appointments.`}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Department</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(appt => {
                        const p = appt.patientId;
                        const walkin = isIncompleteProfile(p);
                        const pending = appt.status === 'Pending';
                        const confirmed = appt.status === 'Confirmed';

                        return (
                          <tr key={appt._id}>
                            {/* Patient */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <strong style={{ fontSize: 13.5 }}>{p?.fullName || '—'}</strong>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                  {p?.phoneNumber || (p?.parentId?.phoneNumber ? `Guardian: ${p.parentId.phoneNumber}` : '—')}
                                </span>
                                {walkin && (
                                  <span className="badge badge-warning" style={{ fontSize: 10, width: 'fit-content', marginTop: 2 }}>Walk-in</span>
                                )}
                              </div>
                            </td>

                            {/* Date */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {new Date(appt.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>

                            {/* Time */}
                            <td className="monospace">{appt.requestedTime || '—'}</td>

                            {/* Department */}
                            <td>{appt.departmentId?.departmentName || '—'}</td>

                            {/* Doctor */}
                            <td>
                              {appt.doctorId?.fullName
                                ? <span>Dr. {appt.doctorId.fullName}</span>
                                : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12 }}>Not assigned</span>
                              }
                            </td>

                            {/* Status */}
                            <td><StatusPill status={appt.status} /></td>

                            {/* Actions */}
                            <td>
                              <div className="btn-cell">
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => setDetailAppt(appt)}
                                >
                                  Details
                                </button>

                                {pending && (
                                  <>
                                    <button
                                      className="btn btn-ghost btn-xs"
                                      style={{ borderColor: 'var(--color-info)', color: 'var(--color-info)' }}
                                      onClick={() => setScheduleAppt(appt)}
                                      title="View doctor schedule"
                                    >
                                      Schedule
                                    </button>

                                    {walkin ? (
                                      <button
                                        className="btn btn-primary btn-xs"
                                        onClick={() => handleOpenEditModal(appt)}
                                      >
                                        Fill &amp; Approve
                                      </button>
                                    ) : (
                                      <button
                                        className="btn btn-primary btn-xs"
                                        onClick={() => handleConfirm(appt)}
                                        disabled={submitting}
                                      >
                                        Approve
                                      </button>
                                    )}

                                    <button
                                      className="btn btn-xs"
                                      style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
                                      onClick={() => handleCancel(appt)}
                                      disabled={submitting}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {confirmed && (
                                  <>
                                    {appt.attendance === 'Present' ? (
                                      <span className="badge badge-success" style={{ fontSize: 10, padding: '4px 8px' }}>Present</span>
                                    ) : appt.attendance === 'Absent' ? (
                                      <span className="badge badge-danger" style={{ fontSize: 10, padding: '4px 8px' }}>Absent</span>
                                    ) : (
                                      <>
                                        <button
                                          className="btn btn-xs"
                                          style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid #bbf7d0', fontSize: 11 }}
                                          onClick={() => handleUpdateAttendance(appt._id, 'Present')}
                                          disabled={submitting}
                                          title="Mark patient as present"
                                        >
                                          ✓ Present
                                        </button>
                                        <button
                                          className="btn btn-xs"
                                          style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca', fontSize: 11 }}
                                          onClick={() => handleUpdateAttendance(appt._id, 'Absent')}
                                          disabled={submitting}
                                          title="Mark patient as absent (no-show)"
                                        >
                                          ✗ Absent
                                        </button>
                                      </>
                                    )}

                                    {appt.attendance && appt.attendance !== 'Unknown' && (
                                      <button
                                        className="btn btn-ghost btn-xs"
                                        style={{ fontSize: 11, padding: '2px 4px' }}
                                        onClick={() => handleUpdateAttendance(appt._id, 'Unknown')}
                                        disabled={submitting}
                                        title="Reset attendance status"
                                      >
                                        Reset
                                      </button>
                                    )}

                                    <button
                                      className="btn btn-xs"
                                      style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid #fde68a' }}
                                      onClick={() => handleCancel(appt)}
                                      disabled={submitting}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeView === 'patients' ? (
            <div className="dashboard-card animate-fade-in">
              {/* Stat summary cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Registered Patients</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-info)' }}>{patients.normal?.length || 0}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>👥</span>
                </div>
                <div style={{ background: 'var(--color-primary-light)', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Dependents / Sub-accounts</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-primary)' }}>{patients.dependents?.length || 0}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>👪</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Quick Booking Guest Profiles</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-warning)' }}>{patients.quickBooking?.length || 0}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>⚡</span>
                </div>
              </div>

              {/* Patient Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>Patient Accounts</h2>
                  <p className="subtitle">
                    Manage patient directories and registrations
                  </p>
                </div>

                {/* Patient Search */}
                <div style={{ position: 'relative', minWidth: 280 }}>
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, ID..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    style={{ paddingLeft: 36, margin: 0 }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                    &#128269;
                  </span>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20, gap: 16 }}>
                <button
                  className={`tab-btn ${patientsTab === 'normal' ? 'active' : ''}`}
                  style={{
                    background: 'none', border: 'none', borderBottom: patientsTab === 'normal' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    padding: '8px 16px', fontWeight: 600, fontSize: 14, color: patientsTab === 'normal' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => setPatientsTab('normal')}
                >
                  Registered Accounts ({patients.normal?.length || 0})
                </button>
                <button
                  className={`tab-btn ${patientsTab === 'dependents' ? 'active' : ''}`}
                  style={{
                    background: 'none', border: 'none', borderBottom: patientsTab === 'dependents' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    padding: '8px 16px', fontWeight: 600, fontSize: 14, color: patientsTab === 'dependents' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => setPatientsTab('dependents')}
                >
                  Dependent Accounts ({patients.dependents?.length || 0})
                </button>
                <button
                  className={`tab-btn ${patientsTab === 'quick' ? 'active' : ''}`}
                  style={{
                    background: 'none', border: 'none', borderBottom: patientsTab === 'quick' ? '2px solid var(--color-primary)' : '2px solid transparent',
                    padding: '8px 16px', fontWeight: 600, fontSize: 14, color: patientsTab === 'quick' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => setPatientsTab('quick')}
                >
                  Quick Booking Accounts ({patients.quickBooking?.length || 0})
                </button>
              </div>

              {/* Patient Table */}
              {patientsLoading ? (
                <div className="dashboard-loading" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                  <p>Loading patient directory…</p>
                </div>
              ) : (() => {
                const currentList = patientsTab === 'normal' ? (patients.normal || []) : patientsTab === 'dependents' ? (patients.dependents || []) : (patients.quickBooking || []);
                const filteredList = currentList.filter(p => {
                  const q = patientSearch.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    p.fullName?.toLowerCase().includes(q) ||
                    p.phoneNumber?.includes(q) ||
                    p.email?.toLowerCase().includes(q) ||
                    p.identityCard?.toLowerCase().includes(q)
                  );
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      {patientSearch ? `No patient matches "${patientSearch}".` : 'No patient accounts found in this category.'}
                    </div>
                  );
                }

                return (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Patient Info</th>
                          <th>Category</th>
                          <th>Date of Birth</th>
                          <th>Gender</th>
                          <th>ID / Documents</th>
                          {patientsTab === 'dependents' && <th>Primary Account</th>}
                          <th>Address</th>
                          <th>Insurance Code</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredList.map(p => (
                          <tr key={p._id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <strong style={{ fontSize: 13.5 }}>{p.fullName || '—'}</strong>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                  📞 {p.phoneNumber || '—'}
                                </span>
                                {p.email && (
                                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    ✉️ {p.email}
                                  </span>
                                )}
                                {p.userId?.isRegistered === false && (
                                  <span className="badge badge-warning" style={{ fontSize: 10, width: 'fit-content', marginTop: 2 }}>Quick Booking</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${p.category === 'Child' ? 'badge-info' : p.category === 'Elderly' ? 'badge-warning' : 'badge-primary'}`}>
                                {p.category || 'Adult'}
                              </span>
                            </td>
                            <td>
                              {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            </td>
                            <td>
                              {p.gender === 'Nam' ? 'Male' : p.gender === 'Nữ' ? 'Female' : p.gender === 'Khác' ? 'Other' : (p.gender || '—')}
                            </td>
                            <td>
                              {p.category === 'Child' ? (
                                <div style={{ fontSize: 12 }}>
                                  {p.birthCertificate && <div>🗂️ Birth Cert: {p.birthCertificate}</div>}
                                  {p.personalId && <div>🆔 Personal ID: {p.personalId}</div>}
                                  {p.birthCertificateImg && (
                                    <div style={{ marginTop: 4 }}>
                                      <a href={p.birthCertificateImg} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                        🖼️ View Birth Cert
                                      </a>
                                    </div>
                                  )}
                                  {!p.birthCertificate && !p.personalId && !p.birthCertificateImg && <span className="text-muted">—</span>}
                                </div>
                              ) : (
                                <div style={{ fontSize: 12 }}>
                                  {p.identityCard ? <div>🆔 National ID: {p.identityCard}</div> : null}
                                  {p.identityCardImg && (
                                    <div style={{ marginTop: 4 }}>
                                      <a href={p.identityCardImg} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                        🖼️ View ID Card
                                      </a>
                                    </div>
                                  )}
                                  {!p.identityCard && !p.identityCardImg && <span className="text-muted">—</span>}
                                </div>
                              )}
                            </td>
                            {patientsTab === 'dependents' && (
                              <td>
                                {p.parentId ? (
                                  <div style={{ fontSize: 12 }}>
                                    <strong>{p.parentId.fullName}</strong>
                                    <div>📞 {p.parentId.phoneNumber || '—'}</div>
                                  </div>
                                ) : <span className="text-muted">—</span>}
                              </td>
                            )}
                            <td>{p.address || '—'}</td>
                            <td>{p.insuranceCode || '—'}</td>
                            <td>
                              <button
                                className="btn btn-outline btn-xs"
                                onClick={() => handleOpenPatientEdit(p)}
                              >
                                ✏️ Edit Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : activeView === 'schedules' ? (
            <div className="dashboard-card animate-fade-in">
              {/* Stat summary cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Active Shifts</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-success)' }}>{scheduleStats.availableCount}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>🗓️</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Full / Closed Shifts</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-warning)' }}>{scheduleStats.fullCount}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>🔒</span>
                </div>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Booked Slots Total</span>
                    <h3 style={{ fontSize: 20, margin: '8px 0 0', fontWeight: 800, color: 'var(--color-info)' }}>{scheduleStats.bookedSlots} / {scheduleStats.totalSlots}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>📊</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>Doctor Schedules</h2>
                  <p className="subtitle">
                    {filteredSchedules.length} active shift{filteredSchedules.length !== 1 ? 's' : ''} total
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search doctor */}
                  <div style={{ position: 'relative', minWidth: 180 }}>
                    <input
                      type="text"
                      placeholder="Search doctor..."
                      value={scheduleSearchQuery}
                      onChange={e => setSearch(e.target.value || '') || setScheduleSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, margin: 0, height: 38 }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                      &#128269;
                    </span>
                  </div>

                  {/* Filter department */}
                  <select
                    value={scheduleDeptFilter}
                    onChange={e => setScheduleDeptFilter(e.target.value)}
                    style={{ minWidth: 160, margin: 0, height: 38 }}
                  >
                    <option value="">All Departments</option>
                    {depts.map(d => (
                      <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
                    ))}
                  </select>

                  {/* Month Search (Jump to Month) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <label style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--color-text-muted)', margin: 0 }}>Jump to Month</label>
                    <input
                      type="month"
                      value={monthSearchVal}
                      onChange={handleMonthSearchChange}
                      style={{ margin: 0, padding: '4px 10px', height: 38, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-input)' }}
                    />
                  </div>
                </div>
              </div>

              {schedulesLoading ? (
                <div className="dashboard-loading" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                  <p>Loading doctor schedules…</p>
                </div>
              ) : (() => {
                const year = currentCalendarDate.getFullYear();
                const month = currentCalendarDate.getMonth();

                const numDays = new Date(year, month + 1, 0).getDate();
                const startDayOffset = new Date(year, month, 1).getDay();

                const blanks = Array(startDayOffset).fill(null);
                const monthDays = [];
                for (let d = 1; d <= numDays; d++) {
                  monthDays.push(new Date(year, month, d));
                }

                const gridCells = [...blanks, ...monthDays];
                const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                const isSameDate = (d1, d2) => {
                  if (!d1 || !d2) return false;
                  return d1.getFullYear() === d2.getFullYear() &&
                    d1.getMonth() === d2.getMonth() &&
                    d1.getDate() === d2.getDate();
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Calendar Month Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ minWidth: 40, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                        onClick={() => {
                          const prev = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
                          setCurrentCalendarDate(prev);
                        }}
                      >
                        ◀
                      </button>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-dark)' }}>
                        {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ minWidth: 40, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                        onClick={() => {
                          const next = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
                          setCurrentCalendarDate(next);
                        }}
                      >
                        ▶
                      </button>
                    </div>

                    {/* Calendar Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 13, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
                      {WEEKDAYS.map(w => <div key={w}>{w}</div>)}
                    </div>

                    {/* Calendar Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                      {gridCells.map((dayDate, idx) => {
                        if (!dayDate) {
                          return (
                            <div
                              key={`blank-${idx}`}
                              style={{
                                background: '#f8fafc',
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                opacity: 0.4,
                                minHeight: 85
                              }}
                            />
                          );
                        }

                        const dayShifts = filteredSchedules.filter(s => isSameDate(new Date(s.workDate), dayDate));
                        const dayBookings = dayShifts.reduce((sum, s) => sum + (s.currentBooked || 0), 0);
                        const isSelected = isSameDate(dayDate, selectedDate);
                        const isTodayDate = isSameDate(dayDate, new Date());

                        return (
                          <div
                            key={dayDate.toISOString()}
                            onClick={() => {
                              setSelectedDate(dayDate);
                              setMonthSearchVal(dayDate.toISOString().slice(0, 7));
                            }}
                            style={{
                              minHeight: 85,
                              border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              borderRadius: 8,
                              padding: '6px 10px',
                              cursor: 'pointer',
                              background: isSelected ? '#f0fdfa' : isTodayDate ? 'var(--color-primary-light)' : '#fff',
                              boxShadow: isSelected ? '0 0 0 2px var(--color-primary-light)' : 'none',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: isTodayDate ? 'var(--color-primary)' : 'var(--color-text-dark)',
                                background: isTodayDate ? '#fff' : 'transparent',
                                borderRadius: isTodayDate ? '50%' : '0',
                                width: isTodayDate ? 22 : 'auto',
                                height: isTodayDate ? 22 : 'auto',
                                display: isTodayDate ? 'flex' : 'block',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isTodayDate ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}>
                                {dayDate.getDate()}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                              {dayShifts.length > 0 && (
                                <span style={{
                                  background: 'var(--color-primary)',
                                  color: '#fff',
                                  fontSize: 10,
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  fontWeight: 'bold',
                                  width: 'fit-content'
                                }}>
                                  🟢 {dayShifts.length} Shift{dayShifts.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {dayBookings > 0 && (
                                <span style={{
                                  background: 'var(--color-secondary-light)',
                                  color: 'var(--color-secondary-dark)',
                                  fontSize: 10,
                                  padding: '2px 4px',
                                  borderRadius: 4,
                                  fontWeight: 'bold',
                                  width: 'fit-content',
                                  border: '1px solid var(--color-secondary)'
                                }}>
                                  👥 {dayBookings}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Day Details Section */}
                    {selectedDate && (
                      <div style={{ marginTop: 24, borderTop: '2px solid var(--color-border)', paddingTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--color-primary-dark)' }}>
                            📅 Details for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          {(() => {
                            const shiftsForDay = filteredSchedules.filter(s => isSameDate(new Date(s.workDate), selectedDate));
                            const totalBookingsForDay = shiftsForDay.reduce((sum, s) => sum + (s.currentBooked || 0), 0);
                            return (
                              <span className="badge badge-info" style={{ fontSize: 12, padding: '4px 8px' }}>
                                👥 {totalBookingsForDay} Patient(s) Booked Today
                              </span>
                            );
                          })()}
                        </div>

                        {(() => {
                          const shiftsForDay = filteredSchedules.filter(s => isSameDate(new Date(s.workDate), selectedDate));
                          if (shiftsForDay.length === 0) {
                            return (
                              <div className="empty-state" style={{ padding: '20px 0', marginTop: 12 }}>
                                No doctor schedules active on this date.
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {shiftsForDay.map(s => {
                                const isFull = (s.currentBooked || 0) >= (s.maxPatients || 0);
                                const percent = Math.min(100, Math.round(((s.currentBooked || 0) / (s.maxPatients || 1)) * 100));

                                const deptId = typeof s.doctorId?.departmentId === 'object' ? s.doctorId.departmentId?._id : s.doctorId?.departmentId;
                                const deptObj = depts.find(d => d._id === deptId);
                                const deptName = deptObj ? (deptObj.departmentName || deptObj.name) : 'General';

                                const shiftAppts = appointments.filter(appt => {
                                  if (appt.scheduleId && (appt.scheduleId._id === s._id || appt.scheduleId === s._id)) return true;
                                  return appt.doctorId?._id === s.doctorId?._id && isSameDate(new Date(appt.requestedDate), selectedDate);
                                });

                                const isExpanded = expandedRosterShifts.includes(s._id);

                                return (
                                  <div
                                    key={s._id}
                                    style={{
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 12,
                                      background: '#f8fafc',
                                      padding: 16,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 12,
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                      }}
                                      onClick={() => {
                                        setExpandedRosterShifts(prev =>
                                          isExpanded ? prev.filter(id => id !== s._id) : [...prev, s._id]
                                        );
                                      }}
                                    >
                                      <div>
                                        <h4 style={{ margin: 0, fontSize: 15 }}>Dr. {s.doctorId?.fullName || '—'}</h4>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                          🎓 {s.doctorId?.specialization || 'General Practitioner'} | 🗂️ {deptName}
                                        </p>
                                      </div>
                                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <span className="monospace" style={{ fontSize: 13, background: '#fff', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                                          🕒 {s.startTime || '—'} - {s.endTime || '—'}
                                        </span>
                                        <span className={`badge ${s.status === 'Available' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 11, padding: '3px 8px' }}>
                                          {s.status === 'Available' ? 'Available' : 'Full / Closed'}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--color-text-muted)', marginLeft: 4 }}>
                                          {isExpanded ? '▲' : '▼'}
                                        </span>
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                                          <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                              <span style={{ fontWeight: 600 }}>Capacity / Booked Slots</span>
                                              <span style={{ color: isFull ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: 700 }}>{percent}% ({s.currentBooked || 0} / {s.maxPatients || 0})</span>
                                            </div>
                                            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                              <div
                                                style={{
                                                  width: `${percent}%`,
                                                  height: '100%',
                                                  background: isFull ? 'var(--color-danger)' : 'var(--color-primary)',
                                                  borderRadius: 3,
                                                  transition: 'width 0.3s ease'
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                                            <strong>Actual Attended: </strong>
                                            <span style={{ marginLeft: 6, background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontWeight: 'bold', padding: '2px 8px', borderRadius: 4 }}>
                                              {s.actualAttended || 0} patient(s)
                                            </span>
                                          </div>
                                        </div>

                                        {/* Booked Patients list */}
                                        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid var(--color-border)' }}>
                                            Booked Patients ({shiftAppts.length})
                                          </div>
                                          {shiftAppts.length === 0 ? (
                                            <div style={{ padding: 12, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                              No patients registered for this shift.
                                            </div>
                                          ) : (
                                            <div className="table-responsive">
                                              <table className="custom-table" style={{ margin: 0, width: '100%', fontSize: 12 }}>
                                                <thead>
                                                  <tr>
                                                    <th>Patient</th>
                                                    <th>Phone</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                    <th>Symptoms / Reason</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {shiftAppts.map(appt => (
                                                    <tr key={appt._id}>
                                                      <td>
                                                        <strong style={{ color: 'var(--color-primary-dark)' }}>{appt.patientId?.fullName || '—'}</strong>
                                                      </td>
                                                      <td>{appt.patientId?.phoneNumber || '—'}</td>
                                                      <td className="monospace" style={{ fontWeight: 600 }}>{appt.requestedTime || '—'}</td>
                                                      <td>
                                                        <StatusPill status={appt.status} />
                                                      </td>
                                                      <td>
                                                        <span style={{ fontStyle: appt.symptoms ? 'normal' : 'italic', color: appt.symptoms ? 'inherit' : 'var(--color-text-muted)' }}>
                                                          {appt.symptoms || 'No symptoms described'}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="dashboard-card animate-fade-in">
              {/* Stat summary cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Total Feedback</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-info)' }}>{contactInquiries.length}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>💬</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Pending Action</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-warning)' }}>{contactInquiries.filter(c => !c.isResolved).length}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>⚠️</span>
                </div>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Resolved Feedback</span>
                    <h3 style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 800, color: 'var(--color-success)' }}>{contactInquiries.filter(c => c.isResolved).length}</h3>
                  </div>
                  <span style={{ fontSize: 28 }}>✔️</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>Customer Feedback</h2>
                  <p className="subtitle">
                    Review and resolve contact inquiries submitted by site visitors
                  </p>
                </div>
              </div>

              {contactsLoading ? (
                <div className="dashboard-loading" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                  <p>Loading contact inquiries…</p>
                </div>
              ) : (() => {
                if (contactInquiries.length === 0) {
                  return (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      No contact inquiries found.
                    </div>
                  );
                }

                // Group by senderPhone
                const grouped = {};
                contactInquiries.forEach(inq => {
                  const phone = inq.senderPhone || 'no-phone';
                  if (!grouped[phone]) {
                    grouped[phone] = {
                      phone,
                      senderName: inq.senderName || 'Anonymous',
                      items: []
                    };
                  }
                  grouped[phone].items.push(inq);
                });

                const groupedList = Object.values(grouped);

                // Sort messages in each group by date descending
                groupedList.forEach(g => {
                  g.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                });

                // Sort grouped list by the latest message in each group descending
                groupedList.sort((a, b) => {
                  const latestA = new Date(a.items[0]?.createdAt || 0);
                  const latestB = new Date(b.items[0]?.createdAt || 0);
                  return latestB - latestA;
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {groupedList.map(g => {
                      const phone = g.phone;
                      const isExpanded = !!expandedPhones[phone];
                      const unresolvedCount = g.items.filter(item => !item.isResolved).length;

                      return (
                        <div
                          key={phone}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 12,
                            overflow: 'hidden',
                            background: '#fff',
                            transition: 'all 0.2s',
                            boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          {/* Group Header */}
                          <div
                            style={{
                              padding: '14px 18px',
                              background: isExpanded ? 'var(--color-bg)' : '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: isExpanded ? '1px solid var(--color-border)' : '1px solid transparent',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              setExpandedPhones(prev => ({
                                ...prev,
                                [phone]: !prev[phone]
                              }));
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ fontSize: 14.5 }}>{g.senderName}</strong>
                                <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {phone && phone.includes('@') ? '✉️' : '📞'} {phone}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <span className="badge badge-primary" style={{ fontSize: 10, padding: '3px 6px' }}>
                                  {g.items.length} message(s)
                                </span>
                                {unresolvedCount > 0 ? (
                                  <span className="badge badge-warning" style={{ fontSize: 10, padding: '3px 6px' }}>
                                    {unresolvedCount} Pending
                                  </span>
                                ) : (
                                  <span className="badge badge-success" style={{ fontSize: 10, padding: '3px 6px' }}>
                                    All Resolved
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              className="btn btn-ghost btn-xs"
                              style={{ margin: 0 }}
                            >
                              {isExpanded ? 'Hide Messages ▲' : 'View Messages ▼'}
                            </button>
                          </div>

                          {/* Group Body (list of messages) */}
                          {isExpanded && (
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: '#fafbfc' }}>
                              {g.items.map(item => (
                                <div
                                  key={item._id}
                                  style={{
                                    padding: '14px',
                                    background: '#fff',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 10,
                                    position: 'relative'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        📅 {new Date(item.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {item.senderEmail && (
                                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                          ✉️ {item.senderEmail}
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      {item.isResolved ? (
                                        <span className="badge badge-success" style={{ fontSize: 10, display: 'inline-flex', flexDirection: 'column', gap: 2, padding: '4px 8px' }}>
                                          <span>✓ Resolved</span>
                                          {item.handledBy?.fullName && (
                                            <span style={{ fontSize: 8.5, opacity: 0.8 }}>by {item.handledBy.fullName}</span>
                                          )}
                                        </span>
                                      ) : (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                          <span className="badge badge-warning" style={{ fontSize: 10, padding: '4px 8px' }}>
                                            Pending
                                          </span>
                                          {item.senderEmail ? (
                                            <button
                                              className="btn btn-info btn-sm"
                                              style={{ margin: 0, padding: '4px 10px', fontSize: 11, background: '#0891b2', borderColor: '#0891b2' }}
                                              onClick={() => handleReplyInquiry(item)}
                                              disabled={submitting}
                                            >
                                              ✉️ Auto-Reply
                                            </button>
                                          ) : (
                                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No email</span>
                                          )}
                                          <button
                                            className="btn btn-primary btn-sm"
                                            style={{ margin: 0, padding: '4px 10px', fontSize: 11 }}
                                            onClick={() => handleResolveInquiry(item._id)}
                                            disabled={submitting}
                                          >
                                            Mark Resolved
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9', whiteSpace: 'pre-wrap' }}>
                                    {item.message}
                                  </div>

                                  {item.replyMessage && (
                                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0fdfa', borderRadius: 8, border: '1px solid #ccfbf1', fontSize: 13, color: '#115e59', lineHeight: 1.5 }}>
                                      <strong style={{ color: '#0f766e', display: 'block', marginBottom: 4 }}>💬 CSKH Auto-Response:</strong>
                                      <div style={{ whiteSpace: 'pre-wrap' }}>{item.replyMessage}</div>
                                      {item.repliedAt && (
                                        <div style={{ fontSize: 10, color: '#0d9488', marginTop: 6, textAlign: 'right' }}>
                                          Sent at: {new Date(item.repliedAt).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  )}


                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Appointment detail modal ── */}
      {detailAppt && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setDetailAppt(null); }}
        >
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="close-btn" onClick={() => setDetailAppt(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: 14 }}>
                <p style={{ margin: 0 }}>
                  <strong>Patient:</strong> {detailAppt.patientId?.fullName || '—'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Phone:</strong> {detailAppt.patientId?.phoneNumber || (detailAppt.patientId?.parentId?.phoneNumber ? `${detailAppt.patientId.parentId.phoneNumber} (Guardian)` : '—')}
                </p>
                <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(detailAppt.requestedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style={{ margin: 0 }}><strong>Time:</strong> {detailAppt.requestedTime || '—'}</p>
                <p style={{ margin: 0 }}><strong>Doctor:</strong> {detailAppt.doctorId?.fullName ? `Dr. ${detailAppt.doctorId.fullName}` : 'Not assigned'}</p>
                <p style={{ margin: 0 }}><strong>Status:</strong> <StatusPill status={detailAppt.status} /></p>
                <p style={{ margin: 0 }}><strong>ID card:</strong> {detailAppt.patientId?.identityCard || '—'}</p>
                <p style={{ margin: 0 }}><strong>Insurance:</strong> {detailAppt.patientId?.insuranceCode || '—'}</p>
              </div>

              {detailAppt.symptoms && (
                <div style={{ padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>
                    Symptoms / Reason
                  </p>
                  <p style={{ fontSize: 14, margin: 0 }}>{detailAppt.symptoms}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {detailAppt.status === 'Pending' && (
                <>
                  {isIncompleteProfile(detailAppt.patientId) ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setDetailAppt(null); handleOpenEditModal(detailAppt); }}
                    >
                      Fill &amp; Approve
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setDetailAppt(null); handleConfirm(detailAppt); }}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    className="btn btn-xs"
                    style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
                    onClick={() => { setDetailAppt(null); handleCancel(detailAppt); }}
                  >
                    Cancel
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setDetailAppt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete patient profile modal ── */}
      {editingAppt && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setEditingAppt(null); }}
        >
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3>Complete Patient Profile &amp; Approve</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Walk-in patient — fill required info before confirming
                </p>
              </div>
              <button className="close-btn" onClick={() => setEditingAppt(null)}>×</button>
            </div>

            <form onSubmit={handleUpdateAndConfirm}>
              <div className="modal-body">
                <div
                  style={{
                    background: 'var(--color-warning-light)', border: '1px solid #fde68a',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                    fontSize: 13, color: 'var(--color-warning)',
                  }}
                >
                  This patient booked without a complete profile. Please verify their ID details in person.
                </div>

                <div className="grid-form">
                  <div className="form-group">
                    <label>Full name *</label>
                    <input
                      type="text"
                      value={patientForm.fullName}
                      onChange={e => setPatientForm(p => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone number *</label>
                    <input
                      type="tel"
                      value={patientForm.phoneNumber}
                      onChange={e => setPatientForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={patientForm.email}
                      onChange={e => setPatientForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of birth *</label>
                    <input
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={e => setPatientForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={patientForm.gender}
                      onChange={e => setPatientForm(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Nam">Male</option>
                      <option value="Nữ">Female</option>
                      <option value="Khác">Other</option>
                    </select>
                  </div>

                  {formAge < 15 ? (
                    <>
                      <div className="form-group">
                        <label>Birth Certificate *</label>
                        <input
                          type="text"
                          value={patientForm.birthCertificate || ''}
                          onChange={e => setPatientForm(p => ({ ...p, birthCertificate: e.target.value }))}
                          placeholder="Birth certificate number or details"
                        />
                      </div>

                      <div className="form-group">
                        <label>Personal ID *</label>
                        <input
                          type="text"
                          value={patientForm.personalId || ''}
                          onChange={e => setPatientForm(p => ({ ...p, personalId: e.target.value }))}
                          placeholder="Personal ID code (12 digits)"
                        />
                      </div>

                      <div className="form-group">
                        <label>Birth Certificate Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePatientFileChange(e, 'birthCertificateImg')}
                          disabled={uploadingImg}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {patientForm.birthCertificateImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={patientForm.birthCertificateImg} alt="Birth Certificate Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setPatientForm(p => ({ ...p, birthCertificateImg: '' }))}>Remove Image</button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>ID card number (CCCD) {formAge >= 60 ? '*' : '(Optional)'}</label>
                        <input
                          type="text"
                          value={patientForm.identityCard || ''}
                          onChange={e => setPatientForm(p => ({ ...p, identityCard: e.target.value }))}
                          placeholder="National ID / CCCD"
                          required={formAge >= 60}
                        />
                      </div>

                      <div className="form-group">
                        <label>National ID Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePatientFileChange(e, 'identityCardImg')}
                          disabled={uploadingImg}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {patientForm.identityCardImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={patientForm.identityCardImg} alt="Identity Card Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setPatientForm(p => ({ ...p, identityCardImg: '' }))}>Remove Image</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Health insurance number</label>
                    <input
                      type="text"
                      value={patientForm.insuranceCode}
                      onChange={e => setPatientForm(p => ({ ...p, insuranceCode: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={e => setPatientForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Street, district, city"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingAppt(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImg}>
                  {submitting ? 'Saving…' : 'Save & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Edit Patient Profile modal ── */}
      {editingPatient && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setEditingPatient(null); }}
        >
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3>Edit Patient Profile</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Update patient identity details and contact information
                </p>
              </div>
              <button className="close-btn" onClick={() => setEditingPatient(null)}>×</button>
            </div>

            <form onSubmit={handleSavePatientDirect}>
              <div className="modal-body">
                <div className="grid-form">
                  <div className="form-group">
                    <label>Full name *</label>
                    <input
                      type="text"
                      value={patientForm.fullName}
                      onChange={e => setPatientForm(p => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone number *</label>
                    <input
                      type="tel"
                      value={patientForm.phoneNumber}
                      onChange={e => setPatientForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={patientForm.email}
                      onChange={e => setPatientForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of birth *</label>
                    <input
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={e => setPatientForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={patientForm.gender}
                      onChange={e => setPatientForm(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Nam">Male</option>
                      <option value="Nữ">Female</option>
                      <option value="Khác">Other</option>
                    </select>
                  </div>

                  {formAge < 15 ? (
                    <>
                      <div className="form-group">
                        <label>Birth Certificate *</label>
                        <input
                          type="text"
                          value={patientForm.birthCertificate || ''}
                          onChange={e => setPatientForm(p => ({ ...p, birthCertificate: e.target.value }))}
                          placeholder="Birth certificate number or details"
                        />
                      </div>

                      <div className="form-group">
                        <label>Personal ID *</label>
                        <input
                          type="text"
                          value={patientForm.personalId || ''}
                          onChange={e => setPatientForm(p => ({ ...p, personalId: e.target.value }))}
                          placeholder="Personal ID code (12 digits)"
                        />
                      </div>

                      <div className="form-group">
                        <label>Birth Certificate Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePatientFileChange(e, 'birthCertificateImg')}
                          disabled={uploadingImg}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {patientForm.birthCertificateImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={patientForm.birthCertificateImg} alt="Birth Certificate Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setPatientForm(p => ({ ...p, birthCertificateImg: '' }))}>Remove Image</button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>ID card number (CCCD) {formAge >= 60 ? '*' : '(Optional)'}</label>
                        <input
                          type="text"
                          value={patientForm.identityCard || ''}
                          onChange={e => setPatientForm(p => ({ ...p, identityCard: e.target.value }))}
                          placeholder="National ID / CCCD"
                          required={formAge >= 60}
                        />
                      </div>

                      <div className="form-group">
                        <label>National ID Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handlePatientFileChange(e, 'identityCardImg')}
                          disabled={uploadingImg}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {patientForm.identityCardImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={patientForm.identityCardImg} alt="Identity Card Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setPatientForm(p => ({ ...p, identityCardImg: '' }))}>Remove Image</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Health insurance number</label>
                    <input
                      type="text"
                      value={patientForm.insuranceCode}
                      onChange={e => setPatientForm(p => ({ ...p, insuranceCode: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={e => setPatientForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Street, district, city"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPatient(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImg}>
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Doctor schedule modal ── */}
      {scheduleAppt && (
        <DoctorScheduleModal
          appointment={scheduleAppt}
          onClose={() => setScheduleAppt(null)}
          onConfirm={handleDoctorConfirm}
          isLoading={submitting}
        />
      )}

      {/* ── Walk-in Direct counter registration modal ── */}
      {walkInModalOpen && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setWalkInModalOpen(false); }}
        >
          <div className="modal-content" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <h3>Walk-in Registration</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Register a walk-in patient at the counter
                </p>
              </div>
              <button className="close-btn" onClick={() => setWalkInModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleWalkInSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                {/* Patient Selection Choice */}
                <div style={{ marginBottom: 18, padding: 12, background: 'var(--color-bg)', borderRadius: 10 }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Patient Type *</label>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="patientType"
                        value="new"
                        checked={walkInForm.patientType === 'new'}
                        onChange={() => {
                          setWalkInForm(prev => ({ ...prev, patientType: 'new' }));
                          handleWalkInPatientSelect('');
                        }}
                      />
                      New Patient
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="patientType"
                        value="existing"
                        checked={walkInForm.patientType === 'existing'}
                        onChange={() => setWalkInForm(prev => ({ ...prev, patientType: 'existing' }))}
                      />
                      Existing Patient
                    </label>
                  </div>
                </div>

                {/* Existing Patient Selection Dropdown */}
                {walkInForm.patientType === 'existing' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Search Patient (Phone number / Name / ID)</label>
                      <input
                        type="text"
                        placeholder="Enter phone number or name to search..."
                        value={walkInPatientSearch}
                        onChange={e => setWalkInPatientSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 18 }}>
                      <label>Select Patient *</label>
                      <select
                        value={walkInForm.selectedPatientId}
                        onChange={e => handleWalkInPatientSelect(e.target.value)}
                        required
                      >
                        <option value="">-- Select patient from filtered list ({filteredPatientsForDropdown.length} found) --</option>
                        {filteredPatientsForDropdown.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.fullName} - {p.phoneNumber} ({p.identityCard && !p.identityCard.startsWith('QUICK-') && !p.identityCard.startsWith('REG-') ? p.identityCard : 'No ID Card'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Patient Information Grid */}
                <h4 style={{ margin: '0 0 12px 0', paddingBottom: 6, borderBottom: '1px solid var(--color-border)', fontSize: 15 }}>
                  Patient Information
                </h4>
                <div className="grid-form">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={walkInForm.fullName}
                      onChange={e => setWalkInForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      required
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={walkInForm.phoneNumber}
                      onChange={e => setWalkInForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder="e.g. 0912345678"
                      required
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={walkInForm.email}
                      onChange={e => setWalkInForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Optional"
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      value={walkInForm.dateOfBirth}
                      onChange={e => setWalkInForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      required
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={walkInForm.gender}
                      onChange={e => setWalkInForm(p => ({ ...p, gender: e.target.value }))}
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    >
                      <option value="Nam">Male</option>
                      <option value="Nữ">Female</option>
                      <option value="Khác">Other</option>
                    </select>
                  </div>

                  {walkInAge < 15 ? (
                    <>
                      <div className="form-group">
                        <label>Birth Certificate *</label>
                        <input
                          type="text"
                          value={walkInForm.birthCertificate || ''}
                          onChange={e => setWalkInForm(p => ({ ...p, birthCertificate: e.target.value }))}
                          placeholder="Birth certificate info"
                          disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                        />
                      </div>
                      <div className="form-group">
                        <label>Personal ID *</label>
                        <input
                          type="text"
                          value={walkInForm.personalId || ''}
                          onChange={e => setWalkInForm(p => ({ ...p, personalId: e.target.value }))}
                          placeholder="Personal ID code (12 digits)"
                          disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                        />
                      </div>
                      <div className="form-group">
                        <label>Birth Certificate Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleWalkInFileChange(e, 'birthCertificateImg')}
                          disabled={uploadingImg || (walkInForm.patientType === 'existing' && walkInForm.selectedPatientId)}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {walkInForm.birthCertificateImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={walkInForm.birthCertificateImg} alt="Birth Certificate Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            {!(walkInForm.patientType === 'existing' && walkInForm.selectedPatientId) && (
                              <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setWalkInForm(p => ({ ...p, birthCertificateImg: '' }))}>Remove Image</button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>National ID / CCCD {walkInAge >= 60 ? '*' : ''}</label>
                        <input
                          type="text"
                          value={walkInForm.identityCard || ''}
                          onChange={e => setWalkInForm(p => ({ ...p, identityCard: e.target.value }))}
                          placeholder="National identity card number"
                          required={walkInAge >= 60}
                          disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                        />
                      </div>
                      <div className="form-group">
                        <label>National ID Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleWalkInFileChange(e, 'identityCardImg')}
                          disabled={uploadingImg || (walkInForm.patientType === 'existing' && walkInForm.selectedPatientId)}
                        />
                        {uploadingImg && <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>Uploading...</div>}
                        {walkInForm.identityCardImg && (
                          <div style={{ marginTop: 8 }}>
                            <img src={walkInForm.identityCardImg} alt="Identity Card Preview" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 6, border: '1px solid var(--color-border)' }} />
                            {!(walkInForm.patientType === 'existing' && walkInForm.selectedPatientId) && (
                              <button type="button" className="btn btn-xs" style={{ display: 'block', marginTop: 4, background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }} onClick={() => setWalkInForm(p => ({ ...p, identityCardImg: '' }))}>Remove Image</button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Health Insurance Code</label>
                    <input
                      type="text"
                      value={walkInForm.insuranceCode}
                      onChange={e => setWalkInForm(p => ({ ...p, insuranceCode: e.target.value }))}
                      placeholder="Optional"
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={walkInForm.address}
                      onChange={e => setWalkInForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Street address, ward, district, city"
                      required
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>
                </div>

                {/* Booking Information Grid */}
                <h4 style={{ margin: '20px 0 12px 0', paddingBottom: 6, borderBottom: '1px solid var(--color-border)', fontSize: 15 }}>
                  Appointment Details
                </h4>
                <div className="grid-form">
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={walkInForm.departmentId}
                      onChange={e => {
                        const deptId = e.target.value;
                        setWalkInForm(prev => {
                          const updated = { ...prev, departmentId: deptId };
                          const selectedDep = depts.find(d => d._id === deptId);
                          const depName = selectedDep ? (selectedDep.departmentName || selectedDep.name) : '';
                          const currentDoc = docs.find(d => (d.id || d._id) === prev.doctorId);
                          if (currentDoc && currentDoc.department !== depName) {
                            updated.doctorId = '';
                          }
                          return updated;
                        });
                      }}
                      required
                    >
                      <option value="">-- Select department --</option>
                      {depts.map(d => (
                        <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred Doctor</label>
                    <select
                      value={walkInForm.doctorId}
                      onChange={e => setWalkInForm(p => ({ ...p, doctorId: e.target.value }))}
                    >
                      <option value="">-- Any doctor --</option>
                      {filteredDoctors.map(d => (
                        <option key={d.id || d._id} value={d.id || d._id}>
                          {d.fullName} ({d.specialization || 'Doctor'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Appointment Date *</label>
                    <input
                      type="date"
                      value={walkInForm.requestedDate}
                      onChange={e => setWalkInForm(p => ({ ...p, requestedDate: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Appointment Time *</label>
                    <select
                      value={walkInForm.requestedTime}
                      onChange={e => setWalkInForm(p => ({ ...p, requestedTime: e.target.value }))}
                      required
                    >
                      {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Symptoms / Reason for Visit</label>
                    <textarea
                      rows={3}
                      value={walkInForm.symptoms}
                      onChange={e => setWalkInForm(p => ({ ...p, symptoms: e.target.value }))}
                      placeholder="Describe symptoms or reason for visit (optional)..."
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px' }}
                    />
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setWalkInModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || uploadingImg}>
                  {submitting ? 'Saving…' : 'Register & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
