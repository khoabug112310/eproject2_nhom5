import React, { useState, useEffect, useMemo } from 'react';
import { schedulingAPI, profilesAPI } from '../../services/api';
import Swal from 'sweetalert2';
import RoleTopNav from '../../components/RoleTopNav';
import DoctorScheduleModal from '../../components/DoctorScheduleModal';

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
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [banner, setBanner]             = useState({ msg: '', type: '' });

  const [filterStatus, setFilterStatus] = useState('Pending');
  const [search, setSearch]             = useState('');

  // patient profile modal
  const [editingAppt, setEditingAppt] = useState(null);
  const [patientForm, setPatientForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'Nam',
    identityCard: '', phoneNumber: '', address: '',
    insuranceCode: '', emergencyContact: '',
  });

  // doctor schedule modal
  const [scheduleAppt, setScheduleAppt] = useState(null);

  // appointment detail drawer
  const [detailAppt, setDetailAppt] = useState(null);

  // ── data ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

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

  const handleOpenEditModal = (appt) => {
    const p = appt.patientId;
    setEditingAppt(appt);
    setPatientForm({
      fullName:        p?.fullName || '',
      dateOfBirth:     p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
      gender:          p?.gender || 'Nam',
      identityCard:    p?.identityCard || '',
      phoneNumber:     p?.phoneNumber || '',
      address:         p?.address || '',
      insuranceCode:   p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
    });
  };

  const handleUpdateAndConfirm = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;
    setSubmitting(true);
    try {
      const payload = { ...patientForm };
      if (!payload.insuranceCode?.trim()) delete payload.insuranceCode;
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

              {/* Search */}
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
                              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p?.phoneNumber || '—'}</span>
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
                                <button
                                  className="btn btn-xs"
                                  style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid #fde68a' }}
                                  onClick={() => handleCancel(appt)}
                                  disabled={submitting}
                                >
                                  Cancel
                                </button>
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
        </div>
      </div>

      {/* ── Appointment detail modal ── */}
      {detailAppt && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setDetailAppt(null); }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Appointment Details</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {detailAppt.departmentId?.departmentName || 'General'}
                </p>
              </div>
              <button className="close-btn" onClick={() => setDetailAppt(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 14 }}>
                <p style={{ margin: 0 }}><strong>Patient:</strong> {detailAppt.patientId?.fullName || '—'}</p>
                <p style={{ margin: 0 }}><strong>Phone:</strong> {detailAppt.patientId?.phoneNumber || '—'}</p>
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

      {/* ── Doctor schedule modal ── */}
      {scheduleAppt && (
        <DoctorScheduleModal
          appointment={scheduleAppt}
          onClose={() => setScheduleAppt(null)}
          onConfirm={handleDoctorConfirm}
          isLoading={submitting}
        />
      )}
    </div>
  );
}
