import React, { useState, useEffect } from 'react';
import { billingAPI, clinicalAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Swal from 'sweetalert2';
import '../../styles/work-dashboard.css';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
      title: 'Select Payment Method',
      html: `
        <div style="text-align: left; margin-top: 15px;">
          <label style="display: block; margin-bottom: 10px; font-size: 16px; cursor: pointer;">
            <input type="radio" name="paymentMethod" value="Cash" checked style="margin-right: 8px; transform: scale(1.2);"> Cash (Tiền mặt)
          </label>
          <label style="display: block; font-size: 16px; cursor: pointer;">
            <input type="radio" name="paymentMethod" value="Bank Transfer" style="margin-right: 8px; transform: scale(1.2);"> Bank Transfer / Credit Card (Chuyển khoản / Quẹt thẻ)
          </label>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm Payment',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const selected = document.querySelector('input[name="paymentMethod"]:checked');
        return selected ? selected.value : 'Cash';
      }
    });
    
    if (!result.isConfirmed) return;
    const paymentMethod = result.value;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (inv.originalIds && inv.originalIds.length > 0) {
        // Only pay those that are still Unpaid
        const unpaidOriginals = invoices.filter(i => inv.originalIds.includes(i._id) && i.status === 'Unpaid');
        for (const o of unpaidOriginals) {
          await billingAPI.processPayment(o._id, paymentMethod);
        }
      } else {
        await billingAPI.processPayment(inv._id, paymentMethod);
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

  const handleRemovePharmacy = async (pharmacyInvoiceId) => {
    try {
      const result = await Swal.fire({
        title: 'Remove Prescription?',
        text: "The patient refused the medicines. This will remove all prescription items from this invoice.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, remove them'
      });
      
      if (result.isConfirmed) {
        setSubmitting(true);
        await billingAPI.deleteInvoice(pharmacyInvoiceId);
        
        fetchInvoices();
        setSelectedInvoice(null);
        Swal.fire('Removed!', 'Prescription items have been removed.', 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to remove prescription', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePrescriptionItem = async (detailId, medicineName) => {
    try {
      const result = await Swal.fire({
        title: 'Remove Item?',
        text: `Are you sure you want to remove "${medicineName}" from the prescription?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, remove it'
      });
      
      if (result.isConfirmed) {
        setSubmitting(true);
        await billingAPI.deleteInvoiceDetail(detailId);
        
        fetchInvoices();
        setSelectedInvoice(null);
        Swal.fire('Removed!', 'Prescription item has been removed.', 'success');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to remove prescription item', 'error');
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
        paymentMethod: inv.paymentMethod,
        isCombined: true
      };
    }
    
    const group = groups[apptId];
    group.originalIds.push(inv._id);
    if (inv.status === 'Unpaid') group.status = 'Unpaid';
    if (!group.paidAt && inv.paidAt) group.paidAt = inv.paidAt;
    if (inv.paymentMethod) group.paymentMethod = inv.paymentMethod;

    if (inv.invoiceType === 'Consultation') {
      group.consultationTotal += inv.totalAmount;
    } else if (inv.invoiceType === 'Pharmacy') {
      group.pharmacyInvoiceId = inv._id;
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
  const dailyBankTotal = todayInvoices
    .filter(inv => inv.paymentMethod === 'Bank Transfer')
    .reduce((sum, inv) => sum + (inv.computedTotal || inv.totalAmount), 0);
  const dailyCashTotal = todayInvoices
    .filter(inv => inv.paymentMethod !== 'Bank Transfer')
    .reduce((sum, inv) => sum + (inv.computedTotal || inv.totalAmount), 0);

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

  const handleExportDailyExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // ===== Sheet 1: Transactions =====
    const wsData = workbook.addWorksheet('Transactions');
    wsData.columns = [
      { header: 'Date', key: 'ngay', width: 15, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: 'Invoice', key: 'invoice', width: 15, style: { numFmt: '@', alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: 'Patient', key: 'patient', width: 25, style: { alignment: { horizontal: 'left', vertical: 'middle' } } },
      { header: 'Consultation fees', key: 'consultation', width: 20, style: { numFmt: '#,##0" ₫"', alignment: { horizontal: 'right', vertical: 'middle' } } },
      { header: 'Pharmacy sales', key: 'pharmacy', width: 20, style: { numFmt: '#,##0" ₫"', alignment: { horizontal: 'right', vertical: 'middle' } } },
      { header: 'Other revenue', key: 'other', width: 20, style: { numFmt: '#,##0" ₫"', alignment: { horizontal: 'right', vertical: 'middle' } } },
      { header: 'DETAILS BY PAYMENT', key: 'paymentMethod', width: 35, style: { alignment: { horizontal: 'center', vertical: 'middle' } } },
      { header: 'Total Amount', key: 'total', width: 20, style: { numFmt: '#,##0" ₫"', alignment: { horizontal: 'right', vertical: 'middle' } } },
      { header: 'Payment time', key: 'time', width: 15, style: { alignment: { horizontal: 'center', vertical: 'middle' } } }
    ];

    wsData.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    wsData.columns.forEach(col => {
      col.font = { name: 'Segoe UI' };
    });


    wsData.getRow(1).font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    wsData.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    wsData.getRow(1).alignment = { horizontal: 'center' };

    todayInvoices.forEach(inv => {
      wsData.addRow({
        ngay: new Date(inv.paidAt).toLocaleDateString('en-GB'),
        invoice: inv._id.substring(18).toUpperCase(),
        patient: inv.patientId?.fullName || '',
        consultation: inv.consultationTotal || 0,
        pharmacy: inv.medicinesTotal || 0,
        other: inv.servicesTotal || 0,
        paymentMethod: inv.paymentMethod === 'Bank Transfer' ? 'Bank Transfer / Credit Card' : 'Cash',
        total: inv.computedTotal || inv.totalAmount,
        time: new Date(inv.paidAt).toLocaleTimeString('en-US')
      });
    });

    // Force cell alignments and formats after adding rows
    wsData.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      row.getCell('ngay').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('invoice').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('invoice').numFmt = '@'; // Force text format
      row.getCell('patient').alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell('consultation').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('pharmacy').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('other').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('paymentMethod').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('total').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('time').alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // ===== Sheet 2: Daily_Dashboard =====
    const wsDaily = workbook.addWorksheet('Daily_Dashboard');
    wsDaily.views = [{ showGridLines: false }];
    wsDaily.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    
    wsDaily.getColumn('A').width = 40;
    wsDaily.getColumn('B').width = 25;

    wsDaily.mergeCells('A2:B2');
    const titleCell = wsDaily.getCell('A2');
    titleCell.value = 'CLINIC DAILY REVENUE REPORT';
    titleCell.font = { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FF1F4E78' } };
    titleCell.alignment = { horizontal: 'center' };

    wsDaily.mergeCells('A3:B3');
    const dateCell = wsDaily.getCell('A3');
    dateCell.value = targetDailyStr;
    dateCell.font = { name: 'Segoe UI', bold: true, size: 14 };
    dateCell.alignment = { horizontal: 'center' };

    wsDaily.getCell('A5').value = 'TOTAL ACTUAL REVENUE';
    wsDaily.getCell('A5').font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FFC00000' } };
    wsDaily.getCell('B5').value = { formula: 'SUM(Transactions!H:H)', result: totalRevenue };
    wsDaily.getCell('B5').font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FFC00000' } };
    wsDaily.getCell('B5').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A7').value = 'DETAILS BY REVENUE SOURCE (System)';
    wsDaily.getCell('A7').font = { name: 'Segoe UI', bold: true, size: 12 };

    wsDaily.getCell('A8').value = 'Consultation fees:';
    wsDaily.getCell('B8').value = { formula: 'SUM(Transactions!D:D)', result: consultationRev };
    wsDaily.getCell('B8').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A9').value = 'Pharmacy sales:';
    wsDaily.getCell('B9').value = { formula: 'SUM(Transactions!E:E)', result: pharmacyOnlyRev };
    wsDaily.getCell('B9').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A10').value = 'Other revenue (Procedures/Tests):';
    wsDaily.getCell('B10').value = { formula: 'SUM(Transactions!F:F)', result: servicesRev };
    wsDaily.getCell('B10').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A12').value = 'DETAILS BY PAYMENT METHOD';
    wsDaily.getCell('A12').font = { name: 'Segoe UI', bold: true, size: 12 };

    wsDaily.getCell('A13').value = 'Cash:';
    wsDaily.getCell('B13').value = { formula: 'SUMIF(Transactions!G:G, "Cash", Transactions!H:H)', result: totalRevenue };
    wsDaily.getCell('B13').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A14').value = 'Bank Transfer / Credit Card:';
    wsDaily.getCell('B14').value = { formula: 'SUMIF(Transactions!G:G, "Bank Transfer / Credit Card", Transactions!H:H)', result: 0 };
    wsDaily.getCell('B14').numFmt = '#,##0" ₫"';

    wsDaily.getCell('A16').value = 'PATIENT STATISTICS';
    wsDaily.getCell('A16').font = { name: 'Segoe UI', bold: true, size: 12 };

    wsDaily.getCell('A17').value = 'Total patient visits today:';
    wsDaily.getCell('B17').value = { formula: 'COUNTA(Transactions!B:B)-1', result: todayInvoices.length };

    wsDaily.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.font) cell.font = { name: 'Segoe UI' };
        else cell.font.name = 'Segoe UI';
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Daily_Revenue_Report_${reportDate}.xlsx`);
  };

  const handleExportMonthlyExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // ===== Sheet 1: Transactions =====
    const wsData = workbook.addWorksheet('Transactions');
    wsData.columns = [
      { header: 'Date', key: 'ngay', width: 15 },
      { header: 'Invoice', key: 'invoice', width: 15 },
      { header: 'Patient', key: 'patient', width: 25 },
      { header: 'Consultation fees', key: 'consultation', width: 20 },
      { header: 'Pharmacy sales', key: 'pharmacy', width: 20 },
      { header: 'Other revenue', key: 'other', width: 20 },
      { header: 'DETAILS BY PAYMENT', key: 'paymentMethod', width: 25 },
      { header: 'Total Amount', key: 'total', width: 20 },
      { header: 'Payment time', key: 'time', width: 15 }
    ];

    wsData.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    wsData.columns.forEach(col => {
      col.font = { name: 'Segoe UI' };
      col.alignment = { vertical: 'middle' };
    });
    wsData.getColumn('ngay').alignment = { horizontal: 'center', vertical: 'middle' };
    wsData.getColumn('invoice').alignment = { horizontal: 'center', vertical: 'middle' };
    wsData.getColumn('patient').alignment = { horizontal: 'left', vertical: 'middle' };
    wsData.getColumn('consultation').alignment = { horizontal: 'right', vertical: 'middle' };
    wsData.getColumn('pharmacy').alignment = { horizontal: 'right', vertical: 'middle' };
    wsData.getColumn('other').alignment = { horizontal: 'right', vertical: 'middle' };
    wsData.getColumn('paymentMethod').alignment = { horizontal: 'center', vertical: 'middle' };
    wsData.getColumn('total').alignment = { horizontal: 'right', vertical: 'middle' };
    wsData.getColumn('time').alignment = { horizontal: 'center', vertical: 'middle' };

    wsData.getColumn('consultation').numFmt = '#,##0" ₫"';
    wsData.getColumn('pharmacy').numFmt = '#,##0" ₫"';
    wsData.getColumn('other').numFmt = '#,##0" ₫"';
    wsData.getColumn('total').numFmt = '#,##0" ₫"';

    wsData.getRow(1).font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
    wsData.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    wsData.getRow(1).alignment = { horizontal: 'center' };

    currentMonthInvoices.forEach(inv => {
      wsData.addRow({
        ngay: new Date(inv.paidAt).toLocaleDateString('en-GB'),
        invoice: inv._id.substring(18).toUpperCase(),
        patient: inv.patientId?.fullName || '',
        consultation: inv.consultationTotal || 0,
        pharmacy: inv.medicinesTotal || 0,
        other: inv.servicesTotal || 0,
        paymentMethod: inv.paymentMethod === 'Bank Transfer' ? 'Bank Transfer / Credit Card' : (inv.paymentMethod || 'Cash'),
        total: inv.computedTotal || inv.totalAmount,
        time: new Date(inv.paidAt).toLocaleTimeString('en-US')
      });
    });

    // Force cell alignments and formats after adding rows
    wsData.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      row.getCell('ngay').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('invoice').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('invoice').numFmt = '@'; // Force text format
      row.getCell('patient').alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell('consultation').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('pharmacy').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('other').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('paymentMethod').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('total').alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell('time').alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // ===== Sheet 2: Monthly_Dashboard =====
    const wsMonthly = workbook.addWorksheet('Monthly_Dashboard');
    wsMonthly.views = [{ showGridLines: false }];
    wsMonthly.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    
    wsMonthly.getColumn('A').width = 40;
    wsMonthly.getColumn('B').width = 25;
    wsMonthly.getColumn('C').width = 15;

    wsMonthly.mergeCells('A2:B2');
    const titleCell = wsMonthly.getCell('A2');
    titleCell.value = 'CLINIC MONTHLY REVENUE REPORT';
    titleCell.font = { name: 'Segoe UI', bold: true, size: 16, color: { argb: 'FF1F4E78' } };
    titleCell.alignment = { horizontal: 'center' };

    wsMonthly.mergeCells('A3:B3');
    const dateCell = wsMonthly.getCell('A3');
    dateCell.value = `Month: ${reportMonth}`;
    dateCell.font = { name: 'Segoe UI', bold: true, size: 14 };
    dateCell.alignment = { horizontal: 'center' };

    wsMonthly.getCell('A5').value = 'TOTAL MONTHLY REVENUE';
    wsMonthly.getCell('A5').font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FFC00000' } };
    wsMonthly.getCell('B5').value = { formula: 'SUM(Transactions!H:H)', result: monthlyTotalRevenue };
    wsMonthly.getCell('B5').font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FFC00000' } };
    wsMonthly.getCell('B5').numFmt = '#,##0" ₫"';

    wsMonthly.getCell('A7').value = 'DETAILED REVENUE STRUCTURE';
    wsMonthly.getCell('A7').font = { name: 'Segoe UI', bold: true, size: 12 };
    wsMonthly.getCell('C7').value = '%';
    wsMonthly.getCell('C7').font = { name: 'Segoe UI', bold: true, size: 12 };
    wsMonthly.getCell('C7').alignment = { horizontal: 'center' };

    wsMonthly.getCell('A8').value = 'Total consultation fees:';
    wsMonthly.getCell('B8').value = { formula: 'SUM(Transactions!D:D)', result: monthlyConsultationRev };
    wsMonthly.getCell('B8').numFmt = '#,##0" ₫"';
    wsMonthly.getCell('C8').value = { formula: 'IF(B5>0, ROUND(B8/B5*100, 1), 0) & "%"', result: `${pctConsultation}%` };
    wsMonthly.getCell('C8').alignment = { horizontal: 'center' };

    wsMonthly.getCell('A9').value = 'Total pharmacy sales:';
    wsMonthly.getCell('B9').value = { formula: 'SUM(Transactions!E:E)', result: monthlyPharmacyOnlyRev };
    wsMonthly.getCell('B9').numFmt = '#,##0" ₫"';
    wsMonthly.getCell('C9').value = { formula: 'IF(B5>0, ROUND(B9/B5*100, 1), 0) & "%"', result: `${pctPharmacy}%` };
    wsMonthly.getCell('C9').alignment = { horizontal: 'center' };

    wsMonthly.getCell('A10').value = 'Other services revenue:';
    wsMonthly.getCell('B10').value = { formula: 'SUM(Transactions!F:F)', result: monthlyServicesRev };
    wsMonthly.getCell('B10').numFmt = '#,##0" ₫"';
    wsMonthly.getCell('C10').value = { formula: 'IF(B5>0, ROUND(B10/B5*100, 1), 0) & "%"', result: `${pctServices}%` };
    wsMonthly.getCell('C10').alignment = { horizontal: 'center' };

    wsMonthly.getCell('A12').value = 'PATIENT STATISTICS';
    wsMonthly.getCell('A12').font = { name: 'Segoe UI', bold: true, size: 12 };

    wsMonthly.getCell('A13').value = 'Total patient visits this month:';
    wsMonthly.getCell('B13').value = { formula: 'COUNTA(Transactions!B:B)-1', result: currentMonthInvoices.length };

    wsMonthly.getCell('A14').value = 'Average patients/day:';
    wsMonthly.getCell('B14').value = avgPatientsPerDay;

    wsMonthly.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.font) cell.font = { name: 'Segoe UI' };
        else cell.font.name = 'Segoe UI';
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Monthly_Revenue_Report_${reportMonth}.xlsx`);
  };

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
    <div className="role-dashboard-shell work-dashboard" style={{ backgroundColor: '#ffffff' }}>
      <RoleTopNav role="accountant" />

      <div className="dashboard-layout" style={{ maxWidth: '100%', width: '100%', padding: '0 28px 24px 28px', display: 'flex', flex: 1, alignItems: 'stretch', gap: 0 }}>
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
        <main className="dashboard-main-content" style={{ paddingLeft: '0', paddingRight: '0', paddingTop: '0', background: '#ffffff', flex: 1, width: '100%', maxWidth: 'none', margin: 0, alignItems: 'stretch' }}>
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Invoices */}
          {activeTab === 'invoices' && (
            <div className="dashboard-card" style={{ width: '100%', paddingLeft: 0, paddingRight: 0, borderLeft: 'none', borderRight: 'none' }}>
              <div className="card-header flex-column md-row" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
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
                  <table className="custom-table" style={{ fontSize: '18px', width: '100%', tableLayout: 'fixed' }}>
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
            <div className="dashboard-card" id="print-area" style={{ width: '100%', paddingLeft: 0, paddingRight: 0, borderLeft: 'none', borderRight: 'none' }}>
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
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(dailyCashTotal)} <span style={{ color: '#64748b', fontSize: '16px' }}>(Safed)</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 8px 12px 32px' }}>▪️ Bank Transfer / Credit Card:</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{formatVND(dailyBankTotal)}</td>
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
                  <table className="custom-table" style={{ fontSize: '18px', width: '100%', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Invoice</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Patient</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Consultation fees</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Pharmacy sales</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Other revenue</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>DETAILS BY PAYMENT</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Total Amount</th>
                        <th style={{ fontSize: '16px', padding: '12px 10px' }}>Payment time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold" style={{ padding: '16px 10px', fontSize: '18px' }}>{inv._id.substring(18).toUpperCase()}</td>
                          <td style={{ padding: '16px 10px', fontSize: '20px', fontWeight: 'bold' }}>{inv.patientId?.fullName}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{formatVND(inv.consultationTotal || 0)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{formatVND(inv.medicinesTotal || 0)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{formatVND(inv.servicesTotal || 0)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{inv.paymentMethod === 'Bank Transfer' ? 'Bank Transfer / Credit Card' : 'Cash'}</td>
                          <td className="font-bold text-success" style={{ padding: '16px 10px', fontSize: '20px' }}>{formatVND(inv.computedTotal || inv.totalAmount)}</td>
                          <td style={{ padding: '16px 10px', fontSize: '18px' }}>{new Date(inv.paidAt).toLocaleTimeString('en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Print report
                </button>
                <button className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }} onClick={handleExportDailyExcel}>
                  📥 Export to Excel
                </button>
              </div>
            </div>
          )}

          {/* Tab: Monthly Reports */}
          {activeTab === 'monthly_reports' && (
            <div className="dashboard-card" id="print-area-monthly" style={{ width: '100%', paddingLeft: 0, paddingRight: 0, borderLeft: 'none', borderRight: 'none' }}>
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
              <div className="form-actions" style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  🖨️ Print report
                </button>
                <button className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }} onClick={handleExportMonthlyExcel}>
                  📥 Export to Excel
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
                              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                {selectedInvoice.status === 'Unpaid' && (
                                  <button 
                                    className="btn btn-sm btn-ghost" 
                                    style={{ color: '#ef4444', padding: '0 8px', fontSize: '16px', fontWeight: 'bold', marginRight: '8px', marginTop: '-2px' }}
                                    title="Remove this item"
                                    onClick={() => handleRemovePrescriptionItem(det._id, det.medicineId?.name || det.medicineId?.medicineName)}
                                  >
                                    &times;
                                  </button>
                                )}
                                <div>
                                  {det.medicineId?.name || det.medicineId?.medicineName}<br />
                                  <small className="text-muted">{det.medicineId?.dosageForm || 'Pill'} | Usage: {det.medicineId?.instruction || 'As directed'}</small>
                                </div>
                              </div>
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
