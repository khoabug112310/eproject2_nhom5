import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI, authAPI } from '../../services/api';
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const meRes = await authAPI.me();
        const me = meRes.data?.data;

        const patientsRes = await profilesAPI.getPatients();
        const patients = patientsRes.data?.data || [];
        const matched = patients.find(
          (p) => p.userId?._id === me.userId || p.phoneNumber === me.username || p.userId === me.userId,
        );
        if (mounted) setPatient(matched || null);

        const apptsRes = await schedulingAPI.getAppointments();
        if (mounted) setAppointments(apptsRes.data?.data || []);

        const invRes = await billingAPI.getInvoices();
        if (mounted) setInvoices(invRes.data?.data || []);

        if (matched) {
          const recRes = await clinicalAPI.getMedicalRecords({ patientId: matched._id });
          if (mounted) setRecords(recRes.data?.data || []);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError('Lỗi khi tải dữ liệu.');
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
    const onShowBilling = () => {
      setShowBilling(true);
    };
    window.addEventListener('showBilling', onShowBilling);
    return () => window.removeEventListener('showBilling', onShowBilling);
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
      setPaymentMessage('Không có hóa đơn chưa thanh toán.');
      return;
    }

    const result = await Swal.fire({
      title: 'Xác nhận thanh toán',
      text: 'Bạn có muốn thanh toán tất cả hóa đơn chưa thanh toán?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Thanh toán',
      cancelButtonText: 'Hủy'
    });
    if (!result.isConfirmed) return;

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await Promise.all(unpaidInvoices.map((inv) => billingAPI.payInvoice(inv._id)));
      await refreshInvoices();
      setPaymentMessage('Thanh toán thành công tất cả hóa đơn chưa thanh toán.');
    } catch (err) {
      console.error(err);
      setPaymentMessage('Không thể thanh toán. Vui lòng thử lại sau.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayInvoice = async (invoice) => {
    if (invoice.status === 'Paid') {
      setPaymentMessage('Hóa đơn này đã được thanh toán.');
      return;
    }
    const result = await Swal.fire({
      title: 'Xác nhận thanh toán',
      text: `Bạn có chắc muốn thanh toán hóa đơn ${translateInvoiceType(invoice.invoiceType)} trị giá ${formatCurrency(invoice.totalAmount || 0)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Thanh toán',
      cancelButtonText: 'Hủy'
    });
    if (!result.isConfirmed) return;

    setPaymentProcessing(true);
    setPaymentMessage('');
    try {
      await billingAPI.payInvoice(invoice._id);
      await refreshInvoices();
      setPaymentMessage(`Thanh toán thành công hóa đơn ${formatCurrency(invoice.totalAmount || 0)}.`);
    } catch (err) {
      console.error(err);
      setPaymentMessage('Không thể thanh toán hóa đơn. Vui lòng thử lại sau.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
    } catch (e) {
      return amount || 0;
    }
  };

  const translateInvoiceType = (type) => {
    if (!type) return 'Hoá đơn';
    if (type === 'Consultation') return 'Hoá đơn Khám bệnh';
    if (type === 'Pharmacy') return 'Hoá đơn Nhà thuốc';
    return type;
  };

  const translateInvoiceStatus = (status) => {
    if (!status) return '';
    if (status === 'Unpaid') return 'Chưa thanh toán';
    if (status === 'Paid') return 'Đã thanh toán';
    if (status === 'Refunded') return 'Đã hoàn tiền';
    return status;
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận hủy lịch',
      text: 'Bạn có chắc muốn hủy lịch này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Hủy lịch',
      cancelButtonText: 'Đóng'
    });
    if (!result.isConfirmed) return;
    try {
      await schedulingAPI.updateAppointment(id, { status: 'Canceled' });
      setAppointments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      setError('Không thể hủy lịch.');
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
          <div>
            <p>Đang tải dữ liệu...</p>
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

      <div className="dashboard-layout">
        {/* Navigation Sidebar/Tabs */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">
              {patient?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h4>{patient?.fullName || 'Khách hàng'}</h4>
            <p className="p-card-number">{patient?.identityCard || 'Chưa hoàn tất hồ sơ'}</p>
          </div>
          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('appointments')}
              className={activeTab === 'appointments' ? 'active' : ''}
            >
              📅 Lịch hẹn của tôi
            </button>
            <button
              onClick={() => setActiveTab('book')}
              className={activeTab === 'book' ? 'active' : ''}
            >
              ➕ Đặt lịch khám mới
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={activeTab === 'records' ? 'active' : ''}
            >
              📑 Hồ sơ bệnh án
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={activeTab === 'billing' ? 'active' : ''}
            >
              💳 Hóa đơn & Thanh toán
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={activeTab === 'profile' ? 'active' : ''}
            >
              👤 Thông tin cá nhân
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          {/* Tab: Appointments */}
          {activeTab === 'appointments' && (
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Lịch hẹn khám bệnh</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('book')}>
                  Đặt lịch mới
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn chưa có lịch hẹn khám nào.</p>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('book')}>
                    Đặt lịch khám ngay
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ngày khám</th>
                        <th>Khung giờ</th>
                        <th>Khoa chuyên ngành</th>
                        <th>Bác sĩ</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => (
                        <tr key={appt._id}>
                          <td>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</td>
                          <td>{appt.requestedTime}</td>
                          <td>{appt.departmentId?.departmentName || 'Chung'}</td>
                          <td>{appt.doctorId?.fullName || 'Bác sĩ bất kỳ'}</td>
                          <td>{renderStatus(appt.status)}</td>
                          <td>
                            {appt.status === 'Pending' && (
                              <button
                                className="btn btn-danger btn-xs"
                                onClick={() => handleCancelAppointment(appt._id)}
                              >
                                Hủy lịch
                              </button>
                            )}
                            {appt.status === 'Completed' && (
                              <span className="text-muted">Đã khám xong</span>
                            )}
                            {appt.status === 'Canceled' && (
                              <span className="text-muted">-</span>
                            )}
                            {appt.status === 'Confirmed' && (
                              <span className="text-muted">Chờ gọi số</span>
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
          {/* Tab: Book Appointment */}
          {activeTab === 'book' && (
            <div className="dashboard-card">
              <h2>Đăng ký đặt lịch khám</h2>
              <p className="subtitle">Lựa chọn chuyên khoa, bác sĩ và thời gian khám phù hợp.</p>

              {appointments.some(appt => appt.status === 'Pending') ? (
                (() => {
                  const activeAppointment = appointments.find(
                    (appt) => appt.status === 'Pending'
                  );
                  return (
                    <div className="active-appointment-warning" style={{
                      padding: '24px',
                      borderRadius: 'var(--radius-card)',
                      backgroundColor: 'var(--color-primary-light)',
                      border: '1px solid rgba(0, 102, 204, 0.1)',
                      textAlign: 'center',
                      marginTop: '20px'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                      <h3 style={{ marginBottom: '12px', color: 'var(--color-primary-dark)' }}>
                        Bạn đang có một lịch hẹn chờ xác nhận
                      </h3>
                      <p style={{ color: 'var(--color-text-body)', marginBottom: '20px', fontSize: '14px' }}>
                        Để đảm bảo chất lượng dịch vụ, mỗi bệnh nhân chỉ được đăng ký tối đa một lịch hẹn khám có trạng thái <strong>Chờ xác nhận</strong> tại một thời điểm.
                      </p>
                      
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderRadius: '12px',
                        padding: '16px',
                        maxWidth: '500px',
                        margin: '0 auto 24px auto',
                        textAlign: 'left',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid var(--color-border)'
                      }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '15px', color: 'var(--color-text-dark)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                          Chi tiết lịch hẹn hiện tại:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '13px' }}>
                          <strong>Ngày khám:</strong>
                          <span>{new Date(activeAppointment.requestedDate).toLocaleDateString('vi-VN')}</span>
                          
                          <strong>Khung giờ:</strong>
                          <span>{activeAppointment.requestedTime}</span>
                          
                          <strong>Chuyên khoa:</strong>
                          <span>{activeAppointment.departmentId?.departmentName || 'Chung'}</span>
                          
                          <strong>Bác sĩ:</strong>
                          <span>{activeAppointment.doctorId?.fullName || 'Bác sĩ bất kỳ'}</span>
                          
                          <strong>Trạng thái:</strong>
                          <span>
                            <span className="badge badge-warning">
                              Chờ xác nhận
                            </span>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => setActiveTab('appointments')}>
                          Xem danh sách lịch hẹn
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancelAppointment(activeAppointment._id)}
                        >
                          Hủy lịch hẹn này
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <form onSubmit={handleBookingSubmit} className="grid-form">
                  <div className="form-group full-width">
                    <label>Chuyên khoa khám *</label>
                    <select
                      value={bookingForm.departmentId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        // Tìm đối tượng chuyên khoa được chọn để lấy tên
                        const selectedDepObj = departments.find(d => d._id === selectedId);
                        const selectedDepName = selectedDepObj ? (selectedDepObj.departmentName || selectedDepObj.name) : '';

                        setBookingForm({
                          ...bookingForm,
                          departmentId: selectedId,
                          departmentName: selectedDepName, // Lưu thêm tên nếu cần dùng ở chỗ khác
                          doctorId: '' // Reset bác sĩ khi đổi khoa
                        });
                      }}
                      required
                    >
                      <option value="">-- Chọn chuyên khoa --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Bác sĩ (Không bắt buộc)</label>
                    <select
                      value={bookingForm.doctorId}
                      onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                      disabled={!bookingForm.departmentId}
                    >
                      <option value="">-- Chọn bác sĩ (Bất kỳ) --</option>
                      {doctors
                        .filter((doc) => {
                          // 1. Nếu người dùng chưa chọn khoa, hiển thị tất cả bác sĩ
                          if (!bookingForm.departmentId) return true;

                          // 2. Lấy tên chuyên khoa đang được chọn từ danh sách departments
                          const currentDepObj = departments.find(d => d._id === bookingForm.departmentId);
                          const currentDepName = currentDepObj ? (currentDepObj.departmentName || currentDepObj.name) : '';

                          // 3. Lấy tên chuyên khoa từ đối tượng bác sĩ (tùy thuộc backend trả về chuỗi text hay object)
                          const docDepName = doc.department?.departmentName || doc.department?.name || doc.department;

                          // 4. So sánh khớp tên chuyên khoa giống QuickBooking
                          return docDepName === currentDepName;
                        })
                        .map((doc) => (
                          <option key={doc._id || doc.id} value={doc._id || doc.id}>
                            {doc.fullName} ({doc.specialization || 'Bác sĩ'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Ngày khám bệnh *</label>
                    <input
                      type="date"
                      min={getMinBookingDate()}
                      value={bookingForm.requestedDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, requestedDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Khung giờ khám *</label>
                    <select
                      value={bookingForm.requestedTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, requestedTime: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn khung giờ --</option>
                      {schedules.length > 0 ? (
                        schedules
                          .map((s) => {
                            const displayStart = s.startTime < '09:00' ? '09:00' : s.startTime;
                            const displayEnd = s.endTime > '17:00' ? '17:00' : s.endTime;
                            if (displayStart >= displayEnd) return null;
                            return (
                              <option key={s._id} value={`${displayStart} - ${displayEnd}`}>
                                {displayStart} - {displayEnd} (Còn trống: {s.maxPatients - s.currentBooked} chỗ)
                              </option>
                            );
                          })
                          .filter(Boolean)
                      ) : (
                        <>
                          <option value="09:00 - 10:00">09:00 - 10:00 (Sáng)</option>
                          <option value="10:00 - 11:00">10:00 - 11:00 (Sáng)</option>
                          <option value="14:00 - 15:00">14:00 - 15:00 (Chiều)</option>
                          <option value="15:00 - 16:00">15:00 - 16:00 (Chiều)</option>
                          <option value="16:00 - 17:00">16:00 - 17:00 (Chiều)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Triệu chứng lâm sàng / Lý do khám</label>
                    <textarea
                      rows="4"
                      placeholder="Mô tả các triệu chứng của bạn để bác sĩ nắm bắt thông tin nhanh chóng..."
                      value={bookingForm.symptoms}
                      onChange={(e) => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Đang gửi...' : 'Gửi đăng ký lịch hẹn'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tab: Medical Records */}
          {activeTab === 'records' && (
            <div className="dashboard-card">
              <h2>Lịch sử khám bệnh & Bệnh án</h2>
              <p className="subtitle">Xem chẩn đoán chi tiết và hướng dẫn điều trị của bác sĩ.</p>

              {records.length === 0 ? (
                <div className="empty-state">
                  <p>Hệ thống chưa ghi nhận hồ sơ bệnh án nào của bạn.</p>
                </div>
              ) : (
                <div className="records-grid">
                  {records.map((rec) => (
                    <div className="record-item" key={rec._id}>
                      <div className="record-meta">
                        <span className="record-date">📅 {new Date(rec.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="record-doctor">🩺 BS. {rec.doctorId?.fullName}</span>
                      </div>
                      <div className="record-content">
                        <h4 className="diagnosis-title">Chẩn đoán: {rec.diagnosis}</h4>
                        {rec.clinicalNotes && <p className="record-notes"><strong>Lời dặn:</strong> {rec.clinicalNotes}</p>}
                        <div className="record-vitals">
                          {rec.bloodPressure && <span>💓 Huyết áp: {rec.bloodPressure} mmHg</span>}
                          {rec.heartRate && <span>❤️ Nhịp tim: {rec.heartRate} lần/phút</span>}
                          {rec.temperature && <span>🌡️ Nhiệt độ: {rec.temperature}°C</span>}
                          {rec.weight && <span>⚖️ Cân nặng: {rec.weight} kg</span>}
                        </div>
                      </div>
                      <div className="record-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          setSelectedRecord(rec);
                          // Fetch prescriptions for this medical record
                          clinicalAPI.getPrescriptions(rec._id)
                            .then((res) => {
                              setSelectedRecord(prev => ({ ...prev, prescriptions: res.data.data }));
                            })
                            .catch(console.error);
                        }}>
                          Xem đơn thuốc chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Invoices & Payments */}
          {activeTab === 'billing' && (
            <div className="dashboard-card">
              <h2>Hóa đơn & Viện phí</h2>
              <p className="subtitle">Quản lý và thực hiện thanh toán các hóa đơn khám bệnh và tiền thuốc.</p>

              {invoices.length === 0 ? (
                <div className="empty-state">
                  <p>Không tìm thấy hóa đơn nào.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Mã hóa đơn</th>
                        <th>Loại hóa đơn</th>
                        <th>Tổng tiền</th>
                        <th>Ngày phát hành</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td className="monospace font-bold">{inv._id.substring(18).toUpperCase()}</td>
                          <td>
                            {inv.invoiceType === 'Consultation' ? 'Phí khám bệnh (Lâm sàng)' : 'Hóa đơn nhà thuốc'}
                          </td>
                          <td className="font-bold text-primary">{formatVND(inv.totalAmount)}</td>
                          <td>{new Date(inv.issuedAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                              {inv.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </td>
                          <td className="btn-cell">
                            <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(inv)}>
                              Xem biên lai
                            </button>
                            {inv.status === 'Unpaid' && (
                              <button className="btn btn-primary btn-xs" onClick={() => handlePayInvoice(inv)}>
                                Thanh toán
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

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <div className="dashboard-card">
              <h2>{patient ? 'Hồ sơ sức khỏe cá nhân' : 'Khởi tạo thông tin bệnh nhân'}</h2>
              <p className="subtitle">
                {patient
                  ? 'Vui lòng điền chính xác thông tin để làm hồ sơ bệnh án điện tử (EHR).'
                  : 'Hãy nhập thông tin ban đầu của bạn để hệ thống tạo mã bệnh nhân.'}
              </p>

              <form onSubmit={handleUpdateProfile} className="grid-form">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại liên lạc *</label>
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ngày sinh *</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính *</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
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
                    value={profileForm.identityCard}
                    onChange={(e) => setProfileForm({ ...profileForm, identityCard: e.target.value })}
                    placeholder="Mã số 12 số của định danh công dân"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mã thẻ bảo hiểm y tế (BHYT)</label>
                  <input
                    type="text"
                    value={profileForm.insuranceCode}
                    onChange={(e) => setProfileForm({ ...profileForm, insuranceCode: e.target.value })}
                    placeholder="VD: GD479102910"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Liên hệ khẩn cấp (Tên - SĐT người thân)</label>
                  <input
                    type="text"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    placeholder="VD: Bố - Nguyễn Văn B (0987654321)"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Invoice Detail / Receipt Modal */}
      {selectedInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content invoice-modal">
            <div className="modal-header">
              <h3>Chi tiết biên lai thanh toán</h3>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body print-section" id="print-area">
              <div className="receipt-brand">
                <h2>PHÒNG KHÁM ĐA KHOA HỢP SƠN TÀI</h2>
                <p>123 Đường Hợp Sơn, Quận Hai Bà Trưng, Hà Nội | Hotline: 1900 6868</p>
              </div>
              <hr />
              <div className="receipt-meta">
                <div>
                  <p><strong>Bệnh nhân:</strong> {selectedInvoice.patientId?.fullName}</p>
                  <p><strong>SĐT:</strong> {selectedInvoice.patientId?.phoneNumber}</p>
                  <p><strong>CCCD:</strong> {selectedInvoice.patientId?.identityCard}</p>
                </div>
                <div className="text-right">
                  <p><strong>Hóa đơn số:</strong> <span className="monospace uppercase">{selectedInvoice._id.substring(14)}</span></p>
                  <p><strong>Ngày lập:</strong> {new Date(selectedInvoice.issuedAt).toLocaleDateString('vi-VN')}</p>
                  {selectedInvoice.paidAt && <p><strong>Ngày thanh toán:</strong> {new Date(selectedInvoice.paidAt).toLocaleDateString('vi-VN')}</p>}
                </div>
              </div>

              <div className="receipt-items-container" style={{ marginTop: 20 }}>
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Nội dung thanh toán</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Số lượng</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.invoiceType === 'Consultation' ? (
                      <tr>
                        <td>
                          Khám lâm sàng - Chuyên khoa {selectedInvoice.appointmentId?.departmentId?.departmentName || 'Chung'}<br />
                          <small className="text-muted">Bác sĩ khám: {selectedInvoice.appointmentId?.doctorId?.fullName || 'Bất kỳ'}</small>
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
                            <small className="text-muted">{det.medicineId?.dosageForm} | HD: {det.medicineId?.instruction}</small>
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
                  <span>Tổng tiền thanh toán:</span>
                  <strong className="text-primary" style={{ fontSize: 18 }}>{formatVND(selectedInvoice.totalAmount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Trạng thái:</span>
                  <span className={`badge ${selectedInvoice.status === 'Paid' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedInvoice.status === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                  </span>
                </div>
                {selectedInvoice.processedBy && (
                  <div className="summary-row">
                    <span>Nhân viên thu ngân:</span>
                    <span>{selectedInvoice.processedBy?.fullName || 'Hệ thống'}</span>
                  </div>
                )}
              </div>

              <div className="receipt-footer">
                <p>Cảm ơn quý khách đã tin tưởng dịch vụ của phòng khám!</p>
                <p className="small text-muted">Hóa đơn điện tử EHR có giá trị như hóa đơn đỏ.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ In hóa đơn</button>
              <button className="btn btn-primary" onClick={() => setSelectedInvoice(null)}>Đóng</button>
            </div>
>>>>>>> origin/TrangChu
          </div>
        </div>

        <div className="patient-dashboard__grid">
          <div className="patient-dashboard__main">
            <div className="patient-dashboard__panels">
              <section className="card patient-card">
                <div className="card-title-bar">
                  <h4>Lịch hẹn sắp tới</h4>
                </div>
                {appointments.length === 0 ? (
                  <div className="patient-empty">Bạn chưa có lịch hẹn nào.</div>
                ) : (
                  <ul className="appointment-list">
                    {appointments.slice(0, 5).map((a) => (
                      <li key={a._id} className="appointment-item">
                        <div>
                          <strong>{new Date(a.requestedDate).toLocaleDateString('vi-VN')}</strong>
                          <div>{a.requestedTime} · {a.departmentId?.departmentName || 'Khoa chung'}</div>
                        </div>
                        <div className="appointment-item__actions">
                          <button
                            className="btn btn-secondary btn-xs"
                            type="button"
                            onClick={() => handleShowAppointmentDetails(a)}
                          >
                            Chi tiết
                          </button>
                          {a.status === 'Pending' && (
                            <button
                              className="btn btn-ghost btn-xs"
                              type="button"
                              onClick={() => handleCancel(a._id)}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="card patient-card">
                <div className="card-title-bar">
                  <h4>Tổng quan thanh toán</h4>
                </div>
                <div className="patient-summary">
                  <p>Tổng hóa đơn: <strong>{invoices.length}</strong></p>
                  <p>Chưa thanh toán: <strong>{invoices.filter((i) => i.status !== 'Paid').length}</strong></p>
                  <p>Tổng thanh toán: <strong>{formatCurrency(invoices.reduce((s, it) => s + (it.totalAmount || 0), 0))}</strong></p>
                  <div className="patient-summary__amounts">
                    <p>Khám bệnh: <strong>{formatCurrency(
                      invoices.filter(i => i.invoiceType === 'Consultation').reduce((s, it) => s + (it.totalAmount || 0), 0)
                    )}</strong></p>
                    <p>Tiền thuốc: <strong>{formatCurrency(
                      invoices.filter(i => i.invoiceType === 'Pharmacy').reduce((s, it) => s + (it.totalAmount || 0), 0)
                    )}</strong></p>
                  </div>
                  {paymentMessage && (
                    <div className={`booking-banner ${paymentMessage.includes('thành công') ? 'success' : 'error'}`}>
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
                      {paymentProcessing ? 'Đang thanh toán...' : 'Thanh toán toàn bộ'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setShowBilling(true)}
                    >
                      Thanh toán từng phần
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section id="book" className="patient-booking card quick-booking">
              <BookingForm onBooked={refreshAppointments} />
            </section>

            <section id="records" className="card patient-card">
              <div className="card-title-bar">
                <h4>Hồ sơ bệnh án gần đây</h4>
              </div>
              {records.length === 0 ? (
                <div className="patient-empty">Chưa có hồ sơ bệnh án nào.</div>
              ) : (
                <div className="record-list">
                  {records.slice(0, 3).map((r) => {
                    const isExpanded = expandedRecords.includes(r._id);
                    return (
                      <article key={r._id} className="record-item record-item--vitals">
                        <div className="record-item__header">
                          <div>
                            <strong>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</strong>
                            <p>{r.appointmentId?.departmentId?.departmentName || 'Khoa khám chung'}</p>
                            <span>BS. <strong>{r.doctorId?.fullName || 'Chưa có bác sĩ'}</strong></span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleToggleRecord(r._id)}
                          >
                            {isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          </button>
                        </div>

                        <div className={`record-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                          <div className="record-item__vitals">
                            <div><strong>Chiều cao:</strong> {r.height ? `${r.height} cm` : '---'}</div>
                            <div><strong>Cân nặng:</strong> {r.weight ? `${r.weight} kg` : '---'}</div>
                            <div><strong>Huyết áp:</strong> {r.bloodPressure || '---'}</div>
                            <div><strong>Nhịp tim:</strong> {r.heartRate ? `${r.heartRate} bpm` : '---'}</div>
                            <div><strong>Nhiệt độ:</strong> {r.temperature ? `${r.temperature} °C` : '---'}</div>
                          </div>
                          <div className="record-item__summary">
                            <p><strong>Chẩn đoán:</strong> {r.diagnosis || '---'}</p>
                            {r.clinicalNotes && <p><strong>Ghi chú:</strong> {r.clinicalNotes}</p>}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
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
                    <h4>Chi tiết lịch hẹn</h4>
                    <p className="muted">{selectedAppointment.departmentId?.departmentName || 'Khoa khám chung'}</p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={handleCloseAppointmentModal}>Đóng</button>
                </div>

                <div className="modal-body">
                  <div className="appointment-detail-grid">
                    <div>
                      <p><strong>Ngày khám:</strong> {new Date(selectedAppointment.requestedDate).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Giờ khám:</strong> {selectedAppointment.requestedTime || 'Chưa có giờ'}</p>
                      <p><strong>Trạng thái:</strong> {selectedAppointment.status || 'Chưa cập nhật'}</p>
                      <p><strong>Phòng:</strong> {selectedAppointment.scheduleId?.room || 'Đang cập nhật'}</p>
                    </div>
                    <div>
                      <p><strong>Bác sĩ:</strong> BS. {selectedAppointment.doctorId?.fullName || 'Chưa có thông tin'}</p>
                      <p><strong>Chuyên khoa:</strong> {selectedAppointment.departmentId?.departmentName || 'Chung'}</p>
                      <p><strong>Gói khám:</strong> {selectedAppointment.scheduleId?.serviceName || 'Khám lâm sàng'}</p>
                      <p><strong>Phòng khám:</strong> {selectedAppointment.departmentId?.departmentName || 'Chưa rõ'}</p>
                    </div>
                  </div>

                  <div className="appointment-detail-extra">
                    <p><strong>Triệu chứng / Mô tả:</strong></p>
                    <p>{selectedAppointment.symptoms || 'Không có mô tả'}</p>
                  </div>

                  {selectedAppointment.scheduleId?.startTime || selectedAppointment.scheduleId?.endTime ? (
                    <div className="appointment-detail-time">
                      <p><strong>Thời gian làm việc:</strong></p>
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
                    <h4>Chi tiết hóa đơn</h4>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowBilling(false)}>Đóng</button>
                  </div>

                  <div className="modal-body">
                    {invoices.length === 0 ? (
                      <div className="patient-empty">Bạn chưa có hóa đơn nào.</div>
                    ) : (
                      <div className="invoice-list">
                        {invoices.map((inv) => {
                          const isExpanded = expandedInvoices.includes(inv._id);
                            return (
                            <article key={inv._id} className="invoice-item">
                              <div className="invoice-item__header">
                                <div>
                                  <strong>{translateInvoiceType(inv.invoiceType)}</strong>
                                  <div className="muted">{new Date(inv.issuedAt || inv.createdAt).toLocaleString('vi-VN')}</div>
                                </div>
                                <div>
                                  <div className="muted">Trạng thái: {translateInvoiceStatus(inv.status)}</div>
                                  <div style={{ textAlign: 'right' }}><strong>{formatCurrency(inv.totalAmount || 0)}</strong></div>
                                  <div className="invoice-item__actions">
                                    {inv.status !== 'Paid' && (
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-xs"
                                        disabled={paymentProcessing}
                                        onClick={() => handlePayInvoice(inv)}
                                      >
                                        Thanh toán
                                      </button>
                                    )}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleToggleInvoice(inv._id)}>
                                      {isExpanded ? 'Ẩn' : 'Xem chi tiết'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className={`invoice-item__details ${isExpanded ? 'is-expanded' : ''}`}>
                                {inv.invoiceType === 'Pharmacy' && inv.details && inv.details.length > 0 ? (
                                  <div className="invoice-lines">
                                    {inv.details.map((d) => (
                                      <div key={d._id} className="invoice-line">
                                        <div>{d.medicineId?.name || 'Thuốc'}</div>
                                        <div className="muted">x{d.quantity}</div>
                                        <div>{formatCurrency((d.unitPrice || 0) * (d.quantity || 1))}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="invoice-meta muted">{inv.appointmentId ? `Khoa: ${inv.appointmentId.departmentId?.departmentName || ''}` : ''}</div>
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
            <PatientSidebar patient={patient} invoices={invoices} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

