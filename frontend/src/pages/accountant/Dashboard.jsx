import React, { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Swal from 'sweetalert2';
import '../../styles/work-dashboard.css';

export default function AccountantDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await billingAPI.getInvoices();
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load the invoice list.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (invoiceId) => {
    const result = await Swal.fire({
      title: 'Confirm payment collection',
      text: 'Do you confirm that cash/bank transfer has actually been received for this invoice?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await billingAPI.processPayment(invoiceId);
      setSuccessMessage('The invoice has been marked as PAID successfully!');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error processing the invoice payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  // Filtered invoices logic
  const filteredInvoices = invoices.filter((inv) => {
    const nameMatch = inv.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const phoneMatch = inv.patientId?.phoneNumber?.includes(searchTerm) || false;
    const idMatch = inv._id?.substring(18).toUpperCase().includes(searchTerm.toUpperCase()) || false;
    const searchMatch = !searchTerm || nameMatch || phoneMatch || idMatch;

    const typeMatch = filterType === 'All' || inv.invoiceType === filterType;
    const statusMatch = filterStatus === 'All' || inv.status === filterStatus;

    return searchMatch && typeMatch && statusMatch;
  });

  // Calculate statistics for daily reports
  const todayStr = new Date().toDateString();
  const todayInvoices = invoices.filter(inv => inv.status === 'Paid' && inv.paidAt && new Date(inv.paidAt).toDateString() === todayStr);
  const totalRevenue = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const consultationRev = todayInvoices.filter(i => i.invoiceType === 'Consultation').reduce((sum, i) => sum + i.totalAmount, 0);
  const pharmacyRev = todayInvoices.filter(i => i.invoiceType === 'Pharmacy').reduce((sum, i) => sum + i.totalAmount, 0);

  if (loading) {
    return (
      <div className="role-dashboard-shell work-dashboard">
        <RoleTopNav role="accountant" />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading invoices and financial reconciliation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell work-dashboard">
      <RoleTopNav role="accountant" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">💵</div>
            <h4>Accounting</h4>
            <p className="p-card-number">Cashier &amp; Pharmacy Billing</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('invoices')}
              className={activeTab === 'invoices' ? 'active' : ''}
            >
              🧾 Hospital fees
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={activeTab === 'reports' ? 'active' : ''}
            >
              📊 Daily revenue report
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Invoices */}
          {activeTab === 'invoices' && (
            <div className="dashboard-card">
              <div className="card-header flex-column md-row">
                <h2>Patient billing management</h2>

                <div className="work-page-toolbar search-filter-bar">
                  <input
                    type="text"
                    placeholder="Search: patient name, phone, or invoice ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    aria-label="Search invoices"
                  />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All invoice types</option>
                    <option value="Consultation">Consultation fee</option>
                    <option value="Pharmacy">Pharmacy invoice</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All statuses</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>No invoices match the filters.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Patient</th>
                        <th>Fee type</th>
                        <th>Total</th>
                        <th>Issue date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>
                            <strong>{inv.patientId?.fullName}</strong><br />
                            <small className="text-muted">Phone: {inv.patientId?.phoneNumber}</small>
                          </td>
                          <td>
                            <span className={`badge ${inv.invoiceType === 'Consultation' ? 'badge-info' : 'badge-purple'}`}>
                              {inv.invoiceType === 'Consultation' ? 'Consultation' : 'Prescription medicine'}
                            </span>
                          </td>
                          <td className="font-bold text-primary">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.issuedAt).toLocaleDateString('en-US')}</td>
                          <td>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                              {inv.status === 'Paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(inv)}>
                              View receipt
                            </button>
                            {inv.status === 'Unpaid' && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleProcessPayment(inv._id)}
                                disabled={submitting}
                              >
                                💵 Collect payment
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

          {/* Tab: Daily Reports */}
          {activeTab === 'reports' && (
            <div className="dashboard-card">
              <h2>Daily cashier financial report</h2>
              <p className="subtitle">Actual revenue collected today: {new Date().toLocaleDateString('en-US')}</p>

              <div className="stats-cards-grid" style={{ marginBottom: 25 }}>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <h3>{formatVND(totalRevenue)}</h3>
                  <p>Revenue collected today</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🩺</div>
                  <h3>{formatVND(consultationRev)}</h3>
                  <p>Total consultation fees</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💊</div>
                  <h3>{formatVND(pharmacyRev)}</h3>
                  <p>Total pharmacy sales</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <h3>{todayInvoices.length}</h3>
                  <p>Invoices reconciled</p>
                </div>
              </div>

              <h3>Transactions completed today</h3>
              {todayInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>No completed transactions recorded today yet.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ marginTop: 15 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Patient</th>
                        <th>Invoice type</th>
                        <th>Amount</th>
                        <th>Payment time</th>
                        <th>Processed by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>{inv.patientId?.fullName}</td>
                          <td>{inv.invoiceType === 'Consultation' ? 'Consultation fee' : 'Prescription medicine'}</td>
                          <td className="font-bold text-success">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.paidAt).toLocaleTimeString('en-US')}</td>
                          <td>{inv.processedBy?.fullName || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Print report
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Detail / Receipt Modal (Shared component representation) */}
      {selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h3>Medical fee receipt</h3>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body print-section" id="print-area">
              <div className="receipt-brand">
                <h2>HOPSONTAI GENERAL CLINIC</h2>
                <p>123 Hop Son Street, Hai Ba Trung District, Hanoi | Hotline: 1900 6868</p>
              </div>
              <hr />
              <div className="receipt-meta">
                <div>
                  <p><strong>Patient:</strong> {selectedInvoice.patientId?.fullName}</p>
                  <p><strong>Phone:</strong> {selectedInvoice.patientId?.phoneNumber}</p>
                  <p><strong>ID card:</strong> {selectedInvoice.patientId?.identityCard}</p>
                </div>
                <div className="text-right">
                  <p><strong>Invoice no.:</strong> <span className="monospace uppercase">{selectedInvoice._id.substring(14)}</span></p>
                  <p><strong>Issued:</strong> {new Date(selectedInvoice.issuedAt).toLocaleDateString('en-US')}</p>
                  {selectedInvoice.paidAt && <p><strong>Paid on:</strong> {new Date(selectedInvoice.paidAt).toLocaleDateString('en-US')}</p>}
                </div>
              </div>

              <div className="receipt-items-container" style={{ marginTop: 20 }}>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-right">Unit price</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.invoiceType === 'Consultation' ? (
                      <tr>
                        <td>
                          Consultation - {selectedInvoice.appointmentId?.departmentId?.departmentName || 'General'} department<br />
                          <small className="text-muted">Examining doctor: {selectedInvoice.appointmentId?.doctorId?.fullName || 'Any'}</small>
                        </td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                        <td className="text-right">1</td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                      </tr>
                    ) : (
                      selectedInvoice.details?.map((det, idx) => (
                        <tr key={idx}>
                          <td>
                            {det.medicineId?.name}<br />
                            <small className="text-muted">{det.medicineId?.dosageForm} | Usage: {det.medicineId?.instruction}</small>
                          </td>
                          <td className="text-right">{formatVND(det.unitPrice)}</td>
                          <td className="text-right">{det.quantity}</td>
                          <td className="text-right">{formatVND(det.subTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Total amount due:</span>
                  <strong className="text-primary" style={{ fontSize: 18 }}>{formatVND(selectedInvoice.totalAmount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Status:</span>
                  <span className={`badge ${selectedInvoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedInvoice.status === 'Paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                {selectedInvoice.processedBy && (
                  <div className="summary-row">
                    <span>Cashier:</span>
                    <span>{selectedInvoice.processedBy?.fullName || 'System'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print invoice</button>
              {selectedInvoice.status === 'Unpaid' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleProcessPayment(selectedInvoice._id)}
                  disabled={submitting}
                >
                  Approve payment
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
