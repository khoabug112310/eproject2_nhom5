import React, { useState, useEffect } from 'react';
import { clinicalAPI, schedulingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
import Swal from 'sweetalert2';
import '../../styles/work-dashboard.css';

export default function DoctorSchedule() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [currentUser, setCurrentUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Active examination state
  const [activeAppt, setActiveAppt] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [examForm, setExamForm] = useState({
    height: '',
    weight: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    diagnosis: '',
    clinicalNotes: '',
  });
  
  // Prescriptions state
  const [selectedRecordForPrescription, setSelectedRecordForPrescription] = useState(null);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [medForm, setMedForm] = useState({
    quantity: 1,
    dosage: '1 tablet',
    frequency: 'Twice a day',
    durationDays: 7,
    specialInstructions: 'Take after meals',
  });

  // Modal State for Record & Prescription Print
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordPrescriptions, setRecordPrescriptions] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Get Me
      const meRes = await authAPI.me();
      const me = meRes.data.data;
      setCurrentUser(me);

      // 2. Find doctor profile
      const doctorsRes = await clinicalAPI.getDoctors();
      const matchedDoc = doctorsRes.data.data.find(d => d.fullName === me.displayName);
      if (matchedDoc) {
        setDoctor(matchedDoc);
        
        // Fetch appointments for this doctor
        const apptsRes = await schedulingAPI.getAppointments();
        setAppointments(apptsRes.data.data);

        // Fetch schedules
        const schedsRes = await schedulingAPI.getSchedules(matchedDoc.id);
        setSchedules(schedsRes.data.data);
      }

      // Fetch medicines for prescription search
      const medsRes = await clinicalAPI.getMedicines();
      setMedicinesList(medsRes.data.data);

      // Fetch all medical records (to allow looking up history)
      const recordsRes = await clinicalAPI.getMedicalRecords();
      // Sort newest first
      const sortedRecords = recordsRes.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setMedicalRecords(sortedRecords);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error loading doctor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRecordForAppointment = (apptId) => {
    const id = apptId?.toString?.() || apptId;
    return medicalRecords.find((rec) => {
      const recApptId = rec.appointmentId?._id || rec.appointmentId;
      return recApptId?.toString?.() === id;
    });
  };

  const handleSelectAppointment = async (appt) => {
    setActiveAppt(appt);
    const existingRecord = getRecordForAppointment(appt._id);
    setExamForm({
      height: existingRecord?.height?.toString() || '',
      weight: existingRecord?.weight?.toString() || '',
      bloodPressure: existingRecord?.bloodPressure || '',
      heartRate: existingRecord?.heartRate?.toString() || '',
      temperature: existingRecord?.temperature?.toString() || '',
      diagnosis: existingRecord?.diagnosis || '',
      clinicalNotes: existingRecord?.clinicalNotes || '',
    });

    // Load patient history
    try {
      const patientId = appt.patientId?._id || appt.patientId;
      const historyRes = await clinicalAPI.getMedicalRecords({ patientId });
      setPatientHistory(historyRes.data.data);
    } catch (err) {
      console.error('Error loading patient history', err);
    }
  };

  const handleAddMedicine = () => {
    if (!selectedMed) return;
    
    // Check if stock is sufficient
    if (selectedMed.stockQuantity < medForm.quantity) {
      Swal.fire({
        title: 'Inventory Warning',
        text: `Note: Only ${selectedMed.stockQuantity} ${selectedMed.unit} left in stock. Continue prescribing?`,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Agree'
      });
    }

    const newItem = {
      medicineId: selectedMed._id,
      name: selectedMed.medicineName || selectedMed.name,
      dosageForm: selectedMed.usageRoute || selectedMed.dosageForm || 'Oral',
      quantity: Number(medForm.quantity),
      dosage: medForm.dosage,
      frequency: medForm.frequency,
      durationDays: Number(medForm.durationDays),
      specialInstructions: medForm.specialInstructions,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
    setSelectedMed(null);
    setMedSearch('');
    setMedForm({
      quantity: 1,
      dosage: '1 tablet',
      frequency: 'Twice a day',
      durationDays: 7,
      specialInstructions: 'Take after meals',
    });
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const handleSubmitExamination = async (e) => {
    e.preventDefault();
    if (!examForm.diagnosis) {
      Swal.fire({
        title: 'Missing Information',
        text: 'Please enter the Medical Diagnosis.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // 1. Create medical record
      const recordRes = await clinicalAPI.createMedicalRecord({
        appointmentId: activeAppt._id,
        height: examForm.height || undefined,
        weight: examForm.weight || undefined,
        bloodPressure: examForm.bloodPressure || undefined,
        heartRate: examForm.heartRate || undefined,
        temperature: examForm.temperature || undefined,
        diagnosis: examForm.diagnosis,
        clinicalNotes: examForm.clinicalNotes,
      });

      const newRecord = recordRes.data.data;

      setSuccessMessage(`Examination completed. Please prescribe medication for the patient.`);
      setActiveAppt(null);
      await fetchInitialData(); // update records list
      
      // Auto switch to prescription tab
      setSelectedRecordForPrescription(newRecord._id);
      setActiveTab('prescribe');

    } catch (err) {
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'An error occurred while creating the medical record.';
      setErrorMessage(details ? `${baseMsg} (${details})` : baseMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPrescriptionOnly = async () => {
    if (prescriptionItems.length === 0) {
      Swal.fire('Error', 'Please add at least one medicine to the prescription.', 'error');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await clinicalAPI.createPrescription({
        recordId: selectedRecordForPrescription,
        medicines: prescriptionItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          specialInstructions: item.specialInstructions,
        })),
      });
      
      // Fetch the populated prescriptions for printing
      const presRes = await clinicalAPI.getPrescriptions(selectedRecordForPrescription);
      const loadedPrescriptions = presRes.data.data;

      // Populate patient info for modal
      const recordObj = medicalRecords.find(r => r._id === selectedRecordForPrescription);
      
      setSelectedRecord(recordObj);
      setRecordPrescriptions(loadedPrescriptions);

      setSuccessMessage(`Prescription sent successfully!`);
      setPrescriptionItems([]);
      setSelectedRecordForPrescription(null);
    } catch (err) {
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'An error occurred while creating the prescription.';
      setErrorMessage(details ? `${baseMsg} (${details})` : baseMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickView = async (rec) => {
    try {
      const res = await clinicalAPI.getPrescriptions(rec._id);
      setSelectedRecord(rec);
      setRecordPrescriptions(res.data.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Could not load record details.', 'error');
    }
  };

  // Filters for medicines
  const filteredMeds = medSearch
    ? medicinesList.filter(m => 
        (m.medicineName || m.name || '').toLowerCase().includes(medSearch.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="role-dashboard-shell work-dashboard">
        <RoleTopNav role="doctor" />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading doctor data. Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell work-dashboard">
      <RoleTopNav role="doctor" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">🩺</div>
            <h4>Dr. {currentUser?.displayName || 'Doctor'}</h4>
            <p className="p-card-number">{doctor?.specialization || 'Clinic Doctor'}</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => { setActiveTab('appointments'); setActiveAppt(null); }}
              className={activeTab === 'appointments' ? 'active' : ''}
            >
              📋 Patient List
            </button>
            <button
              onClick={() => { setActiveTab('history'); setActiveAppt(null); }}
              className={activeTab === 'history' ? 'active' : ''}
            >
              📚 Medical Records
            </button>
            <button
              onClick={() => { setActiveTab('prescribe'); setActiveAppt(null); }}
              className={activeTab === 'prescribe' ? 'active' : ''}
            >
              💊 Prescribe Medication
            </button>
            <button
              onClick={() => { setActiveTab('schedule'); setActiveAppt(null); }}
              className={activeTab === 'schedule' ? 'active' : ''}
            >
              📅 Work Schedule
            </button>
          </nav>
        </aside>

        {/* Main Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Appointments Queue / Examination Workspace */}
          {activeTab === 'appointments' && !activeAppt && (
            <div className="dashboard-card">
              <h2>Today's Patient Queue</h2>
              <p className="subtitle">View the list of patients confirmed by Reception / Customer Care.</p>

              {appointments.filter(a => a.status === 'Confirmed' || a.status === 'Completed').length === 0 ? (
                <div className="empty-state">
                  <p>No patients in the queue for today.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Exam Date</th>
                        <th>Time</th>
                        <th>Phone Number</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
                        .map((appt) => (
                          <tr key={appt._id}>
                            <td>
                              <strong>{appt.patientId?.fullName}</strong><br />
                              <small className="text-muted">DOB: {appt.patientId?.dateOfBirth ? new Date(appt.patientId.dateOfBirth).toLocaleDateString('en-GB') : ''} | Gender: {appt.patientId?.gender}</small>
                            </td>
                            <td>{new Date(appt.requestedDate).toLocaleDateString('en-GB')}</td>
                            <td>{appt.requestedTime}</td>
                            <td>{appt.patientId?.phoneNumber}</td>
                            <td>
                              <span className={`badge ${appt.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>
                                {appt.status === 'Completed' ? 'Examined' : 'Waiting'}
                              </span>
                            </td>
                            <td>
                              {appt.status === 'Confirmed' && !getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  🩺 Start Examination
                                </button>
                              ) : appt.status === 'Confirmed' && getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  ✏️ Update Record
                                </button>
                              ) : (
                                <span className="text-muted">Record Saved</span>
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

          {/* Active Examination workspace (clinical panel) */}
          {activeTab === 'appointments' && activeAppt && (
            <div className="exam-workspace-container">
              <div className="workspace-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveAppt(null)}>
                  ⬅️ Back to List
                </button>
                <h2>Examination Room: {activeAppt.patientId?.fullName}</h2>
                <span className="badge badge-primary">Record No: {activeAppt.patientId?._id?.substring(18)}</span>
              </div>

              <div className="exam-panels-grid">
                {/* Left Panel: Historical EHR records */}
                <div className="exam-panel panel-left">
                  <h3>Patient Medical History</h3>
                  {patientHistory.length === 0 ? (
                    <p className="empty-text">The patient has no medical history in the system.</p>
                  ) : (
                    <div className="history-timeline">
                      {patientHistory.map((rec) => (
                        <div className="history-card" key={rec._id}>
                          <div className="h-card-header">
                            <span>📅 {new Date(rec.createdAt).toLocaleDateString('en-GB')}</span>
                            <span>Doctor: Dr. {rec.doctorId?.fullName}</span>
                          </div>
                          <div className="h-card-body">
                            <p><strong>Diagnosis:</strong> <span className="diagnosis-highlight">{rec.diagnosis}</span></p>
                            {rec.clinicalNotes && <p><strong>Notes:</strong> {rec.clinicalNotes}</p>}
                            <div className="h-card-vitals">
                              {rec.bloodPressure && <span>BP: {rec.bloodPressure} | </span>}
                              {rec.heartRate && <span>HR: {rec.heartRate} bpm | </span>}
                              {rec.temperature && <span>Temp: {rec.temperature}°C</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Panel: Exam Form */}
                <div className="exam-panel panel-right">
                  <form onSubmit={handleSubmitExamination}>
                    <h3>
                      {getRecordForAppointment(activeAppt._id)
                        ? 'Update Current Medical Record'
                        : 'Create Current Medical Record'}
                    </h3>
                    
                    {/* Vitals inputs */}
                    <div className="vitals-input-row">
                      <div className="form-group-sm">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          placeholder="Ex: 170"
                          value={examForm.height}
                          onChange={(e) => setExamForm({ ...examForm, height: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="Ex: 65"
                          value={examForm.weight}
                          onChange={(e) => setExamForm({ ...examForm, weight: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Blood Pressure (mmHg)</label>
                        <input
                          type="text"
                          placeholder="Ex: 120/80"
                          value={examForm.bloodPressure}
                          onChange={(e) => setExamForm({ ...examForm, bloodPressure: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Heart Rate (bpm)</label>
                        <input
                          type="number"
                          placeholder="Ex: 75"
                          value={examForm.heartRate}
                          onChange={(e) => setExamForm({ ...examForm, heartRate: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Temperature (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 36.5"
                          value={examForm.temperature}
                          onChange={(e) => setExamForm({ ...examForm, temperature: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Medical Diagnosis *</label>
                      <input
                        type="text"
                        placeholder="Ex: Acute pharyngitis, viral fever"
                        value={examForm.diagnosis}
                        onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Doctor's Advice / Treatment Plan</label>
                      <textarea
                        rows="3"
                        placeholder="Diet, rest, schedule a follow-up after..."
                        value={examForm.clinicalNotes}
                        onChange={(e) => setExamForm({ ...examForm, clinicalNotes: e.target.value })}
                      />
                    </div>

                    <div className="form-actions" style={{ marginTop: 20 }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setActiveAppt(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : '💾 Complete Exam & Move to Prescription'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Prescribe Medication */}
          {activeTab === 'prescribe' && (
            <div className="dashboard-card">
              <h2>Prescribe Medication</h2>
              <p className="subtitle">Select a patient's medical record to create a prescription.</p>

              <div className="form-group" style={{ maxWidth: '600px', marginBottom: '30px' }}>
                <label style={{ fontWeight: 'bold' }}>1. Select Medical Record</label>
                <select 
                  className="form-control" 
                  style={{ padding: '10px', fontSize: '15px' }}
                  value={selectedRecordForPrescription || ''} 
                  onChange={(e) => setSelectedRecordForPrescription(e.target.value)}
                >
                  <option value="">-- Choose a recent examination record --</option>
                  {medicalRecords.map(rec => (
                    <option key={rec._id} value={rec._id}>
                      {new Date(rec.createdAt).toLocaleDateString('en-GB')} - Patient: {rec.patientId?.fullName} - Diagnosis: {rec.diagnosis}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRecordForPrescription ? (
                <div className="prescription-block" style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                    2. Add Medicines to Prescription
                  </h4>
                  
                  <div className="medication-picker">
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        placeholder="🔍 Search medicine in inventory..."
                        value={medSearch}
                        onChange={(e) => {
                          setMedSearch(e.target.value);
                          if (selectedMed) setSelectedMed(null);
                        }}
                      />
                      {medSearch && !selectedMed && filteredMeds.length > 0 && (
                        <ul className="search-dropdown-menu">
                          {filteredMeds.map((med) => (
                            <li key={med._id} onClick={() => { setSelectedMed(med); setMedSearch(med.medicineName || med.name || ''); }}>
                              {med.medicineName || med.name} ({med.usageRoute || med.dosageForm || 'Oral'}) - Stock: {med.stockQuantity} {med.unit}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {selectedMed && (
                    <div className="selected-medication-panel" style={{ background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <p>
                        Prescribing: <strong>{selectedMed.medicineName || selectedMed.name}</strong> ({selectedMed.usageRoute || selectedMed.dosageForm}) 
                        | Price: {selectedMed.unitPrice}đ | Stock: {selectedMed.stockQuantity} {selectedMed.unit}
                        <button 
                          type="button" 
                          className="btn btn-ghost btn-xs" 
                          style={{ marginLeft: '10px', color: '#ef4444', minHeight: '28px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }} 
                          onClick={() => { setSelectedMed(null); setMedSearch(''); }}
                        >
                          ❌ Cancel Selection
                        </button>
                      </p>
                      <div className="med-fields-grid">
                        <div className="form-group-xs">
                          <label>Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={medForm.quantity}
                            onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })}
                          />
                        </div>
                        <div className="form-group-xs">
                          <label>Dosage</label>
                          <input
                            type="text"
                            value={medForm.dosage}
                            onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                          />
                        </div>
                        <div className="form-group-xs">
                          <label>Frequency</label>
                          <input
                            type="text"
                            value={medForm.frequency}
                            onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                          />
                        </div>
                        <div className="form-group-xs">
                          <label>Duration (days)</label>
                          <input
                            type="number"
                            value={medForm.durationDays}
                            onChange={(e) => setMedForm({ ...medForm, durationDays: e.target.value })}
                          />
                        </div>
                        <div className="form-group-xs full">
                          <label>Special Instructions</label>
                          <input
                            type="text"
                            value={medForm.specialInstructions}
                            onChange={(e) => setMedForm({ ...medForm, specialInstructions: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="button" className="btn btn-quick btn-xs" onClick={handleAddMedicine}>
                        + Add to Prescription
                      </button>
                    </div>
                  )}

                  {/* Prescribed Items list */}
                  {prescriptionItems.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h5>Selected Medicines:</h5>
                      <table className="prescription-list-table">
                        <thead>
                          <tr>
                            <th>Medicine Name</th>
                            <th>Qty</th>
                            <th>Dosage</th>
                            <th>Instructions</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptionItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name} <small className="text-muted">({item.dosageForm})</small></td>
                              <td><strong>{item.quantity}</strong></td>
                              <td>{item.dosage} - {item.frequency}</td>
                              <td>{item.durationDays} days ({item.specialInstructions})</td>
                              <td>
                                <button type="button" className="btn-remove" onClick={() => handleRemoveMedicine(idx)}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="form-actions" style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ fontSize: '16px', padding: '10px 20px' }}
                      onClick={handleSubmitPrescriptionOnly}
                      disabled={submitting || prescriptionItems.length === 0}
                    >
                      {submitting ? 'Sending...' : '💊 Gửi đơn thuốc (Send Prescription)'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px' }}>
                  <p>Please select a medical record from the dropdown above to start prescribing.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Medical Records Lookup */}
          {activeTab === 'history' && (
            <div className="dashboard-card">
              <h2>Clinic Medical Records History</h2>
              <p className="subtitle">Search and review diagnoses and prescriptions for all patients.</p>

              {medicalRecords.length === 0 ? (
                <div className="empty-state">
                  <p>No medical records have been recorded in the system yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Record Date</th>
                        <th>Doctor</th>
                        <th>Diagnosis</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalRecords.map((rec) => (
                        <tr key={rec._id}>
                          <td>
                            <strong>{rec.patientId?.fullName}</strong><br />
                            <small className="text-muted">ID: {rec.patientId?.identityCard} | Phone: {rec.patientId?.phoneNumber}</small>
                          </td>
                          <td>{new Date(rec.createdAt).toLocaleDateString('en-GB')}</td>
                          <td>Dr. {rec.doctorId?.fullName}</td>
                          <td className="font-bold">{rec.diagnosis}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleQuickView(rec)}
                            >
                              Quick View & Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Doctor Schedules */}
          {activeTab === 'schedule' && (
            <div className="dashboard-card">
              <h2>My Work Schedule</h2>
              <p className="subtitle">View upcoming shifts and booked patients count.</p>

              {schedules.length === 0 ? (
                <div className="empty-state">
                  <p>You have no scheduled shifts configured by the Administrator.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Work Date</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Patient Limit</th>
                        <th>Registered</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s._id}>
                          <td className="font-bold">{new Date(s.workDate).toLocaleDateString('en-GB')}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td>{s.maxPatients} patients</td>
                          <td>
                            <strong>{s.currentBooked}</strong> / {s.maxPatients}
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${Math.min(100, (s.currentBooked / s.maxPatients) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.status === 'Available' ? 'badge-success' : 'badge-danger'}`}>
                              {s.status === 'Available' ? 'Available' : 'Paused / Full'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Record Detail & Prescription Print Modal */}
      {selectedRecord && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h3>Medical Record & Prescription</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>&times;</button>
            </div>
            <div className="modal-body print-section" id="print-area">
              <div className="receipt-brand">
                <h2>HOP SON TAI GENERAL CLINIC</h2>
                <p>123 Hop Son Street, Hai Ba Trung District, Hanoi | Hotline: 1900 6868</p>
              </div>
              <hr />
              <div className="receipt-meta">
                <div>
                  <p><strong>Patient:</strong> {selectedRecord.patientId?.fullName || 'N/A'}</p>
                  <p><strong>Diagnosis:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedRecord.diagnosis}</span></p>
                  <p><strong>Vitals:</strong> BP: {selectedRecord.bloodPressure || '--'} mmHg | HR: {selectedRecord.heartRate || '--'} bpm</p>
                  <p><strong>Doctor's Notes:</strong> {selectedRecord.clinicalNotes || 'None'}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date:</strong> {new Date(selectedRecord.createdAt).toLocaleDateString('en-GB')}</p>
                  <p><strong>Doctor:</strong> Dr. {selectedRecord.doctorId?.fullName || currentUser?.displayName}</p>
                </div>
              </div>

              {recordPrescriptions && recordPrescriptions.length > 0 ? (
                <div className="receipt-items-container" style={{ marginTop: 20 }}>
                  <h4 style={{ textAlign: 'center', marginBottom: 15, fontSize: '18px', textTransform: 'uppercase' }}>Prescription</h4>
                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th>Medicine</th>
                        <th className="text-center">Quantity</th>
                        <th>Dosage & Frequency</th>
                        <th>Duration & Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordPrescriptions.map((p, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{p.medicineId?.medicineName || p.medicineId?.name || 'Medicine'}</strong>
                          </td>
                          <td className="text-center">{p.quantity}</td>
                          <td>{p.dosage} - {p.frequency}</td>
                          <td>{p.durationDays} days ({p.specialInstructions})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ marginTop: 20, textAlign: 'center' }}>
                  <p><em>No prescription was issued for this examination.</em></p>
                </div>
              )}
              
              <div className="receipt-summary" style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <p><strong>Physician's Signature</strong></p>
                  <br /><br /><br />
                  <p>Dr. {selectedRecord.doctorId?.fullName || currentUser?.displayName}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {recordPrescriptions && recordPrescriptions.length > 0 && (
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Prescription</button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
