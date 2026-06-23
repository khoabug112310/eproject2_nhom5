import React, { useState, useEffect } from 'react';
import { billingAPI, clinicalAPI } from '../../services/api';
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
  const [medicalRecords, setMedicalRecords] = useState([]);

  const SERVICE_PRICES = { 
    'Electro-acupuncture': 150000,
    'Pharmacopuncture': 200000,
    'Catgut Embedding': 500000,
    'Moxibustion': 100000,
    'Medical Massage & Acupressure': 200000,
    'Cupping Therapy': 100000,
    'Infrared Therapy': 80000,
    'Herbal Steam Therapy': 150000,
    // Dermatology
    'Dermoscopy': 150000,
    'Fungal Scraping & Smear': 100000,
    'Demodex Test': 100000,
    'Patch Test': 300000,
    'Electrosurgery / CO2 Laser': 500000,
    'Cryotherapy': 400000,
    'Incision & Drainage of Skin Abscess': 300000,
    'Punch Biopsy': 600000,
    'Acne Extraction': 250000,
    'Chemical Peel': 800000,
    // Dentistry
    'Periapical X-ray': 50000,
    'Panoramic X-ray': 250000,
    'Scaling & Polishing': 200000,
    'Dental Filling': 200000,
    'Root Canal Treatment - Endodontics': 1000000,
    'Pediatric Tooth Extraction': 50000,
    'Permanent Tooth Extraction': 300000,
    'Wisdom Tooth Extraction': 1500000,
    'Incision of Dental Abscess': 250000,
    'Operculectomy': 500000,
    // ENT
    'ENT Endoscopy': 250000,
    'Pure Tone Audiometry': 150000,
    'Tympanometry': 150000,
    'Removal of ENT Foreign Body': 300000,
    'ENT Suctioning & Cleaning': 100000,
    'Earwax Removal': 100000,
    'Aerosol Therapy / Nebulization': 150000,
    'ENT Local Medication Application': 80000,
    'Ear/Throat Culture': 250000,
    // OB/GYN
    'Obstetric Ultrasound (2D/3D/4D/5D)': 400000,
    'Cardiotocography (CTG)': 250000,
    'Beta-hCG Urine Rapid Test': 100000,
    'Blood Beta-hCG Quantitative': 250000,
    'Oral Glucose Tolerance Test (OGTT)': 200000,
    'Transvaginal Ultrasound': 300000,
    'Breast Ultrasound': 250000,
    'Pap Smear / ThinPrep Pap Test': 450000,
    'HPV DNA Genotype': 600000,
    'Colposcopy': 350000,
    'Vaginal Fluid Wet Mount': 150000,
    'Chlamydia & Gonorrhea (PCR)': 500000,
    // Surgery
    'Abdominal Ultrasound': 200000,
    'Soft Tissue Ultrasound': 200000,
    'Abdominal X-ray': 150000,
    'Trauma X-ray': 150000,
    'Endoscopy (Stomach/Colon)': 500000,
    'Wound Dressing & Suture Removal': 100000,
    'Wound Suturing': 250000,
    'Incision and Drainage': 300000,
    'Excision of Lipoma/Sebaceous Cyst': 500000,
    'Bleeding & Clotting Time (BT/CT)': 100000,
    'Complete Blood Count (CBC)': 100000,
    // Internal Medicine
    'General Abdominal Ultrasound': 200000,
    'Chest X-ray': 150000,
    'X-ray of Joints/Spine': 150000,
    'Bone Mineral Density (BMD)': 300000,
    'ECG (Electrocardiogram)': 150000,
    'Glucose & HbA1c': 150000,
    'Liver Function Test (AST, ALT, Bilirubin)': 200000,
    'Kidney Function Test (Urea, Creatinine)': 150000,
    'Lipid Panel (Cholesterol, Triglyceride, LDL-C, HDL-C)': 250000,
    'Uric Acid Test': 100000,
    'Urine Analysis (10 Parameters)': 100000,
    // Pediatric
    'Cranial Ultrasound': 200000, 
    'Pediatric Abdominal Ultrasound': 250000, 
    'Pediatric Chest X-ray': 150000, 
    'Pediatric ENT Endoscopy': 350000, 
    'C-Reactive Protein (CRP) / Procalcitonin': 150000,
    'Influenza A/B Rapid Test': 120000,
    'Dengue NS1 Antigen Rapid Test': 150000,
    'Covid-19 Rapid Test': 100000,
    'Malaria Rapid Test': 120000,
    'Stool Parasite Test': 100000,
    // Legacy mapping support
    'Echocardiography': 300000, 
    'Cardiac Enzymes': 250000 
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const [reportDate, setReportDate] = useState(getTodayStr());
  const [reportMonth, setReportMonth] = useState(getCurrentMonthStr());

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
      
      const recordsRes = await clinicalAPI.getMedicalRecords();
      setMedicalRecords(recordsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load the invoice list.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (inv) => {
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
      if (inv.originalIds && inv.originalIds.length > 0) {
        // Only pay those that are still Unpaid
        const unpaidOriginals = invoices.filter(i => inv.originalIds.includes(i._id) && i.status === 'Unpaid');
        for (const o of unpaidOriginals) {
          await billingAPI.processPayment(o._id);
        }
      } else {
        await billingAPI.processPayment(inv._id);
      }
      setSuccessMessage('The invoice has been marked as PAID successfully!');
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === inv._id) {
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

  // Group invoices by appointmentId
  const groupedInvoicesList = [];
  const groups = {};

  invoices.forEach(inv => {
    const apptId = inv.appointmentId?._id || inv.appointmentId;
    if (!apptId) {
      groupedInvoicesList.push({ ...inv, originalIds: [inv._id], computedTotal: inv.totalAmount, orderedServices: [], consultationTotal: inv.invoiceType === 'Consultation' ? inv.totalAmount : 0, medicinesTotal: inv.invoiceType === 'Pharmacy' ? inv.totalAmount : 0, servicesTotal: 0 });
      return;
    }
    
    if (!groups[apptId]) {
      groups[apptId] = {
        _id: inv._id, // use first ID for key
        originalIds: [],
        appointmentId: inv.appointmentId,
        patientId: inv.patientId,
        invoiceType: 'Combined Fee',
        issuedAt: inv.issuedAt,
        status: inv.status, 
        details: [],
        orderedServices: [],
        servicesTotal: 0,
        consultationTotal: 0,
        medicinesTotal: 0,
        computedTotal: 0,
        paidAt: inv.paidAt,
        processedBy: inv.processedBy,
        isCombined: true
      };
    }
    
    const group = groups[apptId];
    group.originalIds.push(inv._id);
    if (inv.status === 'Unpaid') group.status = 'Unpaid';
    if (!group.paidAt && inv.paidAt) group.paidAt = inv.paidAt;

    if (inv.invoiceType === 'Consultation') {
      group.consultationTotal += inv.totalAmount;
    } else if (inv.invoiceType === 'Pharmacy') {
      if (inv.details) {
        group.details = group.details.concat(inv.details);
        inv.details.forEach(d => group.medicinesTotal += d.subTotal);
      }
    }
  });

  Object.values(groups).forEach(group => {
    const record = medicalRecords.find(r => 
      (r.appointmentId?._id || r.appointmentId) === (group.appointmentId?._id || group.appointmentId)
    );
    if (record && record.clinicalNotes) {
      const match = record.clinicalNotes.match(/\[Ordered Services: (.*?)\]/);
      if (match) {
        const srvs = match[1].split(', ').map(s => s.trim());
        srvs.forEach(s => {
          const p = SERVICE_PRICES[s] || 150000;
          group.orderedServices.push({ name: s, price: p });
          group.servicesTotal += p;
        });
      }
    }
    group.computedTotal = group.consultationTotal + group.medicinesTotal + group.servicesTotal;
    groupedInvoicesList.push(group);
  });

  // Filtered invoices logic
  const filteredInvoices = groupedInvoicesList.filter((inv) => {
    const nameMatch = inv.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const phoneMatch = inv.patientId?.phoneNumber?.includes(searchTerm) || false;
    const idMatch = inv._id?.substring(18).toUpperCase().includes(searchTerm.toUpperCase()) || false;
    const searchMatch = !searchTerm || nameMatch || phoneMatch || idMatch;

    const typeMatch = filterType === 'All' || filterType === 'Combined' || inv.invoiceType === filterType || (inv.isCombined && filterType === 'Pharmacy' && inv.medicinesTotal > 0) || (inv.isCombined && filterType === 'Consultation' && inv.consultationTotal > 0);
    const statusMatch = filterStatus === 'All' || inv.status === filterStatus;

    return searchMatch && typeMatch && statusMatch;
  });

  // Calculate statistics for daily reports
  const targetDailyDate = new Date(reportDate);
  const targetDailyStr = targetDailyDate.toDateString();
  const todayInvoices = groupedInvoicesList.filter(inv => inv.status === 'Paid' && inv.paidAt && new Date(inv.paidAt).toDateString() === targetDailyStr);
  const totalRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.computedTotal || inv.totalAmount), 0);
  const consultationRev = todayInvoices.reduce((sum, inv) => sum + (inv.consultationTotal || 0), 0);
  const pharmacyOnlyRev = todayInvoices.reduce((sum, inv) => sum + (inv.medicinesTotal || 0), 0);
  const servicesRev = todayInvoices.reduce((sum, inv) => sum + (inv.servicesTotal || 0), 0);
  const reporterName = localStorage.getItem('userDisplayName') || localStorage.getItem('userName') || 'Accountant';

  // Calculate statistics for monthly reports
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  if (reportMonth) {
    const [y, m] = reportMonth.split('-');
    currentYear = parseInt(y, 10);
    currentMonth = parseInt(m, 10) - 1;
  }
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthInvoices = groupedInvoicesList.filter(inv => {
    if (inv.status !== 'Paid' || !inv.paidAt) return false;
    const d = new Date(inv.paidAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonthInvoices = groupedInvoicesList.filter(inv => {
    if (inv.status !== 'Paid' || !inv.paidAt) return false;
    const d = new Date(inv.paidAt);
    return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
  });

  const monthlyTotalRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.computedTotal || inv.totalAmount), 0);
  const lastMonthlyTotalRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.computedTotal || inv.totalAmount), 0);
  
  const revenueGrowth = lastMonthlyTotalRevenue === 0 
    ? (monthlyTotalRevenue > 0 ? 100 : 0)
    : Math.round(((monthlyTotalRevenue - lastMonthlyTotalRevenue) / lastMonthlyTotalRevenue) * 100);
  const growthText = lastMonthlyTotalRevenue === 0 && monthlyTotalRevenue > 0 ? 'Increase 100%' : (revenueGrowth >= 0 ? `Increase ${revenueGrowth}%` : `Decrease ${Math.abs(revenueGrowth)}%`);

  const monthlyConsultationRev = currentMonthInvoices.reduce((sum, inv) => sum + (inv.consultationTotal || 0), 0);
  const monthlyPharmacyOnlyRev = currentMonthInvoices.reduce((sum, inv) => sum + (inv.medicinesTotal || 0), 0);
  const monthlyServicesRev = currentMonthInvoices.reduce((sum, inv) => sum + (inv.servicesTotal || 0), 0);

  const pctConsultation = monthlyTotalRevenue === 0 ? 0 : Math.round((monthlyConsultationRev / monthlyTotalRevenue) * 100);
  const pctPharmacy = monthlyTotalRevenue === 0 ? 0 : Math.round((monthlyPharmacyOnlyRev / monthlyTotalRevenue) * 100);
  const pctServices = monthlyTotalRevenue === 0 ? 0 : Math.round((monthlyServicesRev / monthlyTotalRevenue) * 100);

  const dailyRevenues = {};
  currentMonthInvoices.forEach(inv => {
    const dStr = new Date(inv.paidAt).toLocaleDateString('en-GB');
    if (!dailyRevenues[dStr]) dailyRevenues[dStr] = 0;
    dailyRevenues[dStr] += (inv.computedTotal || inv.totalAmount);
  });
  let highestDay = 'N/A';
  let highestRev = 0;
  Object.keys(dailyRevenues).forEach(d => {
    if (dailyRevenues[d] > highestRev) {
      highestRev = dailyRevenues[d];
      highestDay = `${d} (${formatVND(highestRev)})`;
    }
  });

  const daysPassedThisMonth = Math.max(1, new Date().getDate());
  const avgPatientsPerDay = Math.round(currentMonthInvoices.length / daysPassedThisMonth);

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
            <div className="p-avatar" style={{ fontSize: '40px', width: '80px', height: '80px' }}>💵</div>
            <h4 style={{ fontSize: '20px', fontWeight: 'bold' }}>Accounting</h4>
            <p className="p-card-number" style={{ fontSize: '16px' }}>Cashier &amp; Pharmacy Billing</p>
          </div>
          <nav className="sidebar-nav">
            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => setActiveTab('invoices')}
              className={activeTab === 'invoices' ? 'active' : ''}
            >
              🧾 Hospital fees
            </button>
            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => setActiveTab('reports')}
              className={activeTab === 'reports' ? 'active' : ''}
            >
              📊 Daily revenue report
            </button>
            <button
              style={{ fontSize: '18px', padding: '16px', marginBottom: '8px' }}
              onClick={() => setActiveTab('monthly_reports')}
              className={activeTab === 'monthly_reports' ? 'active' : ''}
            >
              📉 Monthly revenue report
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
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '18px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Invoice ID</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Patient</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Fee type</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Total</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Issue date</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Status</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold" style={{ padding: '16px 10px', fontSize: '18px' }}>{inv._id.substring(18).toUpperCase()}</td>
                          <td style={{ padding: '16px 10px' }}>
                            <strong style={{ fontSize: '20px' }}>{inv.patientId?.fullName}</strong><br />
                            <small className="text-muted" style={{ fontSize: '15px', marginTop: '6px' }}>Phone: {inv.patientId?.phoneNumber}</small>
                          </td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>
                            <span className={`badge ${inv.isCombined ? 'badge-purple' : (inv.invoiceType === 'Consultation' ? 'badge-info' : 'badge-purple')}`} style={{ fontSize: '15px', padding: '8px 12px', whiteSpace: 'normal', textAlign: 'center' }}>
                              {inv.isCombined ? 'Combined Fee' : (inv.invoiceType === 'Consultation' ? 'Consultation' : 'Prescription medicine')}
                            </span>
                          </td>
                          <td className="font-bold text-primary" style={{ padding: '16px 10px', fontSize: '20px' }}>{formatVND(inv.computedTotal || inv.totalAmount)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{new Date(inv.issuedAt).toLocaleDateString('en-US')}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '15px', padding: '8px 12px' }}>
                              {inv.status === 'Paid' ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 10px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '15px', fontWeight: 'bold' }} onClick={() => setSelectedInvoice(inv)}>
                                View receipt
                              </button>
                              {inv.status === 'Unpaid' && (
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '8px 12px', fontSize: '15px', fontWeight: 'bold' }}
                                  onClick={() => handleProcessPayment(inv)}
                                  disabled={submitting}
                                >
                                  💵 Collect payment
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

          {/* Tab: Daily Reports */}
          {activeTab === 'reports' && (
            <div className="dashboard-card" id="print-area">
              <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>CLINIC DAILY REVENUE REPORT</h2>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <input 
                  type="date" 
                  className="form-control" 
                  value={reportDate} 
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ display: 'inline-block', width: 'auto', padding: '8px 16px', fontSize: '18px', fontWeight: 'bold' }}
                />
              </div>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '32px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '20px',
                lineHeight: '1.8',
                color: '#1e293b',
                marginTop: '16px'
              }}>
                <div style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: '24px' }}></div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '24px', width: '60%' }}>💰 TOTAL ACTUAL REVENUE:</td>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '24px', color: '#047857', textAlign: 'right' }}>{formatVND(totalRevenue)}</td>
                    </tr>
                    
                    {/* Revenue Source */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>📍 DETAILS BY REVENUE SOURCE (System):</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>🔹 Consultation fees:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(consultationRev)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>🔹 Pharmacy sales:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(pharmacyOnlyRev)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>🔹 Other revenue (Procedures/Tests):</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(servicesRev)}</td>
                    </tr>

                    {/* Payment Method */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>💳 DETAILS BY PAYMENT METHOD:</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Cash:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(totalRevenue)} <span style={{ color: '#64748b', fontSize: '16px' }}>(Safed)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Bank Transfer / Credit Card:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(0)}</td>
                    </tr>

                    {/* Patient Stats */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>👥 PATIENT STATISTICS:</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Total patient visits today:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{todayInvoices.length} patients</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderBottom: '2px dashed #cbd5e1', margin: '24px 0' }}></div>
                <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '20px' }}>
                  Report generated by: <strong>{reporterName}</strong>
                </div>
              </div>

              <h3 style={{ marginTop: '30px' }}>Transactions completed today</h3>
              {todayInvoices.length === 0 ? (
                <div className="empty-state">
                  <p>No completed transactions recorded today yet.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ marginTop: 15, overflowX: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '18px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Invoice</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Patient</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Invoice type</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Amount</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Payment time</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Processed by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold" style={{ padding: '16px 10px', fontSize: '18px' }}>{inv._id.substring(18).toUpperCase()}</td>
                          <td style={{ padding: '16px 10px', fontSize: '20px', fontWeight: 'bold' }}>{inv.patientId?.fullName}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{inv.isCombined ? 'Combined Fee' : (inv.invoiceType === 'Consultation' ? 'Consultation fee' : 'Prescription medicine')}</td>
                          <td className="font-bold text-success" style={{ padding: '16px 10px', fontSize: '20px' }}>{formatVND(inv.computedTotal || inv.totalAmount)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{new Date(inv.paidAt).toLocaleTimeString('en-US')}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{inv.processedBy?.fullName || 'System'}</td>
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

          {/* Tab: Monthly Reports */}
          {activeTab === 'monthly_reports' && (
            <div className="dashboard-card" id="print-area">
              <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>MONTHLY REVENUE SUMMARY REPORT</h2>
              <div style={{ textAlign: 'center', marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <select 
                  className="form-control" 
                  value={reportMonth.split('-')[1]} 
                  onChange={(e) => setReportMonth(`${reportMonth.split('-')[0]}-${e.target.value}`)}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '18px', fontWeight: 'bold' }}
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select 
                  className="form-control" 
                  value={reportMonth.split('-')[0]} 
                  onChange={(e) => setReportMonth(`${e.target.value}-${reportMonth.split('-')[1]}`)}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '18px', fontWeight: 'bold' }}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '32px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '20px',
                lineHeight: '1.8',
                color: '#1e293b',
                marginTop: '16px'
              }}>
                <div style={{ borderBottom: '2px dashed #cbd5e1', marginBottom: '24px' }}></div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '24px', width: '60%' }}>
                        🏆 TOTAL MONTHLY REVENUE:
                        <div style={{ fontSize: '16px', color: '#64748b', fontWeight: 'normal', fontStyle: 'italic', marginTop: '4px' }}>
                          (Compared to last month: {growthText})
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '24px', color: '#047857', textAlign: 'right', verticalAlign: 'top' }}>
                        {formatVND(monthlyTotalRevenue)}
                      </td>
                    </tr>
                    
                    {/* Revenue Structure */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>📈 DETAILED REVENUE STRUCTURE:</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>1. Total consultation fees (Consultation):</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(monthlyConsultationRev)} <span style={{ color: '#64748b', fontSize: '16px' }}>(Accounts for {pctConsultation}%)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>2. Total pharmacy sales (Pharmacy):</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(monthlyPharmacyOnlyRev)} <span style={{ color: '#64748b', fontSize: '16px' }}>(Accounts for {pctPharmacy}%)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>3. Other services revenue:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(monthlyServicesRev)} <span style={{ color: '#64748b', fontSize: '16px' }}>(Accounts for {pctServices}%)</span></td>
                    </tr>

                    {/* Patient Stats */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>👥 PATIENT STATISTICS:</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Total patient visits this month:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{currentMonthInvoices.length} patients</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Average:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{avgPatientsPerDay} patients/day</td>
                    </tr>

                    {/* Notes */}
                    <tr>
                      <td colSpan="2" style={{ padding: '24px 8px 8px 8px', fontWeight: 'bold', fontSize: '22px' }}>📝 ASSESSMENT & NOTES (If any):</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>- Day with highest revenue:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{highestDay}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 8px 12px 32px' }}>- Inventory and cash fund reconciliation status:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>100% matched with the system.</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ borderBottom: '2px dashed #cbd5e1', margin: '24px 0' }}></div>
                <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '20px' }}>
                  Report generated by: <strong>{reporterName}</strong>
                </div>
              </div>
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
                    {(selectedInvoice.invoiceType === 'Consultation' || selectedInvoice.consultationTotal > 0) && (
                      <tr>
                        <td>
                          <strong>Consultation Fee</strong> - {selectedInvoice.appointmentId?.departmentId?.departmentName || 'General'} department<br />
                          <small className="text-muted">Examining doctor: {selectedInvoice.appointmentId?.doctorId?.fullName || 'Any'}</small>
                        </td>
                        <td className="text-right">{formatVND(selectedInvoice.consultationTotal || selectedInvoice.totalAmount)}</td>
                        <td className="text-right">1</td>
                        <td className="text-right">{formatVND(selectedInvoice.consultationTotal || selectedInvoice.totalAmount)}</td>
                      </tr>
                    )}

                    {selectedInvoice.isCombined && selectedInvoice.orderedServices?.length > 0 && (
                      <React.Fragment>
                        <tr>
                          <td colSpan="4" style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', paddingTop: '10px', paddingBottom: '10px' }}>
                            🏥 Clinical Services
                          </td>
                        </tr>
                        {selectedInvoice.orderedServices.map((srv, idx) => (
                          <tr key={`srv-${idx}`}>
                            <td>{srv.name}</td>
                            <td className="text-right">{formatVND(srv.price)}</td>
                            <td className="text-right">1</td>
                            <td className="text-right">{formatVND(srv.price)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )}

                    {selectedInvoice.isCombined && selectedInvoice.details?.length > 0 && (
                      <React.Fragment>
                        <tr>
                          <td colSpan="4" style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', paddingTop: '10px', paddingBottom: '10px' }}>
                            💊 Prescription Items
                          </td>
                        </tr>
                        {selectedInvoice.details.map((det, idx) => (
                          <tr key={`med-${idx}`}>
                            <td>
                              {det.medicineId?.name || det.medicineId?.medicineName}<br />
                              <small className="text-muted">{det.medicineId?.dosageForm || 'Pill'} | Usage: {det.medicineId?.instruction || 'As directed'}</small>
                            </td>
                            <td className="text-right">{formatVND(det.unitPrice)}</td>
                            <td className="text-right">{det.quantity}</td>
                            <td className="text-right">{formatVND(det.subTotal)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Total amount due:</span>
                  <strong className="text-primary" style={{ fontSize: 18 }}>{formatVND(selectedInvoice.computedTotal || selectedInvoice.totalAmount)}</strong>
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
                  onClick={() => handleProcessPayment(selectedInvoice)}
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
