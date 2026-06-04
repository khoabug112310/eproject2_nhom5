import React, { useState, useEffect } from 'react';
import { clinicalAPI, schedulingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';
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
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [medSearch, setMedSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [medForm, setMedForm] = useState({
    quantity: 1,
    dosage: '1 viên',
    frequency: '2 lần/ngày',
    durationDays: 7,
    specialInstructions: 'Uống sau ăn',
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
      setErrorMessage('Lỗi khi tải dữ liệu bác sĩ. Vui lòng thử lại.');
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
      alert(`Lưu ý: Kho chỉ còn ${selectedMed.stockQuantity} ${selectedMed.unit}. Vẫn tiếp tục kê đơn?`);
    }

    const newItem = {
      medicineId: selectedMed._id,
      name: selectedMed.name,
      dosageForm: selectedMed.dosageForm,
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
      dosage: '1 viên',
      frequency: '2 lần/ngày',
      durationDays: 7,
      specialInstructions: 'Uống sau ăn',
    });
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== idx));
  };

  const handleSubmitExamination = async (e) => {
    e.preventDefault();
    if (!examForm.diagnosis) {
      alert('Vui lòng điền Chẩn đoán bệnh lý.');
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

      setSuccessMessage(`Đã khám xong cho bệnh nhân ${activeAppt.patientId?.fullName || ''}. Bệnh án đã được cập nhật thành công!`);
      setActiveAppt(null);
      fetchInitialData();
      setActiveTab('appointments');
    } catch (err) {
      const details = err?.response?.data?.details;
      const baseMsg = err?.response?.data?.message || 'Đã xảy ra lỗi khi lập hồ sơ bệnh án.';
      setErrorMessage(details ? `${baseMsg} (${details})` : baseMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filters for medicines
  const filteredMeds = medSearch
    ? medicinesList.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))
    : [];

  if (loading) {
    return (
      <div className="role-dashboard-shell work-dashboard">
        <RoleTopNav role="doctor" />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu bác sĩ. Vui lòng thử lại.</p>
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
            <h4>BS. {currentUser?.displayName || 'Bác sĩ'}</h4>
            <p className="p-card-number">{doctor?.specialization || 'Bác sĩ phòng khám'}</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => { setActiveTab('appointments'); setActiveAppt(null); }}
              className={activeTab === 'appointments' ? 'active' : ''}
            >
              📋 Danh sách bệnh nhân
            </button>
            <button
              onClick={() => { setActiveTab('history'); setActiveAppt(null); }}
              className={activeTab === 'history' ? 'active' : ''}
            >
              📚 Tra cứu hồ sơ bệnh án
            </button>
            <button
              onClick={() => { setActiveTab('schedule'); setActiveAppt(null); }}
              className={activeTab === 'schedule' ? 'active' : ''}
            >
              📅 Lịch trực & Làm việc
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
              <h2>Bệnh nhân cần tiếp nhận khám trong ngày</h2>
              <p className="subtitle">Xem danh sách bệnh nhân đã được xác nhận bởi Lễ tân / CSKH.</p>

              {appointments.filter(a => a.status === 'Confirmed' || a.status === 'Completed').length === 0 ? (
                <div className="empty-state">
                  <p>Không có bệnh nhân nào trong danh sách khám hôm nay.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Bệnh nhân</th>
                        <th>Ngày khám</th>
                        <th>Giờ hẹn</th>
                        <th>Số điện thoại</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments
                        .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
                        .map((appt) => (
                          <tr key={appt._id}>
                            <td>
                              <strong>{appt.patientId?.fullName}</strong><br />
                              <small className="text-muted">NS: {appt.patientId?.dateOfBirth ? new Date(appt.patientId.dateOfBirth).toLocaleDateString('vi-VN') : ''} | Giới tính: {appt.patientId?.gender}</small>
                            </td>
                            <td>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</td>
                            <td>{appt.requestedTime}</td>
                            <td>{appt.patientId?.phoneNumber}</td>
                            <td>
                              <span className={`badge ${appt.status === 'Completed' ? 'badge-success' : 'badge-primary'}`}>
                                {appt.status === 'Completed' ? 'Đã khám xong' : 'Đang chờ khám'}
                              </span>
                            </td>
                            <td>
                              {appt.status === 'Confirmed' && !getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  🩺 Vào khám bệnh
                                </button>
                              ) : appt.status === 'Confirmed' && getRecordForAppointment(appt._id) ? (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleSelectAppointment(appt)}
                                >
                                  ✏️ Cập nhật bệnh án
                                </button>
                              ) : (
                                <span className="text-muted">Đã lưu bệnh án</span>
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
                  ⬅️ Quay lại danh sách
                </button>
                <h2>Buồng khám bệnh: {activeAppt.patientId?.fullName}</h2>
                <span className="badge badge-primary">Số hồ sơ: {activeAppt.patientId?._id?.substring(18)}</span>
              </div>

              <div className="exam-panels-grid">
                {/* Left Panel: Historical EHR records */}
                <div className="exam-panel panel-left">
                  <h3>Tiền sử bệnh lý bệnh nhân</h3>
                  {patientHistory.length === 0 ? (
                    <p className="empty-text">Bệnh nhân chưa có lịch sử bệnh án trên hệ thống.</p>
                  ) : (
                    <div className="history-timeline">
                      {patientHistory.map((rec) => (
                        <div className="history-card" key={rec._id}>
                          <div className="h-card-header">
                            <span>📅 {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>Bác sĩ khám: BS. {rec.doctorId?.fullName}</span>
                          </div>
                          <div className="h-card-body">
                            <p><strong>Chẩn đoán:</strong> <span className="diagnosis-highlight">{rec.diagnosis}</span></p>
                            {rec.clinicalNotes && <p><strong>Lời dặn:</strong> {rec.clinicalNotes}</p>}
                            <div className="h-card-vitals">
                              {rec.bloodPressure && <span>HA: {rec.bloodPressure} | </span>}
                              {rec.heartRate && <span>Nhịp tim: {rec.heartRate} bpm | </span>}
                              {rec.temperature && <span>Nhiệt độ: {rec.temperature}°C</span>}
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
                        ? 'Cập nhật hồ sơ bệnh án hiện tại'
                        : 'Lập hồ sơ bệnh án hiện tại'}
                    </h3>
                    
                    {/* Vitals inputs */}
                    <div className="vitals-input-row">
                      <div className="form-group-sm">
                        <label>Chiều cao (cm)</label>
                        <input
                          type="number"
                          placeholder="VD: 170"
                          value={examForm.height}
                          onChange={(e) => setExamForm({ ...examForm, height: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Cân nặng (kg)</label>
                        <input
                          type="number"
                          placeholder="VD: 65"
                          value={examForm.weight}
                          onChange={(e) => setExamForm({ ...examForm, weight: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Huyết áp (mmHg)</label>
                        <input
                          type="text"
                          placeholder="VD: 120/80"
                          value={examForm.bloodPressure}
                          onChange={(e) => setExamForm({ ...examForm, bloodPressure: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Nhịp tim (bpm)</label>
                        <input
                          type="number"
                          placeholder="VD: 75"
                          value={examForm.heartRate}
                          onChange={(e) => setExamForm({ ...examForm, heartRate: e.target.value })}
                        />
                      </div>
                      <div className="form-group-sm">
                        <label>Nhiệt độ (°C)</label>
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
                      <label>Chẩn đoán bệnh lý *</label>
                      <input
                        type="text"
                        placeholder="VD: Viêm họng hạt cấp tính, sốt siêu vi"
                        value={examForm.diagnosis}
                        onChange={(e) => setExamForm({ ...examForm, diagnosis: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Lời dặn của bác sĩ / Hướng điều trị</label>
                      <textarea
                        rows="3"
                        placeholder="Chế độ sinh hoạt, nghỉ ngơi, hẹn tái khám sau..."
                        value={examForm.clinicalNotes}
                        onChange={(e) => setExamForm({ ...examForm, clinicalNotes: e.target.value })}
                      />
                    </div>

                    {/* Prescription sub-system */}
                    <div className="prescription-block">
                      <h4>Kê đơn thuốc điều trị</h4>
                      
                      <div className="medication-picker">
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            placeholder="🔍 Tìm kiếm tên thuốc tại kho..."
                            value={medSearch}
                            onChange={(e) => setMedSearch(e.target.value)}
                          />
                          {medSearch && filteredMeds.length > 0 && (
                            <ul className="search-dropdown-menu">
                              {filteredMeds.map((med) => (
                                <li key={med._id} onClick={() => { setSelectedMed(med); setMedSearch(med.name); }}>
                                  {med.name} ({med.dosageForm}) - Tồn kho: {med.stockQuantity} {med.unit}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {selectedMed && (
                        <div className="selected-medication-panel">
                          <p>Đang kê: <strong>{selectedMed.name}</strong> ({selectedMed.dosageForm}) | Giá: {selectedMed.unitPrice}đ | Tồn: {selectedMed.stockQuantity}</p>
                          <div className="med-fields-grid">
                            <div className="form-group-xs">
                              <label>Số lượng</label>
                              <input
                                type="number"
                                min="1"
                                value={medForm.quantity}
                                onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })}
                              />
                            </div>
                            <div className="form-group-xs">
                              <label>Liều dùng</label>
                              <input
                                type="text"
                                value={medForm.dosage}
                                onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                              />
                            </div>
                            <div className="form-group-xs">
                              <label>Tần suất</label>
                              <input
                                type="text"
                                value={medForm.frequency}
                                onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                              />
                            </div>
                            <div className="form-group-xs">
                              <label>Số ngày</label>
                              <input
                                type="number"
                                value={medForm.durationDays}
                                onChange={(e) => setMedForm({ ...medForm, durationDays: e.target.value })}
                              />
                            </div>
                            <div className="form-group-xs full">
                              <label>Lưu ý cách dùng</label>
                              <input
                                type="text"
                                value={medForm.specialInstructions}
                                onChange={(e) => setMedForm({ ...medForm, specialInstructions: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="button" className="btn btn-quick btn-xs" onClick={handleAddMedicine}>
                            Thêm vào đơn thuốc
                          </button>
                        </div>
                      )}

                      {/* Prescribed Items list */}
                      {prescriptionItems.length > 0 && (
                        <table className="prescription-list-table">
                          <thead>
                            <tr>
                              <th>Tên thuốc</th>
                              <th>SL</th>
                              <th>Liều dùng</th>
                              <th>Cách dùng</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prescriptionItems.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.name} <small className="text-muted">({item.dosageForm})</small></td>
                                <td><strong>{item.quantity}</strong></td>
                                <td>{item.dosage} - {item.frequency}</td>
                                <td>{item.durationDays} ngày ({item.specialInstructions})</td>
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
                        Hủy bỏ
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Đang hoàn tất khám...' : '💾 Hoàn thành khám & Kê đơn'}
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
              <h2>Tra cứu lịch sử bệnh án toàn phòng khám</h2>
              <p className="subtitle">Tìm kiếm và xem lại các chuẩn đoán, đơn thuốc của tất cả bệnh nhân.</p>

              {medicalRecords.length === 0 ? (
                <div className="empty-state">
                  <p>Hệ thống chưa ghi nhận bệnh án nào.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Bệnh nhân</th>
                        <th>Ngày lập bệnh án</th>
                        <th>Bác sĩ chỉ định</th>
                        <th>Chẩn đoán bệnh lý</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicalRecords.map((rec) => (
                        <tr key={rec._id}>
                          <td>
                            <strong>{rec.patientId?.fullName}</strong><br />
                            <small className="text-muted">CCCD: {rec.patientId?.identityCard} | SĐT: {rec.patientId?.phoneNumber}</small>
                          </td>
                          <td>{new Date(rec.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>BS. {rec.doctorId?.fullName}</td>
                          <td className="font-bold">{rec.diagnosis}</td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => {
                                // Find prescriptions and set modal view
                                clinicalAPI.getPrescriptions(rec._id)
                                  .then((res) => {
                                    alert(
                                      `BỆNH ÁN CHI TIẾT:\n` +
                                      `Bệnh nhân: ${rec.patientId?.fullName}\n` +
                                      `Chẩn đoán: ${rec.diagnosis}\n` +
                                      `Huyết áp: ${rec.bloodPressure || '--'} mmHg | Nhịp tim: ${rec.heartRate || '--'} bpm\n` +
                                      `Lời dặn bác sĩ: ${rec.clinicalNotes || 'Không có'}\n\n` +
                                      `ĐƠN THUỐC:\n` +
                                      (res.data.data.length === 0 
                                        ? 'Không kê đơn thuốc' 
                                        : res.data.data.map(p => `- ${p.medicineId?.name}: ${p.quantity} viên (${p.dosage} - ${p.frequency} - Dùng ${p.durationDays} ngày)`).join('\n'))
                                    );
                                  })
                                  .catch(console.error);
                              }}
                            >
                              Xem nhanh bệnh án
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
              <h2>Lịch làm việc của tôi</h2>
              <p className="subtitle">Xem danh sách các ca trực và số lượng bệnh nhân đã đăng ký.</p>

              {schedules.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn chưa có lịch trực nào được cấu hình bởi Quản trị viên.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ngày làm việc</th>
                        <th>Thời gian bắt đầu</th>
                        <th>Thời gian kết thúc</th>
                        <th>Giới hạn bệnh nhân</th>
                        <th>Đã đăng ký khám</th>
                        <th>Trạng thái ca trực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s) => (
                        <tr key={s._id}>
                          <td className="font-bold">{new Date(s.workDate).toLocaleDateString('vi-VN')}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td>{s.maxPatients} bệnh nhân</td>
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
                              {s.status === 'Available' ? 'Đang hoạt động' : 'Tạm dừng / Đầy'}
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
    </div>
  );
}
