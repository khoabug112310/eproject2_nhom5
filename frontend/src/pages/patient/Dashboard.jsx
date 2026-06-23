import React, { useState, useEffect, useMemo } from 'react';
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
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'Khác',
    phoneNumber: '', address: '', identityCard: '', insuranceCode: '', email: '',
  });
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [subaccounts, setSubaccounts] = useState([]);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [subForm, setSubForm] = useState({
    fullName: '', dateOfBirth: '', gender: 'Khác',
    phoneNumber: '', address: '', identityCard: '', insuranceCode: '',
    category: 'Adult',
  });
  const [subSaving, setSubSaving] = useState(false);
  const [subError, setSubError] = useState('');

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage]       = useState('');

  const [expandedInvoiceGroups, setExpandedInvoiceGroups] = useState([]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yearsAgo = (years) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    return d.toISOString().slice(0, 10);
  };
  const minDobPrimary = yearsAgo(120);
  const maxDobPrimary = yearsAgo(14);
  const minDobChild = yearsAgo(14);
  const maxDobChild = todayStr;

  const groupedInvoices = useMemo(() => {
    const groups = {};
    invoices.forEach(inv => {
      const patientId = inv.patientId?._id || 'unknown';
      const patientName = inv.patientId?.fullName || 'Guest';
      const isSub = !!inv.patientId?.parentId;
      if (!groups[patientId]) {
        groups[patientId] = {
          patientId,
          patientName,
          isSubAccount: isSub,
          list: [],
        };
      }
      groups[patientId].list.push(inv);
    });
    return Object.values(groups);
  }, [invoices]);

  useEffect(() => {
    if (invoices.length > 0) {
      const ids = [...new Set(invoices.map(i => i.patientId?._id).filter(Boolean))];
      setExpandedInvoiceGroups(ids);
    }
  }, [invoices]);

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
            email:         p.email || '',
          });
        }

        const [apptsRes, invRes, subsRes] = await Promise.all([
          schedulingAPI.getAppointments(),
          billingAPI.getInvoices(),
          profilesAPI.getSubAccounts(),
        ]);
        if (!mounted) return;
        setAppointments(apptsRes.data?.data || []);
        setInvoices(invRes.data?.data || []);
        setSubaccounts(subsRes.data?.data || []);

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

  const resetProfileForm = () => {
    if (patient) {
      setProfileForm({
        fullName:      patient.fullName || '',
        dateOfBirth:   patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : '',
        gender:        patient.gender || 'Khác',
        phoneNumber:   patient.phoneNumber || '',
        address:       patient.address || '',
        identityCard:  patient.identityCard || '',
        insuranceCode: patient.insuranceCode || '',
        email:         patient.email || '',
      });
    }
  };

  const refreshSubaccounts = async () => {
    try {
      const res = await profilesAPI.getSubAccounts();
      setSubaccounts(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSubAccount = async (e) => {
    e.preventDefault();
    if (!subForm.fullName || !subForm.dateOfBirth || !subForm.gender) {
      setSubError('Please fill in all required fields.');
      return;
    }

    // Double check DOB limits programmatically
    const dobDate = new Date(subForm.dateOfBirth);
    const today = new Date();
    const age = (today - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (subForm.category === 'Child') {
      if (age >= 14) {
        setSubError('A child dependent must be under 14 years old.');
        return;
      }
      if (age < 0) {
        setSubError('Date of birth cannot be in the future.');
        return;
      }
    } else {
      if (age < 14) {
        setSubError('An adult/elderly dependent must be at least 14 years old.');
        return;
      }
      if (age > 120) {
        setSubError('Age cannot exceed 120 years.');
        return;
      }
    }

    setSubSaving(true);
    setSubError('');
    try {
      await profilesAPI.createSubAccount(subForm);
      await refreshSubaccounts();
      setShowAddSubModal(false);
      setSubForm({ fullName: '', dateOfBirth: '', gender: 'Khác', phoneNumber: '', address: '', identityCard: '', insuranceCode: '', category: 'Adult' });
      Swal.fire({ icon: 'success', title: 'Dependent added successfully', showConfirmButton: false, timer: 1500 });
    } catch (err) {
      setSubError(err.response?.data?.message || 'An error occurred while creating dependent profile.');
    } finally {
      setSubSaving(false);
    }
  };

  const handleDeleteSubAccount = async (id) => {
    const result = await Swal.fire({
      title: 'Delete dependent profile?',
      text: 'All related history will be permanently deleted.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete', cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await profilesAPI.deleteSubAccount(id);
      await refreshSubaccounts();
      Swal.fire({ icon: 'success', title: 'Dependent deleted', showConfirmButton: false, timer: 1500 });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete dependent profile.' });
    }
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
    if (!profileForm.fullName || !profileForm.dateOfBirth || !profileForm.gender) {
      setProfileMessage('Please fill in all required fields.');
      return;
    }
    // Verify DOB limit programmatically
    const dobDate = new Date(profileForm.dateOfBirth);
    const today = new Date();
    const age = (today - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 14) {
      setProfileMessage('Primary account holder must be at least 14 years old.');
      return;
    }
    if (age > 120) {
      setProfileMessage('Primary account holder age cannot exceed 120 years.');
      return;
    }

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
        email:         saved?.email || '',
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
                      <strong style={{ color: 'var(--color-warning)' }}>Outstanding Balance</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-body)' }}>
                        You have {unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''} totalling <strong>{formatCurrency(totalOwed)}</strong>. Please settle your payment directly at the clinic cashier counter.
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('invoices')}>
                      View Details
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
                  <h2 style={{ margin: 0, fontSize: 19 }}>Billing & Invoices</h2>
                  <p className="subtitle">
                    Please settle your outstanding payments directly at the clinic cashier counter.
                  </p>
                </div>
              </div>

              {groupedInvoices.length === 0 ? (
                <div className="empty-state">No invoices found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {groupedInvoices.map(group => {
                    const isExpanded = expandedInvoiceGroups.includes(group.patientId);
                    const groupUnpaid = group.list.filter(i => i.status !== 'Paid');
                    const groupOwed = groupUnpaid.reduce((s, i) => s + (i.totalAmount || 0), 0);
                    
                    return (
                      <div 
                        key={group.patientId}
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          overflow: 'hidden',
                          background: 'var(--color-surface)',
                        }}
                      >
                        {/* Header bar */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            background: 'var(--color-bg-light, #f8fafc)',
                            userSelect: 'none',
                          }}
                          onClick={() => {
                            setExpandedInvoiceGroups(prev =>
                              isExpanded ? prev.filter(id => id !== group.patientId) : [...prev, group.patientId]
                            );
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 15 }}>{group.patientName}</strong>
                            {group.isSubAccount ? (
                              <span className="badge badge-info" style={{ fontSize: 10 }}>Dependent</span>
                            ) : (
                              <span className="badge badge-primary" style={{ fontSize: 10 }}>Primary</span>
                            )}
                            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                              ({group.list.length} invoice{group.list.length !== 1 ? 's' : ''})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {groupUnpaid.length > 0 ? (
                              <span className="badge badge-warning" style={{ fontSize: 11 }}>
                                {groupUnpaid.length} Unpaid ({formatCurrency(groupOwed)})
                              </span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: 11 }}>Fully Paid</span>
                            )}
                            <span style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible list table */}
                        {isExpanded && (
                          <div style={{ padding: '16px 18px', borderTop: '1px solid var(--color-border)' }}>
                            <div className="table-responsive">
                              <table className="custom-table" style={{ margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th>Issued Date</th>
                                    <th>Invoice Type</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.list.map(inv => (
                                    <tr key={inv._id}>
                                      <td className="text-muted">
                                        {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-US')}
                                      </td>
                                      <td>
                                        <span style={{ fontWeight: 500 }}>
                                          {inv.invoiceType === 'Consultation' ? '🩺 Clinical Exam' : '💊 Pharmacy'}
                                        </span>
                                      </td>
                                      <td className="font-bold text-teal">{formatCurrency(inv.totalAmount || 0)}</td>
                                      <td>
                                        <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : inv.status === 'Refunded' ? 'badge-info' : 'badge-warning'}`}>
                                          {inv.status === 'Paid' ? 'Paid' : inv.status === 'Refunded' ? 'Refunded' : 'Unpaid'}
                                        </span>
                                      </td>
                                      <td>
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                          onClick={() => setSelectedInvoice(inv)}
                                        >
                                          View Details
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="dashboard-card">
                <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19 }}>Personal Profile</h2>
                    <p className="subtitle">Update and manage your personal health profile.</p>
                  </div>
                  {!isEditingProfile && (
                    <button className="btn btn-primary" onClick={() => setIsEditingProfile(true)}>
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>

                <div className="grid-form">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Enter full name"
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      min={minDobPrimary}
                      max={maxDobPrimary}
                      onChange={e => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={profileForm.gender}
                      onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                      disabled={!isEditingProfile}
                    >
                      <option value="Nam">Male</option>
                      <option value="Nữ">Female</option>
                      <option value="Khác">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      value={profileForm.phoneNumber}
                      onChange={e => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder="e.g. 0901 234 567"
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="e.g. email@example.com"
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group">
                    <label>National ID / Identity Card *</label>
                    <input
                      type="text"
                      value={profileForm.identityCard}
                      onChange={e => setProfileForm(p => ({ ...p, identityCard: e.target.value }))}
                      placeholder="Enter ID card number"
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group">
                    <label>Health Insurance Code (HI)</label>
                    <input
                      type="text"
                      value={profileForm.insuranceCode}
                      onChange={e => setProfileForm(p => ({ ...p, insuranceCode: e.target.value }))}
                      placeholder="e.g. DN4500..."
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Permanent Address</label>
                    <textarea
                      rows={3}
                      value={profileForm.address}
                      onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="House number, street, ward/commune, district, city"
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>

                {profileMessage && (
                  <div
                    className={`alert ${profileMessage.toLowerCase().includes('success') ? 'alert-success' : 'alert-danger'}`}
                    style={{ marginTop: 16, marginBottom: 0 }}
                  >
                    {profileMessage}
                  </div>
                )}

                {isEditingProfile && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        await handleSaveProfile();
                        setIsEditingProfile(false);
                      }}
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setIsEditingProfile(false);
                        resetProfileForm();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Dependents sub-accounts section */}
              <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19 }}>Family Dependents (Sub-accounts)</h2>
                    <p className="subtitle" style={{ margin: '4px 0 0' }}>
                      Register for children or elderly family members without their own phone numbers so they can be selected by name during bookings.
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubModal(true)}>
                    ➕ Add Dependent
                  </button>
                </div>

                {subaccounts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    No family dependents registered yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Category</th>
                          <th>Date of Birth</th>
                          <th>Gender</th>
                          <th>Insurance Code</th>
                          <th>Address</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subaccounts.map(sub => (
                          <tr key={sub._id}>
                            <td>
                              <strong>{sub.fullName}</strong>
                            </td>
                            <td>
                              <span className={`badge ${sub.category === 'Child' ? 'badge-info' : 'badge-primary'}`}>
                                {sub.category === 'Child' ? 'Child' : 'Adult/Elderly'}
                              </span>
                            </td>
                            <td>{new Date(sub.dateOfBirth).toLocaleDateString('en-US')}</td>
                            <td>{sub.gender === 'Nam' ? 'Male' : sub.gender === 'Nữ' ? 'Female' : 'Other'}</td>
                            <td>{sub.insuranceCode || '—'}</td>
                            <td>{sub.address || '—'}</td>
                            <td>
                              <button
                                className="btn btn-xs"
                                style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid #fecaca' }}
                                onClick={() => handleDeleteSubAccount(sub._id)}
                              >
                                Delete
                              </button>
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

      {/* ── Invoice detail modal ── */}
      {selectedInvoice && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setSelectedInvoice(null); }}
        >
          <div className="modal-content" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <div>
                <h3>Invoice Details</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Invoice ID: {selectedInvoice._id}
                </p>
              </div>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: 20 }}>
                <p style={{ margin: 0 }}><strong>Patient:</strong> {selectedInvoice.patientId?.fullName || '—'}</p>
                <p style={{ margin: 0 }}><strong>Issued Date:</strong> {new Date(selectedInvoice.issuedAt || selectedInvoice.createdAt).toLocaleDateString('en-US')}</p>
                <p style={{ margin: 0 }}><strong>Invoice Type:</strong> {selectedInvoice.invoiceType === 'Consultation' ? '🩺 Clinical Exam' : '💊 Pharmacy'}</p>
                <p style={{ margin: 0 }}><strong>Status:</strong> <span className={`badge ${selectedInvoice.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{selectedInvoice.status === 'Paid' ? 'Paid' : 'Unpaid'}</span></p>
                {selectedInvoice.paidAt && (
                  <p style={{ margin: 0 }}><strong>Paid Date:</strong> {new Date(selectedInvoice.paidAt).toLocaleString('en-US')}</p>
                )}
                {selectedInvoice.processedBy && (
                  <p style={{ margin: 0 }}><strong>Processed By:</strong> {selectedInvoice.processedBy.fullName || 'Clinic Cashier'}</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 15 }}>Detailed Fee Charges</h4>
                {selectedInvoice.invoiceType === 'Consultation' ? (
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Clinical examination fee (with assigned doctor)</span>
                    <strong>{formatCurrency(selectedInvoice.totalAmount || 0)}</strong>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table" style={{ fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Medicine Name</th>
                          <th>Usage Route</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.details && selectedInvoice.details.length > 0 ? (
                          selectedInvoice.details.map((det, idx) => {
                            const route = det.medicineId?.usageRoute === 'Uống' ? 'Oral' : det.medicineId?.usageRoute === 'Bôi' ? 'Topical' : det.medicineId?.usageRoute === 'Tiêm' ? 'Injection' : (det.medicineId?.usageRoute || 'Oral');
                            const unit = det.medicineId?.unit === 'vi' || det.medicineId?.unit === 'vỉ' ? 'tablet(s)' : det.medicineId?.unit === 'chai' ? 'bottle(s)' : (det.medicineId?.unit || 'item(s)');
                            return (
                              <tr key={idx}>
                                <td>{det.medicineId?.medicineName || 'Medical Item'}</td>
                                <td>{route}</td>
                                <td>{det.quantity} {unit}</td>
                                <td>{formatCurrency(det.unitPrice || 0)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(det.subTotal || 0)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted">No medicine details found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, fontSize: 16, fontWeight: 700 }}>
                Total: <span className="text-teal" style={{ marginLeft: 10 }}>{formatCurrency(selectedInvoice.totalAmount || 0)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add sub-account modal ── */}
      {showAddSubModal && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setShowAddSubModal(false); }}
        >
          <div className="modal-content" style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3>➕ Register Family Dependent</h3>
              <button className="close-btn" onClick={() => setShowAddSubModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveSubAccount}>
              <div className="modal-body">
                {subError && <div className="alert alert-danger">{subError}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={subForm.category}
                      onChange={e => {
                        const val = e.target.value;
                        setSubForm(p => ({
                          ...p,
                          category: val,
                          dateOfBirth: '',
                          identityCard: val === 'Child' ? '' : p.identityCard,
                          phoneNumber: val === 'Child' ? '' : p.phoneNumber,
                        }));
                      }}
                      required
                    >
                      <option value="Adult">Adult / Elderly</option>
                      <option value="Child">Child (Under 14 years old)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={subForm.fullName}
                      onChange={e => setSubForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Dependent's full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      value={subForm.dateOfBirth}
                      min={subForm.category === 'Child' ? minDobChild : minDobPrimary}
                      max={subForm.category === 'Child' ? maxDobChild : maxDobPrimary}
                      onChange={e => setSubForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={subForm.gender}
                      onChange={e => setSubForm(p => ({ ...p, gender: e.target.value }))}
                      required
                    >
                      <option value="Nam">Male</option>
                      <option value="Nữ">Female</option>
                      <option value="Khác">Other</option>
                    </select>
                  </div>

                  {subForm.category !== 'Child' && (
                    <>
                      <div className="form-group">
                        <label>Phone Number (Optional)</label>
                        <input
                          type="text"
                          value={subForm.phoneNumber}
                          onChange={e => setSubForm(p => ({ ...p, phoneNumber: e.target.value }))}
                          placeholder="e.g. 0901 234 567"
                        />
                      </div>

                      <div className="form-group">
                        <label>National ID / Identity Card (Optional)</label>
                        <input
                          type="text"
                          value={subForm.identityCard}
                          onChange={e => setSubForm(p => ({ ...p, identityCard: e.target.value }))}
                          placeholder="National ID card number"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Health Insurance Code (Optional)</label>
                    <input
                      type="text"
                      value={subForm.insuranceCode}
                      onChange={e => setSubForm(p => ({ ...p, insuranceCode: e.target.value }))}
                      placeholder="e.g. DN4500..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Address</label>
                    <input
                      type="text"
                      value={subForm.address}
                      onChange={e => setSubForm(p => ({ ...p, address: e.target.value }))}
                      placeholder="Leave blank if same as your address"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddSubModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={subSaving}>
                  {subSaving ? 'Saving...' : 'Add Dependent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
