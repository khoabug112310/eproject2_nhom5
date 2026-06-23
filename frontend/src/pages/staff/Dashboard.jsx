import React, { useState, useEffect } from 'react';
import { schedulingAPI, profilesAPI, clinicalAPI } from '../../services/api';
import Swal from 'sweetalert2';
import RoleTopNav from '../../components/RoleTopNav';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

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

      // Check if doctor is assigned
      const appt = appointments.find(a => a._id === activeApptId);
      if (!appt?.doctorId) {
        setEditingPatient(null);
        setActiveApptId(null);
        setSubmitting(false);
        // Refresh data to get updated patient info, then show doctor selection modal
        await fetchData();
        setSelectedAppointmentForSchedule(appointments.find(a => a._id === activeApptId) || appt);
        setShowDoctorScheduleModal(true);
        return;
      }

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
              onClick={() => setFilterStatus('Pending')}
              className={filterStatus === 'Pending' ? 'active' : ''}
            >
              ⏳ Pending approval ({appointments.filter(a => a.status === 'Pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('Confirmed')}
              className={filterStatus === 'Confirmed' ? 'active' : ''}
            >
              ✅ Confirmed ({appointments.filter(a => a.status === 'Confirmed').length})
            </button>
            <button
              onClick={() => setFilterStatus('All')}
              className={filterStatus === 'All' ? 'active' : ''}
            >
              📅 All requests ({appointments.length})
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

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
