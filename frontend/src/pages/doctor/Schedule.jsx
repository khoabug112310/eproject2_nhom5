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

  // Print prescription state
  const [printData, setPrintData] = useState(null);

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
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [medForm, setMedForm] = useState({
    quantity: 1,
    dosage: '1 tablet',
    frequency: 'Twice a day',
    durationDays: 7,
    specialInstructions: 'After meals',
  });

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
      // In getDoctors, wait, does it return the full profiles?
      // Yes, let's find the doctor whose userId matches or whose name contains or matches.
      // But getDoctors returns public friendly fields. Let's see if we can find by me.displayName or fetch users list if admin.
      // Wait, in public getDoctors list, we have: [{ id, fullName, avatar, specialization, department }]
      // Wait! The doctor public route in clinical controller is getDoctorsPublic:
      // it maps d._id to id. And in auth/controller.me:
      // if doctor, displayName is doctor.fullName!
      // So we can find doctor by comparing name:
      const matchedDoc = doctorsRes.data.data.find(d => d.fullName === me.displayName);
      if (matchedDoc) {
        setDoctor(matchedDoc);
        
        // Fetch appointments for this doctor
        const apptsRes = await schedulingAPI.getAppointments();
        // The API returns appointments. If role=doctor, schedulingAPI.getAppointments automatically filters by this doctor!
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
      setMedicalRecords(recordsRes.data.data);
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
    setPrescriptionItems([]);
    setMedSearch('');
    setSelectedMed(null);

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
        title: 'Stock warning',
        text: `Note: Only ${selectedMed.stockQuantity} ${selectedMed.unit} left in stock. Continue prescribing?`,
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
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
      specialInstructions: 'After meals',
    });
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const handleSubmitExamination = async (e) => {
    e.preventDefault();
    if (!examForm.diagnosis) {
      Swal.fire({
        title: 'Missing information',
        text: 'Please enter the diagnosis.',
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

      // 2. Create prescriptions if any
      if (prescriptionItems.length > 0) {
        await clinicalAPI.createPrescription({
          recordId: newRecord._id,
          medicines: prescriptionItems.map(item => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.durationDays,
            specialInstructions: item.specialInstructions,
          })),
        });
      }

      setSuccessMessage(`Examination completed for patient ${activeAppt.patientId?.fullName || ''}. The medical record has been updated successfully!`);
      // Store data for printing the prescription
      if (prescriptionItems.length > 0) {
        setPrintData({
          patient: activeAppt.patientId,
          doctor: currentUser,
          appointment: activeAppt,
          diagnosis: examForm.diagnosis,
          clinicalNotes: examForm.clinicalNotes,
          medicines: prescriptionItems,
          date: new Date(),
        });
      }
      setActiveAppt(null);
      fetchInitialData();
      setActiveTab('appointments');
    } catch (err) {
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'An error occurred while creating the medical record.';
      setErrorMessage(details ? `${baseMsg} (${details})` : baseMsg);
    } finally {
      setSubmitting(false);
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
          <p>Loading doctor data. Please wait.</p>
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
            <p className="p-card-number">{doctor?.specialization || 'Clinic doctor'}</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => { setActiveTab('appointments'); setActiveAppt(null); }}
              className={activeTab === 'appointments' ? 'active' : ''}
            >
              📋 Patient list
            </button>
            <button
              onClick={() => { setActiveTab('history'); setActiveAppt(null); }}
              className={activeTab === 'history' ? 'active' : ''}
            >
              📚 Medical records lookup
            </button>
            <button
              onClick={() => { setActiveTab('schedule'); setActiveAppt(null); }}
              className={activeTab === 'schedule' ? 'active' : ''}
            >
              📅 Work schedule
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
              <h2>Patients to examine today</h2>
              <p className="subtitle">View the list of patients confirmed by reception / customer care.</p>

              {appointments.filter(a => a.status === 'Confirmed' || a.status === 'Completed').length === 0 ? (
                <div className="empty-state">
                  <p>No patients in today's examination list.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
                        .map((appt) => (
                          <tr key={appt._id}>
                            <td>
                              <strong>{appt.patientId?.fullName}</strong><br />
                              <small className="text-muted">DOB: {appt.patientId?.dateOfBirth ? new Date(appt.patientId.dateOfBirth).toLocaleDateString('en-US') : ''} | Gender: {appt.patientId?.gender}</small>
                            </td>
                            <td>{new Date(appt.requestedDate).toLocaleDateString('en-US')}</td>
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
                                  🩺 Start examination
                                </button>
                              ) : appt.status === 'Confirmed' && getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  ✏️ Update record
                                </button>
                              ) : (
                                <span className="text-muted">Record saved</span>
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
                  ⬅️ Back to list
                </button>
                <h2>Examination room: {activeAppt.patientId?.fullName}</h2>
                <span className="badge badge-primary">Record no.: {activeAppt.patientId?._id?.substring(18)}</span>
              </div>

              <div className="exam-panels-grid">
                {/* Left Panel: Historical EHR records */}
                <div className="exam-panel panel-left">
                  <h3>Patient medical history</h3>
                  {patientHistory.length === 0 ? (
                    <p className="empty-text">This patient has no medical history in the system yet.</p>
                  ) : (
                    <div className="history-timeline">
                      {patientHistory.map((rec) => (
                        <div className="history-card" key={rec._id}>
                          <div className="h-card-header">
                            <span>📅 {new Date(rec.createdAt).toLocaleDateString('en-US')}</span>
                            <span>Examined by: Dr. {rec.doctorId?.fullName}</span>
                          </div>
                          <div className="h-card-body">
                            <p><strong>Diagnosis:</strong> <span className="diagnosis-highlight">{rec.diagnosis}</span></p>
                            {rec.clinicalNotes && <p><strong>Notes:</strong> {rec.clinicalNotes}</p>}
                            <div className="h-card-vitals">
                              {rec.bloodPressure && <span>BP: {rec.bloodPressure} | </span>}
                              {rec.heartRate && <span>Heart rate: {rec.heartRate} bpm | </span>}
                              {rec.temperature && <span>Temp: {rec.temperature}°C</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Panel: Exam Form & Prescriptions */}
                <div className="exam-panel panel-right">
                  <form onSubmit={handleSubmitExamination}>
                    <h3>
                      {getRecordForAppointment(activeAppt._id)
                        ? 'Update current medical record'
                        : 'Create medical record'}
                    </h3>
                    
                    {/* Vitals inputs */}
                    <div className="vitals-input-row">
                      <div className="form-group-sm">
                        <label>Height (cm)</label>
                        <input
                          type="number"
                          placeholder="VD: 170"
                          value={examForm.height}
                          onChange={(e) => setExamForm({ ...examForm, height: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="VD: 65"
                          value={examForm.weight}
                          onChange={(e) => setExamForm({ ...examForm, weight: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Blood pressure (mmHg)</label>
                        <input
                          type="text"
                          placeholder="VD: 120/80"
                          value={examForm.bloodPressure}
                          onChange={(e) => setExamForm({ ...examForm, bloodPressure: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Heart rate (bpm)</label>
                        <input
                          type="number"
                          placeholder="VD: 75"
                          value={examForm.heartRate}
                          onChange={(e) => setExamForm({ ...examForm, heartRate: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Temperature (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="VD: 36.5"
                          value={examForm.temperature}
                          onChange={(e) => setExamForm({ ...examForm, temperature: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Diagnosis *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acute follicular pharyngitis, viral fever"
                        value={examForm.diagnosis}
                        onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Doctor's notes / Treatment plan</label>
                      <textarea
                        rows="3"
                        placeholder="Lifestyle, rest, follow-up appointment..."
                        value={examForm.clinicalNotes}
                        onChange={(e) => setExamForm({ ...examForm, clinicalNotes: e.target.value })}
                      />
                    </div>

                    {/* Prescription sub-system */}
                    <div className="prescription-block">
                      <h4>Prescribe treatment medication</h4>
                      
                      <div className="medication-picker">
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            placeholder="🔍 Search medicine in stock..."
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
                        <div className="selected-medication-panel">
                          <p>
                            Prescribing: <strong>{selectedMed.medicineName || selectedMed.name}</strong> ({selectedMed.usageRoute || selectedMed.dosageForm})
                            | Price: {selectedMed.unitPrice} VND | Stock: {selectedMed.stockQuantity} {selectedMed.unit}
                            <button 
                              type="button" 
                              className="btn btn-ghost btn-xs" 
                              style={{ marginLeft: '10px', color: '#ef4444', minHeight: '28px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }} 
                              onClick={() => { setSelectedMed(null); setMedSearch(''); }}
                            >
                              ❌ Deselect
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
                              <label>Days</label>
                              <input
                                type="number"
                                value={medForm.durationDays}
                                onChange={(e) => setMedForm({ ...medForm, durationDays: e.target.value })}
                              />
                            </div>
                            <div className="form-group-xs full">
                              <label>Usage notes</label>
                              <input
                                type="text"
                                value={medForm.specialInstructions}
                                onChange={(e) => setMedForm({ ...medForm, specialInstructions: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="button" className="btn btn-quick btn-xs" onClick={handleAddMedicine}>
                            Add to prescription
                          </button>
                        </div>
                      )}

                      {/* Prescribed Items list */}
                      {prescriptionItems.length > 0 && (
                        <table className="prescription-list-table">
                          <thead>
                            <tr>
                              <th>Medicine</th>
                              <th>Qty</th>
                              <th>Dosage</th>
                              <th>Usage</th>
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
                      )}
                    </div>

                    <div className="form-actions" style={{ marginTop: 20 }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setActiveAppt(null)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Finalizing...' : '💾 Complete exam & Prescribe'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Medical Records Lookup */}
          {activeTab === 'history' && (
            <div className="dashboard-card">
              <h2>Clinic-wide medical record lookup</h2>
              <p className="subtitle">Search and review diagnoses and prescriptions for all patients.</p>

              {medicalRecords.length === 0 ? (
                <div className="empty-state">
                  <p>No medical records in the system yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Record date</th>
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
                          <td>{new Date(rec.createdAt).toLocaleDateString('en-US')}</td>
                          <td>Dr. {rec.doctorId?.fullName}</td>
                          <td className="font-bold">{rec.diagnosis}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                // Find prescriptions and set modal view
                                clinicalAPI.getPrescriptions(rec._id)
                                  .then((res) => {
                                    Swal.fire({
                                      title: 'Medical record details',
                                      html: `
                                        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
                                          <p><strong>Patient:</strong> ${rec.patientId?.fullName || 'N/A'}</p>
                                          <p><strong>Diagnosis:</strong> <span style="color: #10b981; font-weight: bold;">${rec.diagnosis}</span></p>
                                          <p><strong>Vital signs:</strong> BP: ${rec.bloodPressure || '--'} mmHg | Heart rate: ${rec.heartRate || '--'} bpm</p>
                                          <p><strong>Doctor's notes:</strong> ${rec.clinicalNotes || 'None'}</p>
                                          <hr style="border-top: 1px solid #e2e8f0; margin: 15px 0;">
                                          <p><strong>PRESCRIPTION DETAILS:</strong></p>
                                          <ul style="padding-left: 20px; margin: 0;">
                                            ${res.data.data.length === 0
                                              ? '<li>No medication prescribed</li>'
                                              : res.data.data.map(p => `<li><strong>${p.medicineId?.medicineName || p.medicineId?.name || 'Medicine'}</strong>: ${p.quantity} units (${p.dosage} - ${p.frequency} - for ${p.durationDays} days)</li>`).join('')
                                            }
                                          </ul>
                                        </div>
                                      `,
                                      icon: 'info',
                                      confirmButtonColor: '#3085d6',
                                      confirmButtonText: 'Close'
                                    });
                                  })
                                  .catch(console.error);
                              }}
                            >
                              Quick view
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
              <h2>My work schedule</h2>
              <p className="subtitle">View your shifts and the number of patients booked.</p>

              {schedules.length === 0 ? (
                <div className="empty-state">
                  <p>You don't have any shifts configured by the administrator yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Work date</th>
                        <th>Start time</th>
                        <th>End time</th>
                        <th>Patient limit</th>
                        <th>Booked</th>
                        <th>Shift status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s._id}>
                          <td className="font-bold">{new Date(s.workDate).toLocaleDateString('en-US')}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td>{s.maxPatients} patients</td>
                          <td>
                            <strong>{s.currentBooked}</strong> / {s.maxPatients}
                            <br />
                            <small className="text-muted">Attended: {s.actualAttended || 0}</small>
                            <div className="progress-bar-container">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${Math.min(100, (s.currentBooked / s.maxPatients) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${s.status === 'Available' ? 'badge-success' : 'badge-danger'}`}>
                              {s.status === 'Available' ? 'Active' : 'Paused / Full'}
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

      {/* Print Prescription Modal */}
      {printData && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>Prescription completed — Ready to print</h3>
              <button className="close-btn" onClick={() => setPrintData(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div id="prescription-print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.6, color: '#111' }}>
                {/* Clinic header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0066cc', paddingBottom: 12, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0066cc' }}>HOPSONTAI GENERAL CLINIC</div>
                  <div style={{ fontSize: 11, color: '#555' }}>123 Hop Son Street, Hai Ba Trung District, Hanoi | Hotline: 1900 6868</div>
                  <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8, letterSpacing: 2 }}>PRESCRIPTION</div>
                  <div style={{ fontSize: 11, color: '#555' }}>Date: {printData.date.toLocaleDateString('en-US')} — Record no.: {printData.appointment?._id?.slice(-8).toUpperCase()}</div>
                </div>

                {/* Patient info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', marginBottom: 14, padding: '10px 0', borderBottom: '1px solid #ddd' }}>
                  <div><strong>Full name:</strong> {printData.patient?.fullName}</div>
                  <div><strong>Date of birth:</strong> {printData.patient?.dateOfBirth ? new Date(printData.patient.dateOfBirth).toLocaleDateString('en-US') : '--'}</div>
                  <div><strong>Gender:</strong> {printData.patient?.gender}</div>
                  <div><strong>Phone:</strong> {printData.patient?.phoneNumber}</div>
                  <div style={{ gridColumn: '1/-1' }}><strong>Address:</strong> {printData.patient?.address || '--'}</div>
                </div>

                {/* Diagnosis */}
                <div style={{ marginBottom: 14, padding: '8px 12px', background: '#f0f7ff', borderLeft: '4px solid #0066cc', borderRadius: 4 }}>
                  <strong>Diagnosis:</strong> {printData.diagnosis}
                  {printData.clinicalNotes && <div style={{ marginTop: 4, fontSize: 12, color: '#333' }}><strong>Notes:</strong> {printData.clinicalNotes}</div>}
                </div>

                {/* Medicine table */}
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Medication list:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#e8f0fe' }}>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>STT</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Medicine</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center' }}>Route</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'center' }}>SL</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.medicines.map((m, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 600 }}>{m.name}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.dosageForm || 'Oral'}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>{m.quantity}</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{m.dosage} — {m.frequency} — {m.durationDays} days ({m.specialInstructions})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signature footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingRight: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#555' }}>{printData.date.toLocaleDateString('en-US')}</div>
                    <div style={{ fontWeight: 700 }}>Examining doctor</div>
                    <div style={{ marginTop: 48, fontWeight: 600 }}>Dr. {printData.doctor?.displayName}</div>
                  </div>
                </div>

                <div style={{ marginTop: 20, fontSize: 11, color: '#888', borderTop: '1px solid #ddd', paddingTop: 8 }}>
                  * This prescription is valid for 5 days from the date of issue. Please bring it to the cashier to pay and collect your medication.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPrintData(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const content = document.getElementById('prescription-print-area').innerHTML;
                  const w = window.open('', '_blank');
                  w.document.write(`<html><head><title>Prescription</title><style>body{margin:24px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style></head><body>${content}</body></html>`);
                  w.document.close();
                  w.print();
                }}
              >
                Print prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
