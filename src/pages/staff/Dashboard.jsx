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
  const [cancelingAppointment, setCancelingAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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
      await profilesAPI.updateUser(editingPatient._id, {
        fullName: patientForm.fullName,
        dateOfBirth: patientForm.dateOfBirth,
        gender: patientForm.gender,
        identityCard: patientForm.identityCard,
        phoneNumber: patientForm.phoneNumber,
        address: patientForm.address,
        insuranceCode: patientForm.insuranceCode,
        emergencyContact: patientForm.emergencyContact,
      });

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

  const openCancelModal = (appt) => {
    setCancelingAppointment(appt);
    setCancelReason(appt.cancelReason || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeCancelModal = () => {
    setCancelingAppointment(null);
    setCancelReason('');
  };

  const handleSubmitCancel = async (e) => {
    e.preventDefault();
    if (!cancelingAppointment) return;
    if (!cancelReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do hủy lịch.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.updateAppointment(cancelingAppointment._id, {
        status: 'Canceled',
        cancelReason: cancelReason.trim(),
      });
      setSuccessMessage('Yêu cầu hủy lịch đã được ghi nhận.');
      closeCancelModal();
      fetchData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể gửi yêu cầu hủy lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    const appt = appointments.find((item) => item._id === apptId);
    if (!appt) return;
    openCancelModal(appt);
  };

  // Helper to detect if a patient is a quick booking (missing details)
  const isQuickBooking = (patient) => {
    if (!patient) return true;
    const isDefaultDob = new Date(patient.dateOfBirth).getFullYear() <= 1905;
    const isDefaultCard = patient.identityCard?.startsWith('REG-') || patient.identityCard?.startsWith('ADM-');
    const isDefaultName = patient.fullName === 'Khách hàng' || patient.fullName === 'Guest';
    return isDefaultDob || isDefaultCard || isDefaultName || !patient.address || !patient.identityCard;
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

            {appointments.filter(a => filterStatus === 'All' || a.status === filterStatus).length === 0 ? (
              <div className="empty-state">
                <p>Không có yêu cầu đặt lịch nào phù hợp.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bệnh nhân</th>
                      <th>Ngày & Giờ yêu cầu</th>
                      <th>Chuyên khoa</th>
                      <th>Bác sĩ chọn</th>
                      <th>Triệu chứng</th>
                      <th>Hình thức đặt</th>
                      <th>Lý do hủy</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments
                      .filter(a => filterStatus === 'All' || a.status === filterStatus)
                      .map((appt) => {
                        const quick = isQuickBooking(appt.patientId);
                        return (
                          <tr key={appt._id}>
                            <td>
                              <strong>{appt.patientId?.fullName}</strong><br />
                              <small className="text-muted">SDT: {appt.patientId?.phoneNumber}</small><br />
                              <small className="text-muted">CCCD: {appt.patientId?.identityCard}</small>
                            </td>
                            <td>
                              <strong>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</strong><br />
                              <small className="text-muted">{appt.requestedTime}</small>
                            </td>
                            <td>{appt.departmentId?.departmentName}</td>
                            <td>{appt.doctorId?.fullName || 'Bác sĩ bất kỳ'}</td>
                            <td className="symptoms-td" title={appt.symptoms}>{appt.symptoms || 'Không có triệu chứng'}</td>
                            <td>
                              {quick ? (
                                <span className="badge badge-warning">Đặt nhanh (Thiếu thông tin)</span>
                              ) : (
                                <span className="badge badge-success">Đặt qua tài khoản</span>
                              )}
                            </td>
                            <td className="cancel-reason-cell" title={appt.cancelReason || ''}>
                              {appt.cancelReason ? appt.cancelReason : '-'}
                            </td>
                            <td className="btn-cell">
                              {appt.status === 'Pending' && (
                                <>
                                  {quick ? (
                                    <button
                                      className="btn btn-quick btn-xs"
                                      onClick={() => handleOpenEditModal(appt)}
                                    >
                                      📝 Điền TT & Duyệt
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-primary btn-xs"
                                      onClick={() => handleDirectConfirm(appt._id)}
                                    >
                                      ⚡ Duyệt trực tiếp
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-danger btn-xs"
                                    onClick={() => handleCancelAppointment(appt._id)}
                                  >
                                    Hủy yêu cầu
                                  </button>
                                </>
                              )}
                              {appt.status === 'Confirmed' && (
                                <>
                                  {renderStatus(appt.status)}
                                  <button
                                    className="btn btn-warning btn-xs"
                                    onClick={() => handleCancelAppointment(appt._id)}
                                  >
                                    Yêu cầu hủy
                                  </button>
                                </>
                              )}
                              {appt.status !== 'Pending' && appt.status !== 'Confirmed' && renderStatus(appt.status)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
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

                  <div className="form-group full-width">
                    <label>Người liên hệ khẩn cấp</label>
                    <input
                      type="text"
                      value={patientForm.emergencyContact}
                      onChange={(e) => setPatientForm({ ...patientForm, emergencyContact: e.target.value })}
                      placeholder="Tên - Số điện thoại người thân"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPatient(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu & Duyệt...' : '💾 Lưu thông tin & Xác nhận lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelingAppointment && (
        <div className="modal-backdrop">
          <div className="modal-content cancel-request-modal">
            <div className="modal-header">
              <h3>Yêu cầu hủy lịch khám</h3>
              <button className="close-btn" onClick={closeCancelModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmitCancel}>
              <div className="modal-body">
                <p className="modal-alert-info">
                  📝 Vui lòng nhập lý do hủy lịch để ghi nhận yêu cầu.
                </p>
                <div className="form-group full-width">
                  <label>Bệnh nhân</label>
                  <input type="text" value={cancelingAppointment.patientId?.fullName || ''} disabled />
                </div>
                <div className="form-group full-width">
                  <label>Ngày & Giờ</label>
                  <input
                    type="text"
                    value={`${new Date(cancelingAppointment.requestedDate).toLocaleDateString('vi-VN')} ${cancelingAppointment.requestedTime}`}
                    disabled
                  />
                </div>
                <div className="form-group full-width">
                  <label>Lý do hủy lịch *</label>
                  <textarea
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy lịch..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeCancelModal}>Đóng</button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Xác nhận hủy lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
