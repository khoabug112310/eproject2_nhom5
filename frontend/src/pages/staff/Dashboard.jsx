import React, { useState, useEffect, useRef } from 'react';
import { schedulingAPI, profilesAPI, clinicalAPI, cmsAPI } from '../../services/api';
import Swal from 'sweetalert2';
import RoleTopNav from '../../components/RoleTopNav';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';
import { io } from 'socket.io-client';
import { useAuth } from '../../store/authContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [activeTab, setActiveTab] = useState('queue');

  // Chat support states
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [chatSocket, setChatSocket] = useState(null);
  
  const chatEndRef = useRef(null);

  // Edit Patient Profile State (for Quick Bookings)
  const [editingPatient, setEditingPatient] = useState(null);
  const [activeApptId, setActiveApptId] = useState(null);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    phoneNumber: '',
    address: '',
    insuranceCode: '',
    emergencyContact: '',
  });

  // Expanded patient groups for account bookings (grouping by patient)
  const [expandedPatientIds, setExpandedPatientIds] = useState(new Set());

  // Doctor Schedule Modal State
  const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
  const [selectedAppointmentForSchedule, setSelectedAppointmentForSchedule] = useState(null);

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
    if (activeTab === 'chat') {
      fetchSessions();
    }
  }, [activeTab]);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Get all appointments
      const apptsRes = await schedulingAPI.getAppointments();
      setAppointments(apptsRes.data.data);

      // 2. Get all patients profiles
      const patientsRes = await profilesAPI.getPatients();
      setPatients(patientsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error loading the appointment list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (appt) => {
    const p = appt.patientId;
    setActiveApptId(appt._id);
    setEditingPatient(p);

    setPatientForm({
      fullName: p?.fullName || '',
      dateOfBirth: p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      gender: p?.gender || 'Nam',
      identityCard: p?.identityCard || '',
      phoneNumber: p?.phoneNumber || '',
      address: p?.address || '',
      insuranceCode: p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
    });
  };

  const handleUpdateAndConfirm = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // 1. Update patient profile
      const updateData = {
        fullName: patientForm.fullName,
        dateOfBirth: patientForm.dateOfBirth,
        gender: patientForm.gender,
        identityCard: patientForm.identityCard,
        phoneNumber: patientForm.phoneNumber,
        address: patientForm.address,
        emergencyContact: patientForm.emergencyContact,
      };
      // Only include insuranceCode if it has a value (BHYT is optional)
      if (patientForm.insuranceCode?.trim()) {
        updateData.insuranceCode = patientForm.insuranceCode.trim();
      }
      await profilesAPI.updateUser(editingPatient._id, updateData);

      // 2. Confirm the appointment
      await schedulingAPI.updateAppointment(activeApptId, { status: 'Confirmed' });

      setSuccessMessage('Patient information updated and appointment CONFIRMED successfully!');
      setEditingPatient(null);
      setActiveApptId(null);
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'An error occurred while confirming the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectConfirm = async (apptId) => {
    const appt = appointments.find(a => a._id === apptId);
    // If no doctor is assigned yet, require choosing one first
    if (!appt?.doctorId) {
      setSelectedAppointmentForSchedule(appt);
      setShowDoctorScheduleModal(true);
      return;
    }
    const result = await Swal.fire({
      title: 'Confirm appointment?',
      text: `Confirm the appointment for patient ${appt?.patientId?.fullName || ''}. A consultation invoice will be created automatically.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.updateAppointment(apptId, { status: 'Confirmed' });
      setSuccessMessage('Appointment confirmed successfully! The consultation invoice has been created automatically.');
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Could not confirm the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and cancel appointment immediately (simple confirm)
  const handleCancelAppointment = async (apptId) => {
    const appt = appointments.find((item) => item._id === apptId);
    if (!appt) return;
    const result = await Swal.fire({
      title: 'Cancel appointment?',
      text: `The appointment for patient ${appt?.patientId?.fullName || ''} will be cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Cancel appointment',
      cancelButtonText: 'Keep',
    });
    if (!result.isConfirmed) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.updateAppointment(apptId, { status: 'Canceled' });
      setSuccessMessage('The appointment has been cancelled.');
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Could not cancel the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Doctor Schedule Modal
  const handleOpenDoctorScheduleModal = (appt) => {
    setSelectedAppointmentForSchedule(appt);
    setShowDoctorScheduleModal(true);
  };

  // Handle Confirm after changing doctor
  const handleConfirmDoctorChange = async (newDoctorId) => {
    if (!selectedAppointmentForSchedule) return;
    
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Update appointment with new doctor and confirm status
      const updateData = { doctorId: newDoctorId, status: 'Confirmed' };
      await schedulingAPI.updateAppointment(selectedAppointmentForSchedule._id, updateData);
      
      setSuccessMessage('Appointment confirmed. The consultation invoice has been created automatically.');
      
      setShowDoctorScheduleModal(false);
      setSelectedAppointmentForSchedule(null);
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Could not update the appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to detect if a patient is a quick booking (missing details)
  const isQuickBooking = (patient) => {
    if (!patient) return true;
    const isDefaultDob = new Date(patient.dateOfBirth).getFullYear() <= 1905;
    const isDefaultCard = patient.identityCard?.startsWith('REG-') || patient.identityCard?.startsWith('ADM-');
    const isDefaultName = patient.fullName === 'Khách hàng' || patient.fullName === 'Guest';
    return isDefaultDob || isDefaultCard || isDefaultName || !patient.address || !patient.identityCard;
  };

  // Toggle expand/collapse for a patient group
  const togglePatientExpand = (patientId) => {
    const newSet = new Set(expandedPatientIds);
    if (newSet.has(patientId)) {
      newSet.delete(patientId);
    } else {
      newSet.add(patientId);
    }
    setExpandedPatientIds(newSet);
  };

  // Group account appointments by patient ID
  const groupAppointmentsByPatient = (appointments) => {
    const groups = {};
    appointments.forEach((appt) => {
      const patientId = appt.patientId?._id;
      if (patientId) {
        if (!groups[patientId]) {
          groups[patientId] = {
            patient: appt.patientId,
            appointments: [],
          };
        }
        groups[patientId].appointments.push(appt);
      }
    });
    return Object.values(groups);
  };

  const renderStatus = (status) => {
    let cls = '';
    let label = status;
    if (status === 'Pending') { cls = 'badge-warning'; label = 'Pending approval'; }
    else if (status === 'Confirmed') { cls = 'badge-primary'; label = 'Confirmed'; }
    else if (status === 'Completed') { cls = 'badge-success'; label = 'Completed'; }
    else if (status === 'Canceled') { cls = 'badge-danger'; label = 'Cancelled'; }
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const filteredAppointments = appointments.filter(a => filterStatus === 'All' || a.status === filterStatus);
  const accountAppointments = filteredAppointments.filter((a) => !isQuickBooking(a.patientId));
  const guestAppointments = filteredAppointments.filter((a) => isQuickBooking(a.patientId));

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading appointment list...</p>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="staff" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">📞</div>
            <h4>Customer Care</h4>
            <p className="p-card-number">Reception &amp; Coordination</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => { setActiveTab('queue'); setFilterStatus('Pending'); }}
              className={activeTab === 'queue' && filterStatus === 'Pending' ? 'active' : ''}
            >
              ⏳ Pending approval ({appointments.filter(a => a.status === 'Pending').length})
            </button>
            <button
              onClick={() => { setActiveTab('queue'); setFilterStatus('Confirmed'); }}
              className={activeTab === 'queue' && filterStatus === 'Confirmed' ? 'active' : ''}
            >
              ✅ Confirmed ({appointments.filter(a => a.status === 'Confirmed').length})
            </button>
            <button
              onClick={() => { setActiveTab('queue'); setFilterStatus('All'); }}
              className={activeTab === 'queue' && filterStatus === 'All' ? 'active' : ''}
            >
              📅 All requests ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={activeTab === 'chat' ? 'active' : ''}
            >
              💬 Chat Support
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {activeTab === 'chat' ? (
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
          ) : (
            <div className="dashboard-card">
              <h2>Patient intake queue</h2>
              <p className="subtitle">Customer care verifies the patient's contact details and ID before adding them to the examination queue.</p>

              {filteredAppointments.length === 0 ? (
                <div className="empty-state">
                  <p>No matching booking requests.</p>
                </div>
              ) : (
                <>
                  <div className="booking-summary-grid">
                    <div className="booking-summary-card booking-summary-card--account">
                      <h4>Registered customers</h4>
                      <p>{accountAppointments.length} {accountAppointments.length === 1 ? 'request' : 'requests'}</p>
                    </div>
                    <div className="booking-summary-card booking-summary-card--guest">
                      <h4>Walk-in guests</h4>
                      <p>{guestAppointments.length} {guestAppointments.length === 1 ? 'request' : 'requests'}</p>
                    </div>
                  </div>

                  <div className="booking-group">
                    <h3>Registered customers ({accountAppointments.length})</h3>
                    {accountAppointments.length === 0 ? (
                      <div className="empty-state">
                        <p>No requests from registered customers in the current list.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}></th>
                              <th>Patient</th>
                              <th>Total requests</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupAppointmentsByPatient(accountAppointments).map((group) => {
                              const isExpanded = expandedPatientIds.has(group.patient._id);
                              const pendingCount = group.appointments.filter(a => a.status === 'Pending').length;
                              const confirmedCount = group.appointments.filter(a => a.status === 'Confirmed').length;
                              return (
                                <React.Fragment key={group.patient._id}>
                                  {/* Summary row */}
                                  <tr
                                    onClick={() => togglePatientExpand(group.patient._id)}
                                    style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f0f0' : '#fff' }}
                                  >
                                    <td style={{ textAlign: 'center', fontSize: '18px' }}>
                                      {isExpanded ? '▼' : '▶'}
                                    </td>
                                    <td>
                                      <strong>{group.patient.fullName}</strong><br />
                                      <small className="text-muted">Phone: {group.patient.phoneNumber}</small><br />
                                      <small className="text-muted">ID Card: {group.patient.identityCard}</small>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                      {group.appointments.length} {group.appointments.length === 1 ? 'request' : 'requests'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      {pendingCount > 0 && <span className="badge badge-warning">Pending: {pendingCount}</span>}
                                      {confirmedCount > 0 && <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Confirmed: {confirmedCount}</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <small style={{ color: '#666' }}>Click to view details</small>
                                    </td>
                                  </tr>

                                  {/* Expanded detail rows */}
                                  {isExpanded && group.appointments.map((appt) => {
                                    const quick = isQuickBooking(appt.patientId);
                                    return (
                                      <tr key={appt._id} style={{ backgroundColor: '#fafafa', borderLeft: '4px solid #0066cc' }}>
                                        <td></td>
                                        <td>
                                          <strong>{new Date(appt.requestedDate).toLocaleDateString('en-US')}</strong><br />
                                          <small className="text-muted">{appt.requestedTime}</small>
                                        </td>
                                        <td>{appt.departmentId?.departmentName}</td>
                                        <td>{appt.doctorId?.fullName || 'Any doctor'}</td>
                                        <td>
                                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span className="badge" style={{ 
                                              backgroundColor: appt.status === 'Pending' ? '#ffc107' : 
                                                             appt.status === 'Confirmed' ? '#007bff' : 
                                                             appt.status === 'Completed' ? '#28a745' : '#dc3545'
                                            }}>
                                              {appt.status === 'Pending' ? 'Pending' :
                                               appt.status === 'Confirmed' ? 'Confirmed' :
                                               appt.status === 'Completed' ? 'Examined' : 'Cancelled'}
                                            </span>
                                            {appt.status === 'Pending' && (
                                              <>
                                                <button
                                                  className="btn btn-info btn-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDoctorScheduleModal(appt);
                                                  }}
                                                  title="View doctor schedule and reassign if needed"
                                                >
                                                  📅 Doctor schedule
                                                </button>
                                                {quick ? (
                                                  <button
                                                    className="btn btn-quick btn-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenEditModal(appt);
                                                    }}
                                                  >
                                                    📝 Fill &amp; Approve
                                                  </button>
                                                ) : (
                                                  <button
                                                    className="btn btn-primary btn-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDirectConfirm(appt._id);
                                                    }}
                                                  >
                                                   Approve
                                                  </button>
                                                )}
                                                <button
                                                  className="btn btn-danger btn-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelAppointment(appt._id);
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </>
                                            )}
                                            {appt.status === 'Confirmed' && (
                                              <button
                                                className="btn btn-warning btn-xs"
                                                onClick={(e) => { e.stopPropagation(); handleCancelAppointment(appt._id); }}
                                              >
                                                Request cancellation
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="booking-group">
                    <h3>Walk-in guests ({guestAppointments.length})</h3>
                    {guestAppointments.length === 0 ? (
                      <div className="empty-state">
                        <p>No requests from walk-in guests in the current list.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px' }}></th>
                              <th>Patient</th>
                              <th>Total requests</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupAppointmentsByPatient(guestAppointments).map((group) => {
                              const isExpanded = expandedPatientIds.has(group.patient._id);
                              const pendingCount = group.appointments.filter(a => a.status === 'Pending').length;
                              const confirmedCount = group.appointments.filter(a => a.status === 'Confirmed').length;
                              return (
                                <React.Fragment key={group.patient._id}>
                                  {/* Summary row */}
                                  <tr
                                    onClick={() => togglePatientExpand(group.patient._id)}
                                    style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f0f0' : '#fff' }}
                                  >
                                    <td style={{ textAlign: 'center', fontSize: '18px' }}>
                                      {isExpanded ? '▼' : '▶'}
                                    </td>
                                    <td>
                                      <strong>{group.patient.fullName}</strong><br />
                                      <small className="text-muted">Phone: {group.patient.phoneNumber}</small><br />
                                      <small className="text-muted">ID Card: {group.patient.identityCard}</small>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                      {group.appointments.length} {group.appointments.length === 1 ? 'request' : 'requests'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      {pendingCount > 0 && <span className="badge badge-warning">Pending: {pendingCount}</span>}
                                      {confirmedCount > 0 && <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Confirmed: {confirmedCount}</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <small style={{ color: '#666' }}>Click to view details</small>
                                    </td>
                                  </tr>

                                  {/* Expanded detail rows */}
                                  {isExpanded && group.appointments.map((appt) => {
                                    const quick = isQuickBooking(appt.patientId);
                                    return (
                                      <tr key={appt._id} style={{ backgroundColor: '#fafafa', borderLeft: '4px solid #0066cc' }}>
                                        <td></td>
                                        <td>
                                          <strong>{new Date(appt.requestedDate).toLocaleDateString('en-US')}</strong><br />
                                          <small className="text-muted">{appt.requestedTime}</small>
                                        </td>
                                        <td>{appt.departmentId?.departmentName}</td>
                                        <td>{appt.doctorId?.fullName || 'Any doctor'}</td>
                                        <td>
                                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span className="badge" style={{ 
                                              backgroundColor: appt.status === 'Pending' ? '#ffc107' : 
                                                             appt.status === 'Confirmed' ? '#007bff' : 
                                                             appt.status === 'Completed' ? '#28a745' : '#dc3545'
                                            }}>
                                              {appt.status === 'Pending' ? 'Pending' :
                                               appt.status === 'Confirmed' ? 'Confirmed' :
                                               appt.status === 'Completed' ? 'Examined' : 'Cancelled'}
                                            </span>
                                            {appt.status === 'Pending' && (
                                              <>
                                                <button
                                                  className="btn btn-info btn-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDoctorScheduleModal(appt);
                                                  }}
                                                  title="View doctor schedule and reassign if needed"
                                                >
                                                  📅 Doctor schedule
                                                </button>
                                                {quick ? (
                                                  <button
                                                    className="btn btn-quick btn-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenEditModal(appt);
                                                    }}
                                                  >
                                                    📝 Fill &amp; Approve
                                                  </button>
                                                ) : (
                                                  <button
                                                    className="btn btn-primary btn-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDirectConfirm(appt._id);
                                                    }}
                                                  >
                                                    ⚡ Approve
                                                  </button>
                                                )}
                                                <button
                                                  className="btn btn-danger btn-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelAppointment(appt._id);
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </>
                                            )}
                                            {appt.status === 'Confirmed' && (
                                              <button
                                                className="btn btn-warning btn-xs"
                                                onClick={(e) => { e.stopPropagation(); handleCancelAppointment(appt._id); }}
                                              >
                                                Request cancellation
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Complete Patient profile and confirm modal */}
      {editingPatient && (
        <div className="modal-backdrop">
          <div className="modal-content patient-profile-modal">
            <div className="modal-header">
              <h3>Complete patient profile &amp; Approve</h3>
              <button className="close-btn" onClick={() => setEditingPatient(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateAndConfirm}>
              <div className="modal-body">
                <p className="modal-alert-info">
                  ⚠️ This quick-booking patient does not have a complete profile yet. Please ask for and fill in all required information before confirming the appointment.
                </p>

                <div className="grid-form">
                  <div className="form-group">
                    <label>Full name *</label>
                    <input
                      type="text"
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone number *</label>
                    <input
                      type="tel"
                      value={patientForm.phoneNumber}
                      onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of birth *</label>
                    <input
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      required
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
                      onChange={(e) => setPatientForm({ ...patientForm, identityCard: e.target.value })}
                      placeholder="National ID number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Health insurance number</label>
                    <input
                      type="text"
                      value={patientForm.insuranceCode}
                      onChange={(e) => setPatientForm({ ...patientForm, insuranceCode: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Permanent address *</label>
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                      placeholder="House no., street, district..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPatient(null)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Processing...' : 'Update &amp; Approve'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Schedule Modal */}
      {showDoctorScheduleModal && selectedAppointmentForSchedule && (
        <DoctorScheduleModal
          appointment={selectedAppointmentForSchedule}
          onClose={() => {
            setShowDoctorScheduleModal(false);
            setSelectedAppointmentForSchedule(null);
          }}
          onConfirm={handleConfirmDoctorChange}
          isLoading={submitting}
        />
      )}
    </div>
  );
}
