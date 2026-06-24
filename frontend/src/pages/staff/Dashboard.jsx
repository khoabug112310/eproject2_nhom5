import React, { useState, useEffect, useMemo, useRef } from 'react';
import { schedulingAPI, profilesAPI, clinicalAPI, cmsAPI } from '../../services/api';
import Swal from 'sweetalert2';
import RoleTopNav from '../../components/RoleTopNav';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';
import { io } from 'socket.io-client';
import { useAuth } from '../../store/authContext';

// ── helpers ───────────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const map = {
    Pending:   'status-pending',
    Confirmed: 'status-confirmed',
    Completed: 'status-completed',
    Canceled:  'status-canceled',
  };
  const labels = {
    Pending: 'Pending', Confirmed: 'Confirmed',
    Completed: 'Completed', Canceled: 'Canceled',
  };
  return <span className={`status-pill ${map[status] || ''}`}>{labels[status] || status}</span>;
}

function isIncompleteProfile(patient) {
  if (!patient) return true;
  const badDob  = !patient.dateOfBirth || new Date(patient.dateOfBirth).getFullYear() <= 1905;
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
  { id: 'Pending',   label: 'Pending' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'Completed', label: 'Completed' },
  { id: 'All',       label: 'All' },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [banner, setBanner]             = useState({ msg: '', type: '' });

  // Chat support states
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatSocket, setChatSocket] = useState(null);
  const chatEndRef = useRef(null);

  const [filterStatus, setFilterStatus] = useState('Pending');
  const [search, setSearch]             = useState('');

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
  });

  // doctor schedule modal
  const [scheduleAppt, setScheduleAppt] = useState(null);

  // appointment detail drawer
  const [detailAppt, setDetailAppt] = useState(null);

  // Patient directory states
  const [activeView, setActiveView] = useState('appointments'); // 'appointments' | 'patients' | 'schedules'
  const [patients, setPatients] = useState({ normal: [], quickBooking: [] });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsTab, setPatientsTab] = useState('normal'); // 'normal' | 'quick'
  const [patientSearch, setPatientSearch] = useState('');
  const [editingPatient, setEditingPatient] = useState(null);

  // Doctor schedules states
  const [schedulesList, setSchedulesList] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleDeptFilter, setScheduleDeptFilter] = useState('');

  // Contact feedback states
  const [contactInquiries, setContactInquiries] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [expandedPhones, setExpandedPhones] = useState({});
  const [expandedDoctors, setExpandedDoctors] = useState({});

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

  const fetchSessions = async () => {
    try {
      const res = await cmsAPI.getChatSessions();
      if (res.data && res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    }
  };

  useEffect(() => {
    if (activeView === 'chat') {
      fetchSessions();
    }
  }, [activeView]);

  useEffect(() => {
    const socketUrl = 'http://localhost:4000';
    const socketConn = io(socketUrl, {
      withCredentials: true
    });

    socketConn.on('connect', () => {
      socketConn.emit('join_staff');
    });

    socketConn.on('new_message', (msg) => {
      fetchSessions();
      setSelectedSession(curr => {
        if (curr) {
          const isMatch = (curr.roomId === msg.guestSessionId || curr.roomId === msg.senderId);
          if (isMatch) {
            setChatMessages(prev => {
              if (prev.some(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
          }
        }
        return curr;
      });
    });

    setChatSocket(socketConn);

    return () => {
      socketConn.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    try {
      const params = {};
      if (session.roomType === 'guest') {
        params.sessionId = session.roomId;
      } else {
        params.userId = session.roomId;
      }
      
      const res = await cmsAPI.getChatHistory(params);
      if (res.data && res.data.success) {
        setChatMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error loading chat history for session:', err);
    }
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !selectedSession || !chatSocket) return;

    const targetRoom = selectedSession.roomType === 'guest' 
      ? `room_guest_${selectedSession.roomId}` 
      : `room_user_${selectedSession.roomId}`;

    chatSocket.emit('staff_reply', {
      text: chatInput.trim(),
      targetRoom,
      staffId: user?.id,
      staffName: user?.displayName || user?.username || 'Staff'
    });

    setChatInput('');
  };

  const handleSendTemplate = (templateText) => {
    if (!selectedSession || !chatSocket) return;
    
    const targetRoom = selectedSession.roomType === 'guest' 
      ? `room_guest_${selectedSession.roomId}` 
      : `room_user_${selectedSession.roomId}`;

    chatSocket.emit('staff_reply', {
      text: templateText,
      targetRoom,
      staffId: user?.id,
      staffName: user?.displayName || user?.username || 'Staff'
    });
  };

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
      setPatients(res.data?.data || { normal: [], quickBooking: [] });
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

  const flash = (msg, type = 'success') => {
    setBanner({ msg, type });
    setTimeout(() => setBanner({ msg: '', type: '' }), 5000);
  };

  // ── derived stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    pending:        appointments.filter(a => a.status === 'Pending').length,
    confirmedToday: appointments.filter(a => a.status === 'Confirmed' && isToday(a.requestedDate)).length,
    completedToday: appointments.filter(a => a.status === 'Completed' && isToday(a.requestedDate)).length,
    total:          appointments.length,
  }), [appointments]);

  const filtered = useMemo(() => {
    let list = filterStatus === 'All' ? appointments : appointments.filter(a => a.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        a.patientId?.fullName?.toLowerCase().includes(q) ||
        a.patientId?.phoneNumber?.includes(q) ||
        a.departmentId?.departmentName?.toLowerCase().includes(q) ||
        a.doctorId?.fullName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, filterStatus, search]);

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
        insuranceCode: patient.insuranceCode || '',
        address: patient.address || '',
      }));
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();

    const dobDate = new Date(walkInForm.dateOfBirth);
    const today = new Date();
    const age = (today - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 0) {
      flash('Invalid date of birth.', 'danger');
      return;
    }
    if (age > 120) {
      flash('Patient age cannot exceed 120 years.', 'danger');
      return;
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
        address: walkInForm.address,
        insuranceCode: walkInForm.insuranceCode || undefined,
        email: walkInForm.email || undefined,
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
      fullName:        p?.fullName || '',
      dateOfBirth:     p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
      gender:          p?.gender || 'Nam',
      identityCard:    p?.identityCard || '',
      phoneNumber:     p?.phoneNumber || '',
      email:           p?.email || '',
      address:         p?.address || '',
      insuranceCode:   p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
    });
  };

  const handleOpenPatientEdit = (p) => {
    setEditingPatient(p);
    setPatientForm({
      fullName:        p?.fullName || '',
      dateOfBirth:     p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
      gender:          p?.gender || 'Nam',
      identityCard:    p?.identityCard || '',
      phoneNumber:     p?.phoneNumber || '',
      email:           p?.email || '',
      address:         p?.address || '',
      insuranceCode:   p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
    });
  };

  const handleSavePatientDirect = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;

    // Check age limits
    const isChild = editingPatient.category === 'Child';
    const dobDate = new Date(patientForm.dateOfBirth);
    const today = new Date();
    const age = (today - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    if (isChild) {
      if (age >= 14) {
        flash('Child dependents must be under 14 years old.', 'danger');
        return;
      }
    } else {
      if (age < 14) {
        flash('Adult patient must be at least 14 years old to have a National ID / CCCD.', 'danger');
        return;
      }
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
    const age = (today - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 14) {
      flash('Patient must be at least 14 years old to have a National ID / CCCD.', 'danger');
      return;
    }
    if (age > 120) {
      flash('Patient age cannot exceed 120 years.', 'danger');
      return;
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

  const handleDoctorConfirm = async (newDoctorId) => {
    if (!scheduleAppt) return;
    setSubmitting(true);
    try {
      await schedulingAPI.updateAppointment(scheduleAppt._id, { doctorId: newDoctorId, status: 'Confirmed' });
      flash('Doctor assigned and appointment confirmed.');
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
            <button
              style={{
                padding: '8px 6px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                gridColumn: '1 / -1',
                background: activeView === 'chat' ? '#fff' : 'transparent',
                color: activeView === 'chat' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                boxShadow: activeView === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveView('chat')}
            >
              💬 Chat Support
            </button>
          </div>

          {activeView === 'appointments' ? (
            <>
              {/* Stat summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Pending</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-warning)' }}>{stats.pending}</span>
                </div>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Confirmed today</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-info)' }}>{stats.confirmedToday}</span>
                </div>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Completed today</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>{stats.completedToday}</span>
                </div>
              </div>

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
            </>
          ) : activeView === 'patients' ? (
            <>
              {/* Patient Stat summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Registered</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-info)' }}>{patients.normal.length}</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Quick Bookings</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-warning)' }}>{patients.quickBooking.length}</span>
                </div>
              </div>

              <nav className="sidebar-nav">
                <button
                  className={patientsTab === 'normal' ? 'active' : ''}
                  onClick={() => setPatientsTab('normal')}
                >
                  👥 Registered
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
            <>
              {/* Schedules Stat summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Active Shifts</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>{scheduleStats.availableCount}</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Full / Closed</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-warning)' }}>{scheduleStats.fullCount}</span>
                </div>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Booked Slots</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-info)' }}>{scheduleStats.bookedSlots} / {scheduleStats.totalSlots}</span>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: 12, background: 'var(--color-bg)', borderRadius: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text)' }}>💡 Roster Reference</strong>
                Use this view to verify doctor availability before counter bookings or manual slot allocation.
              </div>
            </>
          ) : (
            <>
              {/* Feedback Stat summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'var(--color-info-light)', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>Total Feedback</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-info)' }}>{contactInquiries.length}</span>
                </div>
                <div style={{ background: 'var(--color-warning-light)', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)' }}>Pending Action</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-warning)' }}>{contactInquiries.filter(c => !c.isResolved).length}</span>
                </div>
                <div style={{ background: 'var(--color-success-light)', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>Resolved</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>{contactInquiries.filter(c => c.isResolved).length}</span>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: 12, background: 'var(--color-bg)', borderRadius: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: 'var(--color-text)' }}>💡 Customer Feedback</strong>
                Review inquiries submitted via the public contact form. Grouped by sender phone number.
              </div>
            </>
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

                  <div style={{ position: 'relative', minWidth: 240 }}>
                    <input
                      type="text"
                      placeholder="Search patient, dept, doctor…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ paddingLeft: 36, margin: 0 }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                      &#128269;
                    </span>
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
                      const p        = appt.patientId;
                      const walkin   = isIncompleteProfile(p);
                      const pending  = appt.status === 'Pending';
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
                  Registered Accounts ({patients.normal.length})
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
                  Quick Booking Accounts ({patients.quickBooking.length})
                </button>
              </div>

              {/* Patient Table */}
              {patientsLoading ? (
                <div className="dashboard-loading" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                  <p>Loading patient directory…</p>
                </div>
              ) : (() => {
                const currentList = patientsTab === 'normal' ? patients.normal : patients.quickBooking;
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
                          <th>Date of Birth</th>
                          <th>Gender</th>
                          <th>National ID / CCCD</th>
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
                              {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                            </td>
                            <td>
                              {p.gender === 'Nam' ? 'Male' : p.gender === 'Nữ' ? 'Female' : p.gender === 'Khác' ? 'Other' : (p.gender || '—')}
                            </td>
                            <td>{p.identityCard || '—'}</td>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>Doctor Schedules</h2>
                  <p className="subtitle">
                    {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''} active
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search doctor */}
                  <div style={{ position: 'relative', minWidth: 200 }}>
                    <input
                      type="text"
                      placeholder="Search doctor by name..."
                      value={scheduleSearchQuery}
                      onChange={e => setScheduleSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, margin: 0 }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: 14, pointerEvents: 'none' }}>
                      &#128269;
                    </span>
                  </div>

                  {/* Filter department */}
                  <select
                    value={scheduleDeptFilter}
                    onChange={e => setScheduleDeptFilter(e.target.value)}
                    style={{ minWidth: 180, margin: 0 }}
                  >
                    <option value="">All Departments</option>
                    {depts.map(d => (
                      <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {schedulesLoading ? (
                <div className="dashboard-loading" style={{ minHeight: 200 }}>
                  <div className="spinner" />
                  <p>Loading doctor schedules…</p>
                </div>
              ) : (() => {
                if (filteredSchedules.length === 0) {
                  return (
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      {scheduleSearchQuery || scheduleDeptFilter ? 'No schedules match your filters.' : 'No doctor schedules found.'}
                    </div>
                  );
                }

                // Group by doctor
                const grouped = {};
                filteredSchedules.forEach(s => {
                  const docId = s.doctorId?._id || 'unknown';
                  if (!grouped[docId]) {
                    grouped[docId] = {
                      doctor: s.doctorId,
                      shifts: []
                    };
                  }
                  grouped[docId].shifts.push(s);
                });

                const groupedList = Object.values(grouped);
                groupedList.sort((a, b) => {
                  const nameA = a.doctor?.fullName || '';
                  const nameB = b.doctor?.fullName || '';
                  return nameA.localeCompare(nameB);
                });

                groupedList.forEach(g => {
                  g.shifts.sort((a, b) => {
                    const dateCompare = new Date(a.workDate) - new Date(b.workDate);
                    if (dateCompare !== 0) return dateCompare;
                    return (a.startTime || '').localeCompare(b.startTime || '');
                  });
                });

                return (
                  <div className="table-responsive">
                    <table className="custom-table animate-fade-in">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Doctor</th>
                          <th style={{ width: '20%' }}>Department</th>
                          <th style={{ width: '15%' }}>Active Shifts</th>
                          <th style={{ width: '20%' }}>Shift Summary</th>
                          <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedList.map(g => {
                          const docId = g.doctor?._id || 'unknown';
                          const isExpanded = !!expandedDoctors[docId];
                          
                          const deptObj = depts.find(d => d._id === (typeof g.doctor?.departmentId === 'object' ? g.doctor.departmentId?._id : g.doctor?.departmentId));
                          const deptName = deptObj ? (deptObj.departmentName || deptObj.name) : '—';
                          
                          const availableShifts = g.shifts.filter(s => s.status === 'Available').length;
                          const fullShifts = g.shifts.length - availableShifts;

                          return (
                            <React.Fragment key={docId}>
                              <tr 
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setExpandedDoctors(prev => ({
                                    ...prev,
                                    [docId]: !prev[docId]
                                  }));
                                }}
                              >
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <strong style={{ fontSize: 13.5 }}>Dr. {g.doctor?.fullName || '—'}</strong>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                      🎓 {g.doctor?.specialization || 'General Practitioner'}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: 13 }}>{deptName}</span>
                                </td>
                                <td>
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{g.shifts.length} shift(s)</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {availableShifts > 0 && (
                                      <span className="badge badge-success" style={{ fontSize: 10, padding: '3px 6px' }}>
                                        {availableShifts} Available
                                      </span>
                                    )}
                                    {fullShifts > 0 && (
                                      <span className="badge badge-danger" style={{ fontSize: 10, padding: '3px 6px' }}>
                                        {fullShifts} Full
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button 
                                    className="btn btn-outline btn-xs"
                                    style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedDoctors(prev => ({
                                        ...prev,
                                        [docId]: !prev[docId]
                                      }));
                                    }}
                                  >
                                    {isExpanded ? 'Hide Shifts ▲' : 'View Shifts ▼'}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} style={{ padding: '12px 16px 20px 24px', background: '#f8fafc' }}>
                                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                      <table className="custom-table" style={{ margin: 0, width: '100%', border: 'none' }}>
                                        <thead style={{ background: '#f1f5f9' }}>
                                          <tr>
                                            <th>Work Date</th>
                                            <th>Shift Hours</th>
                                            <th>Capacity / Slots</th>
                                            <th>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {g.shifts.map(s => {
                                            const percent = Math.min(100, Math.round(((s.currentBooked || 0) / (s.maxPatients || 1)) * 100));
                                            const isFull = (s.currentBooked || 0) >= (s.maxPatients || 0);
                                            return (
                                              <tr key={s._id}>
                                                <td style={{ fontWeight: 600 }}>
                                                  {s.workDate ? new Date(s.workDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                                <td className="monospace">{s.startTime || '—'} - {s.endTime || '—'}</td>
                                                <td>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 160 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                                      <span>{s.currentBooked || 0} / {s.maxPatients || 0} slots</span>
                                                      <span style={{ color: isFull ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: 700 }}>{percent}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
                                                      <div
                                                        style={{
                                                          width: `${percent}%`,
                                                          height: '100%',
                                                          background: isFull ? 'var(--color-danger)' : 'var(--color-primary)',
                                                          borderRadius: 2.5,
                                                          transition: 'width 0.3s ease'
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                </td>
                                                <td>
                                                  <span className={`badge ${s.status === 'Available' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                                    {s.status === 'Available' ? 'Available' : 'Full / Closed'}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="dashboard-card animate-fade-in">
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
                                  📞 {phone}
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

                                  <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Reply via:</span>
                                    <a
                                      href={`tel:${phone}`}
                                      className="btn btn-outline btn-xs"
                                      style={{
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: 12,
                                        padding: '6px 12px',
                                        backgroundColor: '#fff',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 6,
                                        color: 'var(--color-primary-dark)',
                                        fontWeight: 600,
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={e => {
                                        e.target.style.backgroundColor = 'var(--color-primary-light)';
                                        e.target.style.borderColor = 'var(--color-primary)';
                                      }}
                                      onMouseLeave={e => {
                                        e.target.style.backgroundColor = '#fff';
                                        e.target.style.borderColor = 'var(--color-border)';
                                      }}
                                    >
                                      📞 Call Phone ({phone})
                                    </a>
                                    {item.senderEmail && (
                                      <a
                                        href={`mailto:${item.senderEmail}?subject=Hop Son Tai Clinic - Inquiry Response`}
                                        className="btn btn-outline btn-xs"
                                        style={{
                                          textDecoration: 'none',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          fontSize: 12,
                                          padding: '6px 12px',
                                          backgroundColor: '#fff',
                                          border: '1px solid var(--color-border)',
                                          borderRadius: 6,
                                          color: 'var(--color-primary-dark)',
                                          fontWeight: 600,
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                          e.target.style.backgroundColor = 'var(--color-primary-light)';
                                          e.target.style.borderColor = 'var(--color-primary)';
                                        }}
                                        onMouseLeave={e => {
                                          e.target.style.backgroundColor = '#fff';
                                          e.target.style.borderColor = 'var(--color-border)';
                                        }}
                                      >
                                        ✉️ Email Reply ({item.senderEmail})
                                      </a>
                                    )}
                                  </div>
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

          {activeView === 'chat' && (
            <div className="dashboard-card" style={{ padding: '20px' }}>
              <h2>💬 Patient Chat Support</h2>
              <p className="subtitle">Coordinate and reply in real-time to walk-in guests and registered patients.</p>

              <div className="staff-chat-container">
                {/* Left: Chat Session List */}
                <div className="staff-chat-sidebar">
                  <div className="staff-chat-sidebar-header">
                    <h3>Conversations</h3>
                    <input
                      type="text"
                      className="staff-chat-search"
                      placeholder="Search patient or guest..."
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                    />
                  </div>
                  <div className="staff-chat-session-list">
                    {sessions
                      .filter(s => {
                        const name = (s.roomName || '').toLowerCase();
                        const query = chatSearch.toLowerCase();
                        return name.includes(query) || (s.lastMessage || '').toLowerCase().includes(query);
                      })
                      .map((session) => {
                        const isActive = selectedSession && selectedSession.roomId === session.roomId;
                        const initial = session.roomName ? session.roomName.charAt(0).toUpperCase() : '?';
                        const isGuest = session.roomType === 'guest';
                        
                        return (
                          <div
                            key={session.roomId}
                            className={`staff-chat-session-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleSelectSession(session)}
                          >
                            <div className={`staff-chat-avatar ${isGuest ? 'guest' : ''}`}>
                              {initial}
                            </div>
                            <div className="staff-chat-session-info">
                              <div className="staff-chat-session-name-row">
                                <span className="staff-chat-session-name">
                                  {session.roomName}
                                </span>
                                <span className="staff-chat-session-time">
                                  {session.lastTimestamp ? new Date(session.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <div className="staff-chat-session-preview">
                                {session.lastMessage || 'No messages'}
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                <span className={`staff-chat-badge ${isGuest ? 'guest' : 'patient'}`}>
                                  {isGuest ? 'Guest' : 'Patient'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {sessions.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No active conversations.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Messages Area */}
                {selectedSession ? (
                  <div className="staff-chat-main">
                    <div className="staff-chat-main-header">
                      <div className={`staff-chat-avatar ${selectedSession.roomType === 'guest' ? 'guest' : ''}`}>
                        {selectedSession.roomName ? selectedSession.roomName.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3>{selectedSession.roomName}</h3>
                        <p style={{ textTransform: 'capitalize' }}>
                          Type: {selectedSession.roomType} | Room ID: {selectedSession.roomId}
                        </p>
                      </div>
                    </div>

                    <div className="staff-chat-messages-area">
                      {chatMessages.map((msg) => {
                        const isSelf = msg.senderType === 'staff';
                        const isAI = msg.senderType === 'ai';
                        let rowClass = 'other';
                        if (isSelf) rowClass = 'self';
                        else if (isAI) rowClass = 'ai';

                        return (
                          <div key={msg._id} className={`staff-chat-bubble-row ${rowClass}`}>
                            <div className="staff-chat-bubble">
                              <strong>{msg.senderName}</strong>
                              <div style={{ marginTop: '2px' }}>
                                {msg.messageText.split('\n').map((line, idx) => (
                                  <React.Fragment key={idx}>
                                    {line}
                                    {idx < msg.messageText.split('\n').length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                            <span className="staff-chat-msg-meta">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="staff-chat-input-area">
                      {/* Templates */}
                      <div className="staff-chat-quick-templates">
                        <button
                          type="button"
                          className="staff-chat-template-chip"
                          onClick={() => handleSendTemplate("Hello! How can I assist you today?")}
                        >
                          👋 Hello
                        </button>
                        <button
                          type="button"
                          className="staff-chat-template-chip"
                          onClick={() => handleSendTemplate("Please wait a moment while I look up your booking details.")}
                        >
                          ⏳ Please wait
                        </button>
                        <button
                          type="button"
                          className="staff-chat-template-chip"
                          onClick={() => handleSendTemplate("The appointment has been confirmed. You will receive an SMS confirmation shortly.")}
                        >
                          ✅ Confirm details
                        </button>
                        <button
                          type="button"
                          className="staff-chat-template-chip"
                          onClick={() => handleSendTemplate("Please call our emergency hotline directly at 091-444-4444.")}
                        >
                          📞 Hotline emergency
                        </button>
                      </div>

                      <form className="staff-chat-form" onSubmit={handleSendChat}>
                        <input
                          type="text"
                          className="staff-chat-input"
                          placeholder="Type your message..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="staff-chat-send-btn"
                          disabled={!chatInput.trim()}
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="staff-chat-empty">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <h3>No Conversation Selected</h3>
                    <p>Select a patient or guest conversation from the sidebar list to reply in real-time.</p>
                  </div>
                )}
              </div>
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
                      min={minDobPrimary}
                      max={maxDobPrimary}
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

                  <div className="form-group">
                    <label>ID card number *</label>
                    <input
                      type="text"
                      value={patientForm.identityCard}
                      onChange={e => setPatientForm(p => ({ ...p, identityCard: e.target.value }))}
                      placeholder="National ID / CCCD"
                      required
                    />
                  </div>

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
                <button type="submit" className="btn btn-primary" disabled={submitting}>
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
                      min={editingPatient.category === 'Child' ? undefined : minDobPrimary}
                      max={editingPatient.category === 'Child' ? maxDobPrimary : maxDobPrimary}
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

                  <div className="form-group">
                    <label>ID card number *</label>
                    <input
                      type="text"
                      value={patientForm.identityCard}
                      onChange={e => setPatientForm(p => ({ ...p, identityCard: e.target.value }))}
                      placeholder="National ID / CCCD"
                      required
                    />
                  </div>

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
                <button type="submit" className="btn btn-primary" disabled={submitting}>
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

                  <div className="form-group">
                    <label>National ID / CCCD</label>
                    <input
                      type="text"
                      value={walkInForm.identityCard}
                      onChange={e => setWalkInForm(p => ({ ...p, identityCard: e.target.value }))}
                      placeholder="National identity card number"
                      disabled={walkInForm.patientType === 'existing' && walkInForm.selectedPatientId}
                    />
                  </div>

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
                <button type="submit" className="btn btn-primary" disabled={submitting}>
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
