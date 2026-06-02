import React, { useState, useEffect } from 'react';
import { schedulingAPI, profilesAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

  // Edit Patient Profile State (for Quick Bookings)
  const [editingPatient, setEditingPatient] = useState(null);
  const [activeApptId, setActiveApptId] = useState(null);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    phoneNumber: '',
    address: '',
    insuranceCode: '',
    emergencyContact: '',
  });

  // Expanded patient groups for account bookings (grouping by patient)
  const [expandedPatientIds, setExpandedPatientIds] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Get all appointments
      const apptsRes = await schedulingAPI.getAppointments();
      setAppointments(apptsRes.data.data);

      // 2. Get all patients profiles
      const patientsRes = await profilesAPI.getPatients();
      setPatients(patientsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi khi lấy danh sách đặt lịch.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (appt) => {
    const p = appt.patientId;
    setActiveApptId(appt._id);
    setEditingPatient(p);

    setPatientForm({
      fullName: p?.fullName || '',
      dateOfBirth: p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      gender: p?.gender || 'Nam',
      identityCard: p?.identityCard || '',
      phoneNumber: p?.phoneNumber || '',
      address: p?.address || '',
      insuranceCode: p?.insuranceCode || '',
      emergencyContact: p?.emergencyContact || '',
    });
  };

  const handleUpdateAndConfirm = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // 1. Update patient profile
      const updateData = {
        fullName: patientForm.fullName,
        dateOfBirth: patientForm.dateOfBirth,
        gender: patientForm.gender,
        identityCard: patientForm.identityCard,
        phoneNumber: patientForm.phoneNumber,
        address: patientForm.address,
        emergencyContact: patientForm.emergencyContact,
      };
      // Only include insuranceCode if it has a value (BHYT is optional)
      if (patientForm.insuranceCode?.trim()) {
        updateData.insuranceCode = patientForm.insuranceCode.trim();
      }
      await profilesAPI.updateUser(editingPatient._id, updateData);

      // 2. Confirm the appointment
      await schedulingAPI.updateAppointment(activeApptId, { status: 'Confirmed' });

      setSuccessMessage('Đã cập nhật thông tin bệnh nhân và XÁC NHẬN lịch khám thành công!');
      setEditingPatient(null);
      setActiveApptId(null);
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận lịch khám.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectConfirm = async (apptId) => {
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.updateAppointment(apptId, { status: 'Confirmed' });
      setSuccessMessage('Xác nhận lịch khám thành công! Hóa đơn khám lâm sàng đã được tự động tạo.');
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể xác nhận lịch khám.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm and cancel appointment immediately (simple confirm)
  const handleCancelAppointment = async (apptId) => {
    const appt = appointments.find((item) => item._id === apptId);
    if (!appt) return;
    if (!window.confirm('Bạn có chắc muốn hủy lịch này?')) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.updateAppointment(apptId, { status: 'Canceled' });
      setSuccessMessage('Lịch đã được hủy.');
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể hủy lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to detect if a patient is a quick booking (missing details)
  const isQuickBooking = (patient) => {
    if (!patient) return true;
    const isDefaultDob = new Date(patient.dateOfBirth).getFullYear() <= 1905;
    const isDefaultCard = patient.identityCard?.startsWith('REG-') || patient.identityCard?.startsWith('ADM-');
    const isDefaultName = patient.fullName === 'Khách hàng' || patient.fullName === 'Guest';
    return isDefaultDob || isDefaultCard || isDefaultName || !patient.address || !patient.identityCard;
  };

  // Toggle expand/collapse for a patient group
  const togglePatientExpand = (patientId) => {
    const newSet = new Set(expandedPatientIds);
    if (newSet.has(patientId)) {
      newSet.delete(patientId);
    } else {
      newSet.add(patientId);
    }
    setExpandedPatientIds(newSet);
  };

  // Group account appointments by patient ID
  const groupAppointmentsByPatient = (appointments) => {
    const groups = {};
    appointments.forEach((appt) => {
      const patientId = appt.patientId?._id;
      if (patientId) {
        if (!groups[patientId]) {
          groups[patientId] = {
            patient: appt.patientId,
            appointments: [],
          };
        }
        groups[patientId].appointments.push(appt);
      }
    });
    return Object.values(groups);
  };

  const renderStatus = (status) => {
    let cls = '';
    let label = status;
    if (status === 'Pending') { cls = 'badge-warning'; label = 'Đang chờ duyệt'; }
    else if (status === 'Confirmed') { cls = 'badge-primary'; label = 'Đã xác nhận'; }
    else if (status === 'Completed') { cls = 'badge-success'; label = 'Đã khám xong'; }
    else if (status === 'Canceled') { cls = 'badge-danger'; label = 'Đã hủy'; }
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const filteredAppointments = appointments.filter(a => filterStatus === 'All' || a.status === filterStatus);
  const accountAppointments = filteredAppointments.filter((a) => !isQuickBooking(a.patientId));
  const guestAppointments = filteredAppointments.filter((a) => isQuickBooking(a.patientId));

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải danh sách đặt lịch...</p>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="staff" />

      <div className="dashboard-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">📞</div>
            <h4>Bộ phận CSKH</h4>
            <p className="p-card-number">Tiếp nhận & Điều phối</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setFilterStatus('Pending')}
              className={filterStatus === 'Pending' ? 'active' : ''}
            >
              ⏳ Lịch chờ duyệt ({appointments.filter(a => a.status === 'Pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('Confirmed')}
              className={filterStatus === 'Confirmed' ? 'active' : ''}
            >
              ✅ Lịch đã duyệt ({appointments.filter(a => a.status === 'Confirmed').length})
            </button>
            <button
              onClick={() => setFilterStatus('All')}
              className={filterStatus === 'All' ? 'active' : ''}
            >
              📅 Tất cả yêu cầu ({appointments.length})
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          <div className="dashboard-card">
            <h2>Hàng đợi tiếp nhận khám bệnh</h2>
            <p className="subtitle">CSKH kiểm tra thông tin liên hệ và CCCD của bệnh nhân trước khi đưa vào hàng chờ khám.</p>

            {filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <p>Không có yêu cầu đặt lịch nào phù hợp.</p>
              </div>
            ) : (
              <>
                <div className="booking-summary-grid">
                  <div className="booking-summary-card booking-summary-card--account">
                    <h4>Khách có tài khoản</h4>
                    <p>{accountAppointments.length} ca</p>
                  </div>
                  <div className="booking-summary-card booking-summary-card--guest">
                    <h4>Khách vãng lai</h4>
                    <p>{guestAppointments.length} ca</p>
                  </div>
                </div>

                <div className="booking-group">
                  <h3>Khách có tài khoản ({accountAppointments.length})</h3>
                  {accountAppointments.length === 0 ? (
                    <div className="empty-state">
                      <p>Không có yêu cầu từ khách có tài khoản trong danh sách hiện tại.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}></th>
                            <th>Bệnh nhân</th>
                            <th>Tổng yêu cầu</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupAppointmentsByPatient(accountAppointments).map((group) => {
                            const isExpanded = expandedPatientIds.has(group.patient._id);
                            const pendingCount = group.appointments.filter(a => a.status === 'Pending').length;
                            const confirmedCount = group.appointments.filter(a => a.status === 'Confirmed').length;
                            return (
                              <React.Fragment key={group.patient._id}>
                                {/* Summary row */}
                                <tr
                                  onClick={() => togglePatientExpand(group.patient._id)}
                                  style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f0f0' : '#fff' }}
                                >
                                  <td style={{ textAlign: 'center', fontSize: '18px' }}>
                                    {isExpanded ? '▼' : '▶'}
                                  </td>
                                  <td>
                                    <strong>{group.patient.fullName}</strong><br />
                                    <small className="text-muted">SDT: {group.patient.phoneNumber}</small><br />
                                    <small className="text-muted">CCCD: {group.patient.identityCard}</small>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    {group.appointments.length} ca
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {pendingCount > 0 && <span className="badge badge-warning">Chờ: {pendingCount}</span>}
                                    {confirmedCount > 0 && <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Duyệt: {confirmedCount}</span>}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <small style={{ color: '#666' }}>Bấm để xem chi tiết</small>
                                  </td>
                                </tr>

                                {/* Expanded detail rows */}
                                {isExpanded && group.appointments.map((appt) => {
                                  const quick = isQuickBooking(appt.patientId);
                                  return (
                                    <tr key={appt._id} style={{ backgroundColor: '#fafafa', borderLeft: '4px solid #0066cc' }}>
                                      <td></td>
                                      <td>
                                        <strong>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</strong><br />
                                        <small className="text-muted">{appt.requestedTime}</small>
                                      </td>
                                      <td>{appt.departmentId?.departmentName}</td>
                                      <td>{appt.doctorId?.fullName || 'Bác sĩ bất kỳ'}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                          <span className="badge" style={{ 
                                            backgroundColor: appt.status === 'Pending' ? '#ffc107' : 
                                                           appt.status === 'Confirmed' ? '#007bff' : 
                                                           appt.status === 'Completed' ? '#28a745' : '#dc3545'
                                          }}>
                                            {appt.status === 'Pending' ? 'Chờ duyệt' : 
                                             appt.status === 'Confirmed' ? 'Đã duyệt' : 
                                             appt.status === 'Completed' ? 'Đã khám' : 'Đã hủy'}
                                          </span>
                                          {appt.status === 'Pending' && (
                                            <>
                                              {quick ? (
                                                <button
                                                  className="btn btn-quick btn-xs"
                                                  onClick={() => handleOpenEditModal(appt)}
                                                >
                                                  📝 Điền &amp; Duyệt
                                                </button>
                                              ) : (
                                                <button
                                                  className="btn btn-primary btn-xs"
                                                  onClick={() => handleDirectConfirm(appt._id)}
                                                >
                                                  ⚡ Duyệt
                                                </button>
                                              )}
                                              <button
                                                className="btn btn-danger btn-xs"
                                                onClick={() => handleCancelAppointment(appt._id)}
                                              >
                                                Hủy
                                              </button>
                                            </>
                                          )}
                                          {appt.status === 'Confirmed' && (
                                            <button
                                              className="btn btn-warning btn-xs"
                                              onClick={() => handleCancelAppointment(appt._id)}
                                            >
                                              Yêu cầu hủy
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="booking-group">
                  <h3>Khách vãng lai ({guestAppointments.length})</h3>
                  {guestAppointments.length === 0 ? (
                    <div className="empty-state">
                      <p>Không có yêu cầu từ khách vãng lai trong danh sách hiện tại.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}></th>
                            <th>Bệnh nhân</th>
                            <th>Tổng yêu cầu</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupAppointmentsByPatient(guestAppointments).map((group) => {
                            const isExpanded = expandedPatientIds.has(group.patient._id);
                            const pendingCount = group.appointments.filter(a => a.status === 'Pending').length;
                            const confirmedCount = group.appointments.filter(a => a.status === 'Confirmed').length;
                            return (
                              <React.Fragment key={group.patient._id}>
                                {/* Summary row */}
                                <tr
                                  onClick={() => togglePatientExpand(group.patient._id)}
                                  style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f0f0f0' : '#fff' }}
                                >
                                  <td style={{ textAlign: 'center', fontSize: '18px' }}>
                                    {isExpanded ? '▼' : '▶'}
                                  </td>
                                  <td>
                                    <strong>{group.patient.fullName}</strong><br />
                                    <small className="text-muted">SDT: {group.patient.phoneNumber}</small><br />
                                    <small className="text-muted">CCCD: {group.patient.identityCard}</small>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    {group.appointments.length} ca
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {pendingCount > 0 && <span className="badge badge-warning">Chờ: {pendingCount}</span>}
                                    {confirmedCount > 0 && <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Duyệt: {confirmedCount}</span>}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <small style={{ color: '#666' }}>Bấm để xem chi tiết</small>
                                  </td>
                                </tr>

                                {/* Expanded detail rows */}
                                {isExpanded && group.appointments.map((appt) => {
                                  const quick = isQuickBooking(appt.patientId);
                                  return (
                                    <tr key={appt._id} style={{ backgroundColor: '#fafafa', borderLeft: '4px solid #0066cc' }}>
                                      <td></td>
                                      <td>
                                        <strong>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</strong><br />
                                        <small className="text-muted">{appt.requestedTime}</small>
                                      </td>
                                      <td>{appt.departmentId?.departmentName}</td>
                                      <td>{appt.doctorId?.fullName || 'Bác sĩ bất kỳ'}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                          <span className="badge" style={{ 
                                            backgroundColor: appt.status === 'Pending' ? '#ffc107' : 
                                                           appt.status === 'Confirmed' ? '#007bff' : 
                                                           appt.status === 'Completed' ? '#28a745' : '#dc3545'
                                          }}>
                                            {appt.status === 'Pending' ? 'Chờ duyệt' : 
                                             appt.status === 'Confirmed' ? 'Đã duyệt' : 
                                             appt.status === 'Completed' ? 'Đã khám' : 'Đã hủy'}
                                          </span>
                                          {appt.status === 'Pending' && (
                                            <>
                                              {quick ? (
                                                <button
                                                  className="btn btn-quick btn-xs"
                                                  onClick={() => handleOpenEditModal(appt)}
                                                >
                                                  📝 Điền &amp; Duyệt
                                                </button>
                                              ) : (
                                                <button
                                                  className="btn btn-primary btn-xs"
                                                  onClick={() => handleDirectConfirm(appt._id)}
                                                >
                                                  ⚡ Duyệt
                                                </button>
                                              )}
                                              <button
                                                className="btn btn-danger btn-xs"
                                                onClick={() => handleCancelAppointment(appt._id)}
                                              >
                                                Hủy
                                              </button>
                                            </>
                                          )}
                                          {appt.status === 'Confirmed' && (
                                            <button
                                              className="btn btn-warning btn-xs"
                                              onClick={() => handleCancelAppointment(appt._id)}
                                            >
                                              Yêu cầu hủy
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Complete Patient profile and confirm modal */}
      {editingPatient && (
        <div className="modal-backdrop">
          <div className="modal-content patient-profile-modal">
            <div className="modal-header">
              <h3>Điền thông tin hồ sơ & Duyệt khám</h3>
              <button className="close-btn" onClick={() => setEditingPatient(null)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateAndConfirm}>
              <div className="modal-body">
                <p className="modal-alert-info">
                  ⚠️ Bệnh nhân đặt lịch nhanh chưa có hồ sơ đầy đủ. Vui lòng hỏi thông tin và điền đầy đủ các thông tin bắt buộc trước khi cho phép xác nhận khám.
                </p>

                <div className="grid-form">
                  <div className="form-group">
                    <label>Họ tên đầy đủ *</label>
                    <input
                      type="text"
                      value={patientForm.fullName}
                      onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      value={patientForm.phoneNumber}
                      onChange={(e) => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày sinh *</label>
                    <input
                      type="date"
                      value={patientForm.dateOfBirth}
                      onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Giới tính *</label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                      required
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Số CCCD / CMND *</label>
                    <input
                      type="text"
                      value={patientForm.identityCard}
                      onChange={(e) => setPatientForm({ ...patientForm, identityCard: e.target.value })}
                      placeholder="Số căn cước công dân"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mã thẻ bảo hiểm (BHYT)</label>
                    <input
                      type="text"
                      value={patientForm.insuranceCode}
                      onChange={(e) => setPatientForm({ ...patientForm, insuranceCode: e.target.value })}
                      placeholder="Không bắt buộc"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Địa chỉ thường trú *</label>
                    <input
                      type="text"
                      value={patientForm.address}
                      onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                      placeholder="Số nhà, Tên đường, Quận/Huyện..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPatient(null)}>Đóng</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Đang xử lý...' : 'Cập nhật & Duyệt'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
