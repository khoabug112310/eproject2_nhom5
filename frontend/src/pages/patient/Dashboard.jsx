import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Footer from '../../components/Footer';
import PatientSidebar from './components/PatientSidebar';
import BookingForm from './components/BookingForm';
import Swal from 'sweetalert2';

export default function PatientDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);
  const [expandedRecords, setExpandedRecords] = useState([]);
  const [expandedInvoices, setExpandedInvoices] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [showAppointmentsSection, setShowAppointmentsSection] = useState(false);
  const [showPaymentsSection, setShowPaymentsSection] = useState(false);
  const [showBookingSection, setShowBookingSection] = useState(false);
  const [showRecordsSection, setShowRecordsSection] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Khác',
    phoneNumber: '',
    address: '',
    identityCard: '',
    insuranceCode: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const patientRes = await profilesAPI.getMyPatientProfile();
        const currentPatient = patientRes.data?.data || null;
        if (mounted) setPatient(currentPatient);
        if (mounted && currentPatient) {
          setProfileForm({
            fullName: currentPatient.fullName || '',
            dateOfBirth: currentPatient.dateOfBirth ? new Date(currentPatient.dateOfBirth).toISOString().slice(0, 10) : '',
            gender: currentPatient.gender || 'Khác',
            phoneNumber: currentPatient.phoneNumber || '',
            address: currentPatient.address || '',
            identityCard: currentPatient.identityCard || '',
            insuranceCode: currentPatient.insuranceCode || ''
          });
        }

        const apptsRes = await schedulingAPI.getAppointments();
        if (mounted) setAppointments(apptsRes.data?.data || []);

        const invRes = await billingAPI.getInvoices();
        if (mounted) setInvoices(invRes.data?.data || []);

        if (currentPatient) {
          const recRes = await clinicalAPI.getMedicalRecords({ patientId: currentPatient._id });
          if (mounted) setRecords(recRes.data?.data || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // helper to open a specific panel and close others; scroll it into view
    const openPanel = (panelId) => {
      const isOpen = (
        (panelId === 'book' && showBookingSection) ||
        (panelId === 'appointments' && showAppointmentsSection) ||
        (panelId === 'payments' && showPaymentsSection) ||
        (panelId === 'records' && showRecordsSection)
      );

      // toggle: if already open, close all; otherwise open the requested and close others
      if (isOpen) {
        setShowBookingSection(false);
        setShowAppointmentsSection(false);
        setShowPaymentsSection(false);
        setShowRecordsSection(false);
        return;
      }

      setShowBookingSection(panelId === 'book');
      setShowAppointmentsSection(panelId === 'appointments');
      setShowPaymentsSection(panelId === 'payments');
      setShowRecordsSection(panelId === 'records');

      // scroll to the panel after a tick so DOM updates
      setTimeout(() => {
        const el = document.getElementById(panelId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // fallback: scroll main column to top
          const main = document.querySelector('.patient-dashboard__main');
          main?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    };

    const onToggleAppointments = () => openPanel('appointments');
    const onTogglePayments = () => openPanel('payments');
    const onToggleBooking = () => openPanel('book');
    const onToggleRecords = () => openPanel('records');

    window.addEventListener('toggleAppointments', onToggleAppointments);
    window.addEventListener('togglePayments', onTogglePayments);
    window.addEventListener('toggleBooking', onToggleBooking);
    window.addEventListener('toggleRecords', onToggleRecords);

    return () => {
      window.removeEventListener('toggleAppointments', onToggleAppointments);
      window.removeEventListener('togglePayments', onTogglePayments);
      window.removeEventListener('toggleBooking', onToggleBooking);
      window.removeEventListener('toggleRecords', onToggleRecords);
    };
  }, []);

  const refreshAppointments = async () => {
    try {
      const apptsRes = await schedulingAPI.getAppointments();
      setAppointments(apptsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshInvoices = async () => {
    try {
      const invRes = await billingAPI.getInvoices();
      setInvoices(invRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayAllUnpaid = async () => {
    const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid');
    if (unpaidInvoices.length === 0) {
      setPaymentMessage('No unpaid invoices.');
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm payment',
      text: 'Do you want to pay all unpaid invoices?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Pay',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await Promise.all(unpaidInvoices.map((inv) => billingAPI.payInvoice(inv._id)));
      await refreshInvoices();
      setPaymentMessage('Successfully paid all unpaid invoices.');
    } catch (err) {
      console.error(err);
      setPaymentMessage('Payment failed. Please try again later.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayInvoice = async (invoice) => {
    if (invoice.status === 'Paid') {
      setPaymentMessage('This invoice has already been paid.');
      return;
    }
    const result = await Swal.fire({
      title: 'Confirm payment',
      text: `Are you sure you want to pay the ${translateInvoiceType(invoice.invoiceType)} of ${formatCurrency(invoice.totalAmount || 0)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Pay',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await billingAPI.payInvoice(invoice._id);
      await refreshInvoices();
      setPaymentMessage(`Successfully paid invoice of ${formatCurrency(invoice.totalAmount || 0)}.`);
    } catch (err) {
      console.error(err);
      setPaymentMessage('Could not pay the invoice. Please try again later.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(amount) || 0);
    } catch (e) {
      return amount || 0;
    }
  };

  const translateInvoiceType = (type) => {
    if (!type) return 'Invoice';
    if (type === 'Consultation') return 'Consultation Invoice';
    if (type === 'Pharmacy') return 'Pharmacy Invoice';
    return type;
  };

  const translateInvoiceStatus = (status) => {
    if (!status) return '';
    if (status === 'Unpaid') return 'Unpaid';
    if (status === 'Paid') return 'Paid';
    if (status === 'Refunded') return 'Refunded';
    return status;
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Confirm cancellation',
      text: 'Are you sure you want to cancel this appointment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Cancel appointment',
      cancelButtonText: 'Close'
    });
    if (!result.isConfirmed) return;
    try {
      await schedulingAPI.updateAppointment(id, { status: 'Canceled' });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      setError('Could not cancel the appointment.');
    }
  };

  const handleToggleRecord = (id) => {
    setExpandedRecords((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleInvoice = (id) => {
    setExpandedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setProfileForm({
      fullName: patient.fullName || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : '',
      gender: patient.gender || 'Khác',
      phoneNumber: patient.phoneNumber || '',
      address: patient.address || '',
      identityCard: patient.identityCard || '',
      insuranceCode: patient.insuranceCode || ''
    });
    setProfileMessage('');
    setIsEditingProfile(true);
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage('');
    try {
      const response = patient?._id
        ? await profilesAPI.updateMyPatientProfile(profileForm)
        : await profilesAPI.createMyPatientProfile(profileForm);
      const savedPatient = response.data?.data;
      setPatient(savedPatient);
      setProfileForm({
        fullName: savedPatient?.fullName || '',
        dateOfBirth: savedPatient?.dateOfBirth ? new Date(savedPatient.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: savedPatient?.gender || 'Khác',
        phoneNumber: savedPatient?.phoneNumber || '',
        address: savedPatient?.address || '',
        identityCard: savedPatient?.identityCard || '',
        insuranceCode: savedPatient?.insuranceCode || ''
      });
      setProfileMessage('Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      setProfileMessage('Could not update your profile. Please try again later.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleShowAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(null);
    setShowAppointmentModal(false);
  };

  if (loading) {
    return (
      <div>
        <RoleTopNav role="patient" />
        <main>
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <RoleTopNav role="patient" />
      <main className="patient-dashboard">
        {error && <div className="alert alert--error">{error}</div>}

        <div className="patient-dashboard__hero card">
          <div>
            <h3>Hello, {patient?.fullName || 'guest'}</h3>
            <p>View your appointments, payments, and medical records at a glance.</p>
          </div>
        </div>

        <div className="patient-dashboard__grid">
          <div className="patient-dashboard__main">
            <div className={`patient-dashboard__panels ${
              (showBookingSection || showAppointmentsSection || showPaymentsSection || showRecordsSection) ? 'is-full' : ''
            }`}>
              {showAppointmentsSection && (
                <section id="appointments" className="card patient-card">
                  <div className="card-title-bar">
                    <h4>Upcoming appointments</h4>
                  </div>
                  {appointments.length === 0 ? (
                    <div className="patient-empty">You have no appointments yet.</div>
                  ) : (
                    <ul className="appointment-list">
                      {appointments.slice(0, 5).map((a) => (
                        <li key={a._id} className="appointment-item">
                          <div>
                            <strong>{new Date(a.requestedDate).toLocaleDateString('en-US')}</strong>
                            <div>{a.requestedTime} · {a.departmentId?.departmentName || 'General'}</div>
                          </div>
                          <div className="appointment-item__actions">
                            <button
                              className="btn btn-secondary btn-xs"
                              type="button"
                              onClick={() => handleShowAppointmentDetails(a)}
                            >
                              Details
                            </button>
                            {a.status === 'Pending' && (
                              <button
                                className="btn btn-ghost btn-xs"
                                type="button"
                                onClick={() => handleCancel(a._id)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {showPaymentsSection && (
                <section id="payments" className="card patient-card">
                  <div className="card-title-bar">
                    <h4>Payment overview</h4>
                  </div>
                  <div className="patient-summary">
                    <p>Total invoices: <strong>{invoices.length}</strong></p>
                    <p>Unpaid: <strong>{invoices.filter((i) => i.status !== 'Paid').length}</strong></p>
                    <p>Total amount: <strong>{formatCurrency(invoices.reduce((s, it) => s + (it.totalAmount || 0), 0))}</strong></p>
                    <div className="patient-summary__amounts">
                      <p>Consultation: <strong>{formatCurrency(
                        invoices.filter(i => i.invoiceType === 'Consultation').reduce((s, it) => s + (it.totalAmount || 0), 0)
                      )}</strong></p>
                      <p>Pharmacy: <strong>{formatCurrency(
                        invoices.filter(i => i.invoiceType === 'Pharmacy').reduce((s, it) => s + (it.totalAmount || 0), 0)
                      )}</strong></p>
                    </div>
                    {paymentMessage && (
                      <div className={`booking-banner ${paymentMessage.toLowerCase().includes('success') ? 'success' : 'error'}`}>
                        {paymentMessage}
                      </div>
                    )}
                    <div className="patient-summary__actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handlePayAllUnpaid}
                        disabled={paymentProcessing}
                      >
                        {paymentProcessing ? 'Processing...' : 'Pay all'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setShowBilling(true)}
                      >
                        Pay individually
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {showBookingSection && (
              <section id="book" className="patient-booking card quick-booking">
                <BookingForm onBooked={refreshAppointments} />
              </section>
            )}

            {showRecordsSection && (
              <section id="records" className="card patient-card">
                <div className="card-title-bar">
                  <h4>Recent medical records</h4>
                </div>
                {records.length === 0 ? (
                  <div className="patient-empty">After your visit, your medical records will appear here.</div>
                ) : (
                  <div className="record-list">
                    {records.slice(0, 3).map((r) => {
                      const isExpanded = expandedRecords.includes(r._id);
                      return (
                        <article key={r._id} className="record-item record-item--vitals">
                          <div className="record-item__header">
                            <div>
                              <strong>{new Date(r.createdAt).toLocaleDateString('en-US')}</strong>
                              <p>{r.appointmentId?.departmentId?.departmentName || 'General department'}</p>
                              <span>Dr. <strong>{r.doctorId?.fullName || 'Not assigned'}</strong></span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleToggleRecord(r._id)}
                            >
                              {isExpanded ? 'Hide details' : 'View details'}
                            </button>
                          </div>

                          <div className={`record-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                            <div className="record-item__vitals">
                              <div><strong>Height:</strong> {r.height ? `${r.height} cm` : '---'}</div>
                              <div><strong>Weight:</strong> {r.weight ? `${r.weight} kg` : '---'}</div>
                              <div><strong>Blood pressure:</strong> {r.bloodPressure || '---'}</div>
                              <div><strong>Heart rate:</strong> {r.heartRate ? `${r.heartRate} bpm` : '---'}</div>
                              <div><strong>Temperature:</strong> {r.temperature ? `${r.temperature} °C` : '---'}</div>
                            </div>
                            <div className="record-item__summary">
                              <p><strong>Diagnosis:</strong> {r.diagnosis || '---'}</p>
                              {r.clinicalNotes && <p><strong>Notes:</strong> {r.clinicalNotes}</p>}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          {showAppointmentModal && selectedAppointment && (
            <div
              className="modal-overlay"
              role="dialog"
              aria-modal="true"
              onClick={(e) => { if (e.target === e.currentTarget) handleCloseAppointmentModal(); }}
            >
              <div className="modal card appointment-modal">
                <div className="card-title-bar modal-header">
                  <div>
                    <h4>Appointment details</h4>
                    <p className="muted">{selectedAppointment.departmentId?.departmentName || 'General department'}</p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={handleCloseAppointmentModal}>Close</button>
                </div>

                <div className="modal-body">
                  <div className="appointment-detail-grid">
                    <div>
                      <p><strong>Date:</strong> {new Date(selectedAppointment.requestedDate).toLocaleDateString('en-US')}</p>
                      <p><strong>Time:</strong> {selectedAppointment.requestedTime || 'Not set'}</p>
                      <p><strong>Status:</strong> {selectedAppointment.status || 'Not updated'}</p>
                      <p><strong>Room:</strong> {selectedAppointment.scheduleId?.room || 'To be updated'}</p>
                    </div>
                    <div>
                      <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctorId?.fullName || 'Not assigned'}</p>
                      <p><strong>Specialty:</strong> {selectedAppointment.departmentId?.departmentName || 'General'}</p>
                      <p><strong>Service:</strong> {selectedAppointment.scheduleId?.serviceName || 'Clinical examination'}</p>
                      <p><strong>Department:</strong> {selectedAppointment.departmentId?.departmentName || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="appointment-detail-extra">
                    <p><strong>Symptoms / Description:</strong></p>
                    <p>{selectedAppointment.symptoms || 'No description'}</p>
                  </div>

                  {selectedAppointment.scheduleId?.startTime || selectedAppointment.scheduleId?.endTime ? (
                    <div className="appointment-detail-time">
                      <p><strong>Working hours:</strong></p>
                      <p>{selectedAppointment.scheduleId?.startTime || '---'} - {selectedAppointment.scheduleId?.endTime || '---'}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {showBilling && (
              <div
                className="modal-overlay"
                role="dialog"
                aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) setShowBilling(false); }}
              >
                <div className="modal card">
                  <div className="card-title-bar modal-header">
                    <h4>Invoice details</h4>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowBilling(false)}>Close</button>
                  </div>

                  <div className="modal-body">
                    {invoices.length === 0 ? (
                      <div className="patient-empty">You have no invoices yet.</div>
                    ) : (
                      <div className="invoice-list">
                        {invoices.map((inv) => {
                          const isExpanded = expandedInvoices.includes(inv._id);
                            return (
                            <article key={inv._id} className="invoice-item">
                              <div className="invoice-item__header">
                                <div>
                                  <strong>{translateInvoiceType(inv.invoiceType)}</strong>
                                  <div className="muted">{new Date(inv.issuedAt || inv.createdAt).toLocaleString('en-US')}</div>
                                </div>
                                <div>
                                  <div className="muted">Status: {translateInvoiceStatus(inv.status)}</div>
                                  <div style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.totalAmount || 0)}</strong></div>
                                  <div className="invoice-item__actions">
                                    {inv.status !== 'Paid' && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        disabled={paymentProcessing}
                                        onClick={() => handlePayInvoice(inv)}
                                      >
                                        Pay
                                      </button>
                                    )}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleToggleInvoice(inv._id)}>
                                      {isExpanded ? 'Hide' : 'View details'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className={`invoice-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                                {inv.invoiceType === 'Pharmacy' && inv.details && inv.details.length > 0 ? (
                                  <div className="invoice-lines">
                                    {inv.details.map((d) => (
                                      <div key={d._id} className="invoice-line">
                                        <div>{d.medicineId?.name || 'Medicine'}</div>
                                        <div className="muted">x{d.quantity}</div>
                                        <div>{formatCurrency((d.unitPrice || 0) * (d.quantity || 1))}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="invoice-meta muted">{inv.appointmentId ? `Department: ${inv.appointmentId.departmentId?.departmentName || ''}` : ''}</div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          <aside className="patient-dashboard__aside">
            <PatientSidebar patient={patient} invoices={invoices} onEditPatient={handleEditPatient} />
          </aside>
        </div>
      </main>
      {isEditingProfile && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingProfile(false); }}
        >
          <div className="modal card">
            <div className="card-title-bar modal-header">
              <div>
                <h4>Update personal information</h4>
                <p className="muted">You can edit your patient profile information.</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setIsEditingProfile(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => handleProfileChange('fullName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date of birth</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
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
                    onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ID card</label>
                  <input
                    type="text"
                    value={profileForm.identityCard}
                    onChange={(e) => handleProfileChange('identityCard', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Health insurance no.</label>
                  <input
                    type="text"
                    value={profileForm.insuranceCode}
                    onChange={(e) => handleProfileChange('insuranceCode', e.target.value)}
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Address</label>
                  <textarea
                    rows="3"
                    value={profileForm.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                  />
                </div>
              </div>
              {profileMessage && <div className={`booking-banner ${profileMessage.toLowerCase().includes('success') ? 'success' : 'error'}`}>{profileMessage}</div>}
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" disabled={profileSaving} onClick={handleSaveProfile}>
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

