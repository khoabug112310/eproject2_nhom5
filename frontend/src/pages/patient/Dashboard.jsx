import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Footer from '../../components/Footer';
import BookingForm from './components/BookingForm';
import Swal from 'sweetalert2';

// ── helpers ──────────────────────────────────────────────────────────────────

function maskString(value, a = 3, b = 3) {
  if (!value) return '—';
  const s = String(value);
  if (s.length <= a + b) return s.replace(/.(?=.{2})/g, '*');
  return `${s.slice(0, a)}${'*'.repeat(Math.max(3, s.length - a - b))}${s.slice(-b)}`;
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'VND',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return amount || 0;
  }
}

function StatusPill({ status }) {
  const cls = { Pending: 'status-pending', Confirmed: 'status-confirmed', Completed: 'status-completed', Canceled: 'status-canceled' };
  return <span className={`status-pill ${cls[status] || ''}`}>{status || '—'}</span>;
}

const TABS = [
  { id: 'overview',      label: 'Overview',         icon: '▤' },
  { id: 'book',          label: 'Book Appointment',  icon: '+' },
  { id: 'appointments',  label: 'My Appointments',   icon: '◷' },
  { id: 'records',       label: 'Medical Records',   icon: '≡' },
  { id: 'invoices',      label: 'Invoices',          icon: '$' },
  { id: 'profile',       label: 'My Profile',        icon: '◉' },
];

