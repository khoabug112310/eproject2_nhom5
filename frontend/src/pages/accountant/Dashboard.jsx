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
      setErrorMessage('Failed to load invoice list.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (invoiceId) => {
    const result = await Swal.fire({
      title: 'Confirm Payment Receipt',
      text: 'Do you confirm that you have received cash/transfer for this invoice?',
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
      setSuccessMessage('Invoice has been successfully marked as PAID!');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Error processing payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
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
          <p>Loading invoice data & financial reconciliation...</p>
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
            <h4>Accountant Department</h4>
            <p className="p-card-number">Cashier & Pharmacy Billing</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('invoices')}
              className={activeTab === 'invoices' ? 'active' : ''}
            >
              🧾 Hospital Invoices
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={activeTab === 'reports' ? 'active' : ''}
            >
              📊 Daily Revenue Report
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
                <h2>Patient Fee Invoice Management</h2>

                <div className="work-page-toolbar search-filter-bar">
                  <input
                    type="text"
                    placeholder="Search: Patient Name, Phone or Invoice ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    aria-label="Search Invoices"
                  />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="All">All Invoice Types</option>
                    <option value="Consultation">Clinical Examination Fee</option>
                    <option value="Pharmacy">Pharmacy Invoice</option>
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>No invoices found matching the filters.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice ID</th>
                        <th>Patient</th>
                        <th>Fee Type</th>
                        <th>Total Amount</th>
                        <th>Issue Date</th>
                        <th>Status</th>
                        <th>Action</th>
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
                              {inv.invoiceType === 'Consultation' ? 'Clinical Examination' : 'Prescription Medicine'}
                            </span>
                          </td>
                          <td className="font-bold text-primary">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.issuedAt).toLocaleDateString('en-GB')}</td>
                          <td>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                              {inv.status === 'Paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(inv)}>
                              View Receipt
                            </button>
                            {inv.status === 'Unpaid' && (
                              <button
                                className="btn btn-primary btn-xs"
                                onClick={() => handleProcessPayment(inv._id)}
                                disabled={submitting}
                              >
                                💵 Receive Payment
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
              <h2>Daily Cashier Financial Report</h2>
              <p className="subtitle">Actual revenue collected today: {new Date().toLocaleDateString('en-GB')}</p>

              <div className="stats-cards-grid" style={{ marginBottom: 25 }}>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <h3>{formatVND(totalRevenue)}</h3>
                  <p>Actual Revenue Received Today</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🩺</div>
                  <h3>{formatVND(consultationRev)}</h3>
                  <p>Total Clinical Examination Fees</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💊</div>
                  <h3>{formatVND(pharmacyRev)}</h3>
                  <p>Total Prescription Medicine Sales</p>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <h3>{todayInvoices.length}</h3>
                  <p>Number of Reconciled Invoices</p>
                </div>
              </div>

              <h3>List of Completed Transactions Today</h3>
              {todayInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>No successful transactions recorded today.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ marginTop: 15 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Patient</th>
                        <th>Invoice Type</th>
                        <th>Amount</th>
                        <th>Payment Time</th>
                        <th>Processed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>{inv.patientId?.fullName}</td>
                          <td>{inv.invoiceType === 'Consultation' ? 'Clinical Examination Fee' : 'Prescription Medicine Fee'}</td>
                          <td className="font-bold text-success">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.paidAt).toLocaleTimeString('en-GB')}</td>
                          <td>{inv.processedBy?.fullName || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Export Print Report
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Detail / Receipt Modal */}
      {selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h3>Medical Fee Receipt</h3>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body print-section" id="print-area">
              <div className="receipt-brand">
                <h2>HOP SON TAI GENERAL CLINIC</h2>
                <p>123 Hop Son Street, Hai Ba Trung District, Hanoi | Hotline: 1900 6868</p>
              </div>
              <hr />
              <div className="receipt-meta">
                <div>
                  <p><strong>Patient:</strong> {selectedInvoice.patientId?.fullName}</p>
                  <p><strong>Phone:</strong> {selectedInvoice.patientId?.phoneNumber}</p>
                  <p><strong>ID Card:</strong> {selectedInvoice.patientId?.identityCard}</p>
                </div>
                <div className="text-right">
                  <p><strong>Invoice No:</strong> <span className="monospace uppercase">{selectedInvoice._id.substring(14)}</span></p>
                  <p><strong>Issue Date:</strong> {new Date(selectedInvoice.issuedAt).toLocaleDateString('en-GB')}</p>
                  {selectedInvoice.paidAt && <p><strong>Payment Date:</strong> {new Date(selectedInvoice.paidAt).toLocaleDateString('en-GB')}</p>}
                </div>
              </div>

              <div className="receipt-items-container" style={{ marginTop: 20 }}>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Payment Content</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.invoiceType === 'Consultation' ? (
                      <tr>
                        <td>
                          Clinical Examination - Specialty {selectedInvoice.appointmentId?.departmentId?.departmentName || 'General'}<br />
                          <small className="text-muted">Consulting Doctor: {selectedInvoice.appointmentId?.doctorId?.fullName || 'Any'}</small>
                        </td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                        <td className="text-right">1</td>
                        <td className="text-right">{formatVND(selectedInvoice.totalAmount)}</td>
                      </tr>
                    ) : (
                      selectedInvoice.details?.map((det, idx) => (
                        <tr key={idx}>
                          <td>
                            {det.medicineId?.name || det.medicineId?.medicineName}<br />
                            <small className="text-muted">{det.medicineId?.dosageForm} | Instruction: {det.medicineId?.instruction}</small>
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
                  <span>Total Payment Amount:</span>
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
              <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print Receipt</button>
              {selectedInvoice.status === 'Unpaid' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleProcessPayment(selectedInvoice._id)}
                  disabled={submitting}
                >
                  Confirm Payment
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