// ── component ─────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const [activeTab, setActiveTab]           = useState('overview');
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [patient, setPatient]               = useState(null);
  const [appointments, setAppointments]     = useState([]);
  const [invoices, setInvoices]             = useState([]);
  const [records, setRecords]               = useState([]);
  const [expandedRecords, setExpandedRecords]   = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'Khác',
    phoneNumber: '', address: '', identityCard: '', insuranceCode: '',
  });
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage]       = useState('');

  // ── data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const patRes = await profilesAPI.getMyPatientProfile();
        const p = patRes.data?.data || null;
        if (!mounted) return;
        setPatient(p);
        if (p) {
          setProfileForm({
            fullName:      p.fullName || '',
            dateOfBirth:   p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().slice(0, 10) : '',
            gender:        p.gender || 'Khác',
            phoneNumber:   p.phoneNumber || '',
            address:       p.address || '',
            identityCard:  p.identityCard || '',
            insuranceCode: p.insuranceCode || '',
          });
        }

        const [apptsRes, invRes] = await Promise.all([
          schedulingAPI.getAppointments(),
          billingAPI.getInvoices(),
        ]);
        if (!mounted) return;
        setAppointments(apptsRes.data?.data || []);
        setInvoices(invRes.data?.data || []);

        if (p) {
          const recRes = await clinicalAPI.getMedicalRecords({ patientId: p._id });
          if (mounted) setRecords(recRes.data?.data || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load your dashboard data. Please refresh the page.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // ── refresh helpers ──────────────────────────────────────────────────────────

  const refreshAppointments = async () => {
    try { const r = await schedulingAPI.getAppointments(); setAppointments(r.data?.data || []); } catch {}
  };
  const refreshInvoices = async () => {
    try { const r = await billingAPI.getInvoices(); setInvoices(r.data?.data || []); } catch {}
  };

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel appointment?',
      text: 'This action cannot be undone.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, cancel it', cancelButtonText: 'Keep',
    });
    if (!result.isConfirmed) return;
    try {
      await schedulingAPI.updateAppointment(id, { status: 'Canceled' });
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch {
      setError('Could not cancel the appointment. Please try again.');
    }
  };

  const handlePayInvoice = async (invoice) => {
    if (invoice.status === 'Paid') return;
    const result = await Swal.fire({
      title: 'Confirm payment',
      text: `Pay ${invoice.invoiceType} invoice — ${formatCurrency(invoice.totalAmount || 0)}?`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#0d9488', cancelButtonColor: '#64748b',
      confirmButtonText: 'Pay now', cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setPaymentProcessing(true); setPaymentMessage('');
    try {
      await billingAPI.payInvoice(invoice._id);
      await refreshInvoices();
      setPaymentMessage('Payment successful.');
    } catch {
      setPaymentMessage('Payment failed. Please try again.');
    } finally { setPaymentProcessing(false); }
  };

  const handlePayAll = async () => {
    const unpaid = invoices.filter(i => i.status !== 'Paid');
    if (!unpaid.length) return;
    const result = await Swal.fire({
      title: `Pay all ${unpaid.length} unpaid invoice${unpaid.length > 1 ? 's' : ''}?`,
      text: `Total: ${formatCurrency(unpaid.reduce((s, i) => s + (i.totalAmount || 0), 0))}`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#0d9488', cancelButtonColor: '#64748b',
      confirmButtonText: 'Pay all', cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setPaymentProcessing(true); setPaymentMessage('');
    try {
      await Promise.all(unpaid.map(i => billingAPI.payInvoice(i._id)));
      await refreshInvoices();
      setPaymentMessage('All invoices paid successfully.');
    } catch {
      setPaymentMessage('Some payments failed. Please try again.');
    } finally { setPaymentProcessing(false); }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true); setProfileMessage('');
    try {
      const res = patient?._id
        ? await profilesAPI.updateMyPatientProfile(profileForm)
        : await profilesAPI.createMyPatientProfile(profileForm);
      const saved = res.data?.data;
      setPatient(saved);
      setProfileForm({
        fullName:      saved?.fullName || '',
        dateOfBirth:   saved?.dateOfBirth ? new Date(saved.dateOfBirth).toISOString().slice(0, 10) : '',
        gender:        saved?.gender || 'Khác',
        phoneNumber:   saved?.phoneNumber || '',
        address:       saved?.address || '',
        identityCard:  saved?.identityCard || '',
        insuranceCode: saved?.insuranceCode || '',
      });
      setProfileMessage('Profile updated successfully.');
    } catch {
      setProfileMessage('Could not save profile. Please try again.');
    } finally { setProfileSaving(false); }
  };

  // ── derived stats ────────────────────────────────────────────────────────────

  const upcoming  = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed');
  const unpaidCount = invoices.filter(i => i.status !== 'Paid').length;
  const totalOwed   = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0);

  // ── loading state ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="role-dashboard-shell">
        <RoleTopNav role="patient" />
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="patient" />

      {error && (
        <div style={{ maxWidth: 1440, margin: '16px auto', padding: '0 24px' }}>
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      <div className="dashboard-layout">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="dashboard-sidebar">

          {/* Patient quick-info */}
          <div className="patient-quick-info">
            <div className="p-avatar">
              {(patient?.fullName?.charAt(0) || 'U').toUpperCase()}
            </div>
            <h4>{patient?.fullName || 'Guest'}</h4>
            <p className="p-card-number">
              {patient?.phoneNumber ? maskString(patient.phoneNumber, 3, 3) : 'No phone on file'}
            </p>
          </div>

          {/* Navigation tabs */}
          <nav className="sidebar-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={activeTab === t.id ? 'active' : ''}
                onClick={() => setActiveTab(t.id)}
              >
                <span style={{ fontFamily: 'monospace', marginRight: 2 }}>{t.icon}</span>
                {' '}{t.label}
                {t.id === 'appointments' && upcoming.length > 0 && (
                  <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: 11 }}>{upcoming.length}</span>
                )}
                {t.id === 'invoices' && unpaidCount > 0 && (
                  <span className="badge badge-warning" style={{ marginLeft: 'auto', fontSize: 11 }}>{unpaidCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Support block */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Customer Care
            </p>
            <p style={{ fontSize: 13, margin: '0 0 4px' }}>Hotline: <strong>1900 6868</strong></p>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-muted)' }}>support@hopsontai.vn</p>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="dashboard-main-content animate-fade-in">

          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <>
              <div className="dashboard-card">
                <h2>Hello, {patient?.fullName || 'Guest'}</h2>
                <p className="subtitle">
                  Here's a summary of your health activity at Hopsontai Clinic.
                </p>
              </div>

              <div className="stats-cards-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontSize: 20 }}>◷</div>
                  <h3>{upcoming.length}</h3>
                  <p>Upcoming appointments</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontSize: 20 }}>≡</div>
                  <h3>{records.length}</h3>
                  <p>Medical records</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontSize: 20 }}>$</div>
                  <h3>{unpaidCount}</h3>
                  <p>Unpaid invoices</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontSize: 20 }}>✓</div>
                  <h3>{appointments.filter(a => a.status === 'Completed').length}</h3>
                  <p>Completed visits</p>
                </div>
              </div>

              {unpaidCount > 0 && (
                <div className="dashboard-card" style={{ background: 'var(--color-warning-light)', borderColor: '#fde68a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <strong style={{ color: 'var(--color-warning)' }}>Outstanding balance</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-body)' }}>
                        You have {unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''} totalling <strong>{formatCurrency(totalOwed)}</strong>.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('invoices')}>
                      View &amp; Pay
                    </button>
                  </div>
                </div>
              )}

              <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Recent Appointments</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('appointments')}>View all</button>
                </div>
                {appointments.length === 0 ? (
                  <div className="empty-state">
                    No appointments yet.{' '}
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={() => setActiveTab('book')}>
                      Book now
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr><th>Date</th><th>Time</th><th>Department</th><th>Doctor</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {appointments.slice(0, 5).map(a => (
                          <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => setSelectedAppointment(a)}>
                            <td>{new Date(a.requestedDate).toLocaleDateString('en-US')}</td>
                            <td className="monospace">{a.requestedTime || '—'}</td>
                            <td>{a.departmentId?.departmentName || 'General'}</td>
                            <td>{a.doctorId?.fullName ? `Dr. ${a.doctorId.fullName}` : '—'}</td>
                            <td><StatusPill status={a.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="dashboard-card">
                <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('book')}>Book Appointment</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('records')}>Medical Records</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('invoices')}>Invoices</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('profile')}>Edit Profile</button>
                </div>
              </div>
            </>
          )}

          {/* ── Book Appointment tab ── */}
          {activeTab === 'book' && (
            <div className="dashboard-card">
              <BookingForm
                onBooked={() => {
                  refreshAppointments();
                  setActiveTab('appointments');
                }}
              />
            </div>
          )}

          {/* ── My Appointments tab ── */}
          {activeTab === 'appointments' && (
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>My Appointments</h2>
                  <p className="subtitle">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} on record</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('book')}>+ New booking</button>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state">You have no appointments yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Time</th><th>Department</th>
                        <th>Doctor</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(a => (
                        <tr key={a._id}>
                          <td>{new Date(a.requestedDate).toLocaleDateString('en-US')}</td>
                          <td className="monospace">{a.requestedTime || '—'}</td>
                          <td>{a.departmentId?.departmentName || 'General'}</td>
                          <td>{a.doctorId?.fullName ? `Dr. ${a.doctorId.fullName}` : '—'}</td>
                          <td><StatusPill status={a.status} /></td>
                          <td>
                            <div className="btn-cell">
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setSelectedAppointment(a)}
                              >
                                Details
                              </button>
                              {a.status === 'Pending' && (
                                <button
                                  className="btn btn-xs"
                                  style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
                                  onClick={() => handleCancel(a._id)}
                                >
                                  Cancel
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
          )}

          {/* ── Medical Records tab ── */}
          {activeTab === 'records' && (
            <div className="dashboard-card">
              <h2 style={{ margin: '0 0 20px', fontSize: 19 }}>Medical Records</h2>

              {records.length === 0 ? (
                <div className="empty-state">
                  No medical records yet. Records will appear here after your first visit.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {records.map(r => {
                    const expanded = expandedRecords.includes(r._id);
                    return (
                      <div
                        key={r._id}
                        style={{
                          border: '1px solid var(--color-border)', borderRadius: 12,
                          overflow: 'hidden', background: 'var(--color-surface)',
                        }}
                      >
                        {/* Record header row */}
                        <div
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 18px', cursor: 'pointer',
                          }}
                          onClick={() =>
                            setExpandedRecords(prev =>
                              expanded ? prev.filter(x => x !== r._id) : [...prev, r._id]
                            )
                          }
                        >
                          <div>
                            <strong style={{ fontSize: 14 }}>
                              {new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </strong>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                              {r.appointmentId?.departmentId?.departmentName || 'General'}
                              {r.doctorId?.fullName ? ` · Dr. ${r.doctorId.fullName}` : ''}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {r.diagnosis && (
                              <span className="badge badge-info" style={{ fontSize: 11 }}>
                                {r.diagnosis.length > 30 ? r.diagnosis.slice(0, 30) + '…' : r.diagnosis}
                              </span>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setExpandedRecords(prev => expanded ? prev.filter(x => x !== r._id) : [...prev, r._id]); }}>
                              {expanded ? 'Hide' : 'View details'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded vitals + summary */}
                        {expanded && (
                          <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 18px', background: '#f8fafc' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                                  Vitals
                                </p>
                                {[
                                  ['Height', r.height ? `${r.height} cm` : '—'],
                                  ['Weight', r.weight ? `${r.weight} kg` : '—'],
                                  ['Blood pressure', r.bloodPressure || '—'],
                                  ['Heart rate', r.heartRate ? `${r.heartRate} bpm` : '—'],
                                  ['Temperature', r.temperature ? `${r.temperature} °C` : '—'],
                                ].map(([label, value]) => (
                                  <p key={label} style={{ fontSize: 13, margin: '4px 0' }}>
                                    {label}: <strong>{value}</strong>
                                  </p>
                                ))}
                              </div>
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                                  Clinical Summary
                                </p>
                                <p style={{ fontSize: 13, margin: '0 0 6px' }}>
                                  Diagnosis: <strong>{r.diagnosis || '—'}</strong>
                                </p>
                                {r.clinicalNotes && (
                                  <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-body)' }}>
                                    Notes: {r.clinicalNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Invoices tab ── */}
          {activeTab === 'invoices' && (
            <div className="dashboard-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19 }}>Invoices</h2>
                  <p className="subtitle">
                    {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                    {unpaidCount > 0 ? ` · ${unpaidCount} unpaid` : ' · All paid'}
                  </p>
                </div>
                {unpaidCount > 0 && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handlePayAll}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? 'Processing…' : `Pay all ${unpaidCount} unpaid`}
                  </button>
                )}
              </div>

              {paymentMessage && (
                <div
                  className={`alert ${paymentMessage.toLowerCase().includes('fail') ? 'alert-danger' : 'alert-success'}`}
                  style={{ marginBottom: 16 }}
                >
                  {paymentMessage}
                </div>
              )}

              {invoices.length === 0 ? (
                <div className="empty-state">No invoices yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv._id}>
                          <td className="text-muted">
                            {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-US')}
                          </td>
                          <td>{inv.invoiceType}</td>
                          <td className="font-bold">{formatCurrency(inv.totalAmount || 0)}</td>
                          <td>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Refunded' ? 'badge-info' : 'badge-warning'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            {inv.status !== 'Paid' && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handlePayInvoice(inv)}
                                disabled={paymentProcessing}
                              >
                                Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div className="dashboard-card">
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ margin: 0, fontSize: 19 }}>My Profile</h2>
                <p className="subtitle">Keep your personal information up to date.</p>
              </div>

              <div className="grid-form">
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Date of birth</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={e => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="Khác">Other</option>
                    <option value="Nam">Male</option>
                    <option value="Nữ">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone number</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={e => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="e.g. 0901 234 567"
                  />
                </div>
                <div className="form-group">
                  <label>ID card number</label>
                  <input
                    type="text"
                    value={profileForm.identityCard}
                    onChange={e => setProfileForm(p => ({ ...p, identityCard: e.target.value }))}
                    placeholder="National ID / CCCD"
                  />
                </div>
                <div className="form-group">
                  <label>Health insurance number</label>
                  <input
                    type="text"
                    value={profileForm.insuranceCode}
                    onChange={e => setProfileForm(p => ({ ...p, insuranceCode: e.target.value }))}
                    placeholder="e.g. DN4500…"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    rows={3}
                    value={profileForm.address}
                    onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Street, district, city"
                  />
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`alert ${profileMessage.toLowerCase().includes('success') ? 'alert-success' : 'alert-danger'}`}
                  style={{ marginBottom: 16 }}
                >
                  {profileMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Appointment detail modal ── */}
      {selectedAppointment && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setSelectedAppointment(null); }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3>Appointment Details</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {selectedAppointment.departmentId?.departmentName || 'General Department'}
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedAppointment(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 16 }}>
                <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(selectedAppointment.requestedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style={{ margin: 0 }}><strong>Time:</strong> {selectedAppointment.requestedTime || '—'}</p>
                <p style={{ margin: 0 }}><strong>Status:</strong> <StatusPill status={selectedAppointment.status} /></p>
                <p style={{ margin: 0 }}><strong>Room:</strong> {selectedAppointment.scheduleId?.room || 'To be confirmed'}</p>
                <p style={{ margin: 0 }}><strong>Doctor:</strong> {selectedAppointment.doctorId?.fullName ? `Dr. ${selectedAppointment.doctorId.fullName}` : 'Not yet assigned'}</p>
                <p style={{ margin: 0 }}><strong>Specialty:</strong> {selectedAppointment.departmentId?.departmentName || 'General'}</p>
              </div>

              {selectedAppointment.symptoms && (
                <div style={{ padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>
                    Symptoms / Description
                  </p>
                  <p style={{ fontSize: 14, margin: 0 }}>{selectedAppointment.symptoms}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedAppointment.status === 'Pending' && (
                <button
                  className="btn btn-xs"
                  style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
                  onClick={() => { handleCancel(selectedAppointment._id); setSelectedAppointment(null); }}
                >
                  Cancel appointment
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedAppointment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
