import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';

export default function PatientDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('appointments');
  const [currentUser, setCurrentUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    departmentId: '',
    doctorId: '',
    requestedDate: '',
    requestedTime: '',
    symptoms: '',
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    phoneNumber: '',
    address: '',
    insuranceCode: '',
    emergencyContact: '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    const allowedTabs = ['appointments', 'book', 'records', 'billing', 'profile'];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // 1. Lấy thông tin tài khoản đang đăng nhập
      const meRes = await authAPI.me();
      const me = meRes.data.data;
      setCurrentUser(me);

      // 2. Gọi endpoint chuyên biệt của Patient để kiểm tra hồ sơ cá nhân
      // Giả định profilesAPI đã map: 
      // getOwnProfile() -> GET /api/profiles/patient/me
      const profileRes = await profilesAPI.getOwnProfile(); 
      const matchedPatient = profileRes.data.data; 

      if (matchedPatient) {
        // TRƯỜNG HỢP: ĐÃ CÓ HỒ SƠ BỆNH NHÂN
        setPatient(matchedPatient);
        
        // Điền dữ liệu cũ vào form để sẵn sàng cập nhật (Update Mode)
        setProfileForm({
          fullName: matchedPatient.fullName || '',
          dateOfBirth: matchedPatient.dateOfBirth ? new Date(matchedPatient.dateOfBirth).toISOString().split('T')[0] : '',
          gender: matchedPatient.gender || 'Khác',
          identityCard: matchedPatient.identityCard || '',
          phoneNumber: matchedPatient.phoneNumber || '',
          address: matchedPatient.address || '',
          insuranceCode: matchedPatient.insuranceCode || '',
          emergencyContact: matchedPatient.emergencyContact || '',
        });

        // Tải các dữ liệu liên quan khác của bệnh nhân này
        const apptsRes = await schedulingAPI.getAppointments();
        setAppointments(apptsRes.data.data);

        const invoicesRes = await billingAPI.getInvoices();
        setInvoices(invoicesRes.data.data);

        const recordsRes = await clinicalAPI.getMedicalRecords({ patientId: matchedPatient._id });
        setRecords(recordsRes.data.data);
      } else {
        // TRƯỜNG HỢP: TÀI KHOẢN RỖNG (CHƯA CÓ HỒ SƠ BỆNH NHÂN)
        setPatient(null); 
        setActiveTab('profile'); // Khóa hoặc chuyển hướng bắt buộc sang tab cập nhật thông tin
        setErrorMessage('Tài khoản của bạn chưa hoàn tất hồ sơ y tế bệnh nhân. Vui lòng điền thông tin dưới đây để kích hoạt hệ thống.');
        
        // Điền sẵn số điện thoại đăng nhập làm mặc định cho form tạo mới
        setProfileForm((prev) => ({
          ...prev,
          phoneNumber: me.phone || me.username || '',
        }));
      }

      // Load danh sách phòng ban và bác sĩ cho khung đặt lịch
      const deptsRes = await schedulingAPI.getDepartments();
      setDepartments(deptsRes.data.data);

      const docsRes = await clinicalAPI.getDoctors();
      setDoctors(docsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi khi tải dữ liệu đồng bộ hệ thống y tế. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

const handleProfileFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      if (!patient) {
        // CHẾ ĐỘ 1: KHỞI TẠO MỚI ( profilesAPI.createOwnProfile maps tới POST /api/profiles/patient/me )
        await profilesAPI.createOwnProfile({
          fullName: profileForm.fullName,
          dateOfBirth: profileForm.dateOfBirth,
          gender: profileForm.gender,
          identityCard: profileForm.identityCard,
          phoneNumber: profileForm.phoneNumber,
          address: profileForm.address,
          insuranceCode: profileForm.insuranceCode,
          emergencyContact: profileForm.emergencyContact,
        });
        setSuccessMessage('Khởi tạo hồ sơ bệnh nhân điện tử (EHR) thành công! Các chức năng đặt lịch đã được mở.');
      } else {
        // CHẾ ĐỘ 2: CẬP NHẬT ( profilesAPI.updateOwnProfile maps tới PUT /api/profiles/patient/me )
        await profilesAPI.updateOwnProfile({
          fullName: profileForm.fullName,
          dateOfBirth: profileForm.dateOfBirth,
          gender: profileForm.gender,
          identityCard: profileForm.identityCard,
          phoneNumber: profileForm.phoneNumber,
          address: profileForm.address,
          insuranceCode: profileForm.insuranceCode,
          emergencyContact: profileForm.emergencyContact,
        });
        setSuccessMessage('Cập nhật hồ sơ sức khỏe thành công!');
      }
      
      // Đồng bộ, reload lại toàn bộ state và chuyển tab về xem lịch hẹn
      await fetchInitialData();
      setActiveTab('appointments');
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.response?.data?.message || 'Không thể xử lý thông tin hồ sơ bệnh nhân.');
    } finally {
      setSubmitting(false);
    }
  };

  // Watch doctor change in booking form to load doctor's schedules
  useEffect(() => {
    if (bookingForm.doctorId) {
      schedulingAPI.getSchedules(bookingForm.doctorId)
        .then((res) => {
          setSchedules(res.data.data);
        })
        .catch(console.error);
    } else {
      setSchedules([]);
    }
  }, [bookingForm.doctorId]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!patient) {
      setErrorMessage('Bạn phải hoàn tất hồ sơ bệnh nhân trước khi đặt lịch.');
      setActiveTab('profile');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await schedulingAPI.bookAppointment({
        patientId: patient._id,
        departmentId: bookingForm.departmentId,
        doctorId: bookingForm.doctorId || undefined,
        requestedDate: bookingForm.requestedDate,
        requestedTime: bookingForm.requestedTime,
        symptoms: bookingForm.symptoms,
      });

      setSuccessMessage('Đặt lịch hẹn thành công! Lịch hẹn đang chờ CSKH xác nhận.');
      setBookingForm({
        departmentId: '',
        doctorId: '',
        requestedDate: '',
        requestedTime: '',
        symptoms: '',
      });
      fetchInitialData();
      setActiveTab('appointments');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Đã xảy ra lỗi khi đặt lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await schedulingAPI.updateAppointment(apptId, { status: 'Canceled' });
      setSuccessMessage('Đã hủy lịch hẹn thành công.');
      fetchInitialData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể hủy lịch hẹn.');
    }
  };

  // Mock Payment Flow
  const handlePayInvoice = async (invoice) => {
    setPaymentInvoice(invoice);
    setPaymentMethod('bank');
  };

  const executePayment = async () => {
    if (!paymentInvoice) return;
    setPaymentProcessing(true);
    try {
      // Simulating payment gateway response time
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await billingAPI.payInvoice(paymentInvoice._id);
      
      setSuccessMessage('Thanh toán hóa đơn thành công!');
      setPaymentInvoice(null);
      fetchInitialData();
    } catch (err) {
      setErrorMessage('Lỗi xử lý thanh toán. Vui lòng liên hệ hỗ trợ.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Render Status Badge
  const renderStatus = (status) => {
    let cls = '';
    let label = status;
    if (status === 'Pending') { cls = 'badge-warning'; label = 'Chờ CSKH xác nhận'; }
    else if (status === 'Confirmed') { cls = 'badge-primary'; label = 'Đã xác nhận (Do bác sĩ chỉ định)'; }
    else if (status === 'Completed') { cls = 'badge-success'; label = 'Hoàn thành'; }
    else if (status === 'Canceled') { cls = 'badge-danger'; label = 'Đã hủy'; }
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const getConsultationInvoice = (appt) => {
    return invoices.find((inv) => inv.appointmentId?._id === appt._id && inv.invoiceType === 'Consultation');
  };

  const getPaymentStatus = (appt) => {
    const invoice = getConsultationInvoice(appt);
    if (invoice) {
      if (invoice.status === 'Paid') return { label: 'Đã thanh toán', cls: 'badge-success' };
      return { label: 'Chờ thanh toán', cls: 'badge-warning' };
    }
    if (appt.status === 'Confirmed') {
      return { label: 'Thanh toán sau tại phòng khám', cls: 'badge-secondary' };
    }
    return { label: 'Chờ thanh toán', cls: 'badge-secondary' };
  };

  const isNearAppointment = (dateString) => {
    try {
      const now = new Date();
      const target = new Date(dateString);
      target.setHours(0, 0, 0, 0);
      const msPerDay = 1000 * 60 * 60 * 24;
      const diff = Math.ceil((target - now) / msPerDay);
      return diff >= 0 && diff <= 3;
    } catch (err) {
      return false;
    }
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const isProfileComplete = Boolean(patient);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang đồng bộ dữ liệu EHR...</p>
      </div>
    );
  }

  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role="patient" />

      <div className="dashboard-layout">
        {/* Navigation Sidebar/Tabs */}
        <aside className="dashboard-sidebar">
          <div className="patient-quick-info">
            <div className="p-avatar">
              {patient?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h4>{patient?.fullName || 'Khách hàng'}</h4>
            <div className="p-card-details">
              <p><strong>CCCD:</strong> {patient?.identityCard || 'Chưa có'}</p>
              <p><strong>BHYT:</strong> {patient?.insuranceCode || 'Chưa có'}</p>
            </div>
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
              disabled={!isProfileComplete}
              title={!isProfileComplete ? 'Vui lòng hoàn tất hồ sơ trước khi đặt lịch' : undefined}
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
            <div className="dashboard-card card">
              <div className="card-title-bar">
                <h3>Lịch hẹn khám bệnh</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-quick btn-sm" onClick={() => setActiveTab('book')}>➕ Đặt lịch mới</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => fetchInitialData()}>⟳ Đồng bộ</button>
                </div>
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
                  <table className="custom-table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th>Ngày khám</th>
                        <th>Khung giờ</th>
                        <th>Khoa chuyên ngành</th>
                        <th>Bác sĩ</th>
                        <th>Trạng thái</th>
                        <th>Thanh toán</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => {
                        const invoice = getConsultationInvoice(appt);
                        const paymentStatus = getPaymentStatus(appt);
                        return (
                          <tr key={appt._id}>
                            <td>{new Date(appt.requestedDate).toLocaleDateString('vi-VN')}</td>
                            <td>{appt.requestedTime}</td>
                            <td>{appt.departmentId?.departmentName || 'Chung'}</td>
                            <td>{appt.doctorId?.fullName || 'Bác sĩ bất kỳ'}</td>
                            <td>
                              {renderStatus(appt.status)}
                              {appt.status === 'Confirmed' && isNearAppointment(appt.requestedDate) && (
                                <div className="appointment-note">Gợi ý: Hệ thống sẽ nhắc bạn xác nhận lại 2-3 ngày trước ngày khám qua SMS/Zalo.</div>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${paymentStatus.cls}`}>{paymentStatus.label}</span>
                            </td>
                            <td>
                              {appt.status === 'Pending' && (
                                <button className="btn btn-danger btn-xs" onClick={() => handleCancelAppointment(appt._id)}>Hủy</button>
                              )}
                              {appt.status === 'Confirmed' && invoice?.status === 'Unpaid' && (
                                <button className="btn btn-primary btn-xs" onClick={() => handlePayInvoice(invoice)}>Thanh toán trước</button>
                              )}
                              {appt.status === 'Confirmed' && invoice?.status === 'Paid' && (
                                <button className="btn btn-ghost btn-xs" onClick={() => setSelectedInvoice(invoice)}>Xem hóa đơn</button>
                              )}
                              {appt.status === 'Completed' && (
                                <span className="text-muted">Đã khám xong</span>
                              )}
                              {appt.status === 'Canceled' && (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Book Appointment */}
          {activeTab === 'book' && (
            <div className="dashboard-card card">
              <div className="card-title-bar">
                <h3>Đăng ký đặt lịch khám</h3>
                <span className="badge badge-info">Nhanh & An toàn</span>
              </div>
              <p className="subtitle">Lựa chọn chuyên khoa, bác sĩ và thời gian khám phù hợp.</p>

              {!isProfileComplete && (
                <div className="alert alert-warning">
                  Bạn cần hoàn tất hồ sơ bệnh nhân trước khi đặt lịch khám. Vui lòng vào tab "Thông tin cá nhân" và cập nhật thông tin.
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="grid-form">
                <div className="form-group full-width">
                  <label>Chuyên khoa khám *</label>
                  <select
                    value={bookingForm.departmentId}
                    onChange={(e) => setBookingForm({ ...bookingForm, departmentId: e.target.value, doctorId: '' })}
                    required
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.departmentName}</option>
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
                      .filter((doc) => !bookingForm.departmentId || doc.departmentId?._id === bookingForm.departmentId || doc.departmentId === bookingForm.departmentId)
                      .map((doc) => (
                        <option key={doc._id} value={doc._id}>{doc.fullName} ({doc.specialization})</option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ngày khám bệnh *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
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
                      schedules.map((s) => (
                        <option key={s._id} value={`${s.startTime} - ${s.endTime}`}>
                          {s.startTime} - {s.endTime} (Còn trống: {s.maxPatients - s.currentBooked} chỗ)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="08:00 - 09:00">08:00 - 09:00 (Sáng)</option>
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
                  <button type="submit" className="btn btn-primary" disabled={submitting || !isProfileComplete}>
                    {submitting ? 'Đang gửi...' : 'Gửi đăng ký lịch hẹn'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setBookingForm({ departmentId: '', doctorId: '', requestedDate: '', requestedTime: '', symptoms: '' })}>Xóa</button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Medical Records */}
          {activeTab === 'records' && (
            <div className="dashboard-card card">
              <div className="card-title-bar">
                <h3>Lịch sử khám bệnh & Bệnh án</h3>
                <span className="badge badge-purple">{records.length} mục</span>
              </div>
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
                          {rec.height && <span>📏 Chiều cao: {rec.height} cm</span>}
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
    <h2>{patient ? 'Hồ sơ sức khỏe cá nhân' : 'Khởi tạo thông tin bệnh nhân mới'}</h2>
    <p className="subtitle">
      {patient
        ? 'Vui lòng điền chính xác thông tin để làm hồ sơ bệnh án điện tử (EHR).'
        : 'Hãy nhập thông tin định danh ban đầu của bạn để hệ thống cấp mã bệnh nhân.'}
      <br />
      <small>CMND/CCCD và Mã BHYT là thông tin bổ sung, có thể để trống nếu bạn chưa có.</small>
    </p>

    {/* Sử dụng hàm submit hợp nhất thông minh */}
    <form onSubmit={handleProfileFormSubmit} className="grid-form">
      <div className="form-group">
        <label>Họ và tên *</label>
        <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required />
      </div>

      <div className="form-group">
        <label>Số điện thoại *</label>
        <input type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} required />
      </div>

      <div className="form-group">
        <label>Ngày sinh *</label>
        <input type="date" value={profileForm.dateOfBirth} onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })} required />
      </div>

      <div className="form-group">
        <label>Giới tính</label>
        <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
      </div>

      <div className="form-group">
        <label>CMND / CCCD</label>
        <input type="text" value={profileForm.identityCard} onChange={(e) => setProfileForm({ ...profileForm, identityCard: e.target.value })} />
      </div>

      <div className="form-group full-width">
        <label>Địa chỉ</label>
        <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
      </div>

      <div className="form-group">
        <label>Mã bảo hiểm</label>
        <input type="text" value={profileForm.insuranceCode} onChange={(e) => setProfileForm({ ...profileForm, insuranceCode: e.target.value })} />
      </div>

      <div className="form-group">
        <label>Người liên hệ khẩn cấp</label>
        <input type="text" value={profileForm.emergencyContact} onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '⏳ Đang xử lý dữ liệu...' : patient ? 'Cập nhật thay đổi hồ sơ' : 'Lưu & Kích hoạt tài khoản khám'}
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
          </div>
        </div>
      )}

      {/* Medical Record / Prescriptions Detail Modal */}
      {selectedRecord && (
        <div className="modal-backdrop">
          <div className="modal-content record-modal">
            <div className="modal-header">
              <h3>Chi tiết bệnh án & Đơn thuốc</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="record-details-block">
                <h4>Thông tin buổi khám</h4>
                <div className="grid-details">
                  <p><strong>Ngày khám:</strong> {new Date(selectedRecord.createdAt).toLocaleDateString('vi-VN')}</p>
                  <p><strong>Bác sĩ phụ trách:</strong> BS. {selectedRecord.doctorId?.fullName}</p>
                  <p><strong>Chuyên khoa:</strong> {selectedRecord.appointmentId?.departmentId?.departmentName || 'Chung'}</p>
                  <p><strong>Mã bệnh án:</strong> <span className="monospace">{selectedRecord._id}</span></p>
                </div>
              </div>

              <div className="record-details-block" style={{ marginTop: 15 }}>
                <h4>Chỉ số sinh tồn (Vitals)</h4>
                <div className="vitals-bubble-grid">
                  <div className="vital-bubble">
                    <span className="vital-label">Huyết áp</span>
                    <span className="vital-val">{selectedRecord.bloodPressure || '--'} <small>mmHg</small></span>
                  </div>
                  <div className="vital-bubble">
                    <span className="vital-label">Nhịp tim</span>
                    <span className="vital-val">{selectedRecord.heartRate || '--'} <small>bpm</small></span>
                  </div>
                  <div className="vital-bubble">
                    <span className="vital-label">Nhiệt độ</span>
                    <span className="vital-val">{selectedRecord.temperature || '--'} <small>°C</small></span>
                  </div>
                  <div className="vital-bubble">
                    <span className="vital-label">Chiều cao</span>
                    <span className="vital-val">{selectedRecord.height || '--'} <small>cm</small></span>
                  </div>
                  <div className="vital-bubble">
                    <span className="vital-label">Cân nặng</span>
                    <span className="vital-val">{selectedRecord.weight || '--'} <small>kg</small></span>
                  </div>
                </div>
              </div>

              <div className="record-details-block" style={{ marginTop: 15 }}>
                <h4>Kết quả lâm sàng & Hướng điều trị</h4>
                <div className="clinical-text-box">
                  <p><strong>Chẩn đoán bệnh lý:</strong></p>
                  <p className="diagnosis-highlight">{selectedRecord.diagnosis}</p>
                  {selectedRecord.clinicalNotes && (
                    <>
                      <p style={{ marginTop: 10 }}><strong>Ghi chú / Lời khuyên của bác sĩ:</strong></p>
                      <p className="notes-box">{selectedRecord.clinicalNotes}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="record-details-block" style={{ marginTop: 15 }}>
                <h4>Đơn thuốc chỉ định</h4>
                {!selectedRecord.prescriptions || selectedRecord.prescriptions.length === 0 ? (
                  <p className="text-muted">Bác sĩ không chỉ định dùng thuốc cho bệnh án này.</p>
                ) : (
                  <table className="receipt-table">
                    <thead>
                      <tr>
                        <th>Tên thuốc</th>
                        <th>Liều dùng</th>
                        <th>Tần suất</th>
                        <th>Số ngày</th>
                        <th className="text-right">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.prescriptions.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{p.medicineId?.name}</strong><br />
                            <small className="text-muted">{p.medicineId?.dosageForm} | {p.specialInstructions}</small>
                          </td>
                          <td>{p.dosage}</td>
                          <td>{p.frequency}</td>
                          <td>{p.durationDays} ngày</td>
                          <td className="text-right font-bold">{p.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedRecord(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {paymentInvoice && (
        <div className="modal-backdrop">
          <div className="modal-content payment-gateway-modal">
            <div className="modal-header">
              <h3>Cổng thanh toán viện phí trực tuyến</h3>
              <button className="close-btn" onClick={() => setPaymentInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body text-center">
              <p>Bạn đang tiến hành thanh toán cho hóa đơn:</p>
              <h4 className="invoice-type-label">
                {paymentInvoice.invoiceType === 'Consultation' ? 'Phí khám bệnh lâm sàng' : 'Tiền thuốc theo đơn'}
              </h4>
              <p className="payment-amount">{formatVND(paymentInvoice.totalAmount)}</p>

              {paymentProcessing ? (
                <div className="payment-spinner-container">
                  <div className="spinner"></div>
                  <p className="spinner-text">Đang kết nối ngân hàng để thực hiện giao dịch...</p>
                  <p className="small text-muted">Vui lòng không tắt trình duyệt hoặc nhấn nút quay lại.</p>
                </div>
              ) : (
                <>
                  <div className="payment-methods-grid">
                    <label className={`method-card ${paymentMethod === 'bank' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                      />
                      <span className="method-icon">🏦</span>
                      <span className="method-name">Chuyển khoản QR</span>
                    </label>

                    <label className={`method-card ${paymentMethod === 'momo' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="momo"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                      />
                      <span className="method-icon">💖</span>
                      <span className="method-name">Ví MoMo</span>
                    </label>

                    <label className={`method-card ${paymentMethod === 'card' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="payMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <span className="method-icon">💳</span>
                      <span className="method-name">Visa / Mastercard</span>
                    </label>
                  </div>

                  <div className="payment-details-panel">
                    {paymentMethod === 'bank' && (
                      <div className="bank-qr-mock">
                        <div className="mock-qr-code">
                          {/* Visual QR Simulator */}
                          <div className="qr-box">
                            <div className="qr-square qr-tl"></div>
                            <div className="qr-square qr-tr"></div>
                            <div className="qr-square qr-bl"></div>
                            <div className="qr-center-logo">EHR</div>
                          </div>
                        </div>
                        <p><strong>Ngân hàng Vietinbank</strong></p>
                        <p>Số tài khoản: <strong>102839210928</strong></p>
                        <p>Chủ tài khoản: <strong>PHONG KHAM HOP SON TAI</strong></p>
                        <p className="small text-muted">Quét mã QR trên để tự động nhập số tiền và nội dung.</p>
                      </div>
                    )}

                    {paymentMethod === 'momo' && (
                      <div className="momo-mock">
                        <p>Hệ thống sẽ chuyển tiếp đến ứng dụng MoMo để hoàn tất.</p>
                        <p className="small text-muted">Số ví phòng khám: 0901234567</p>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="card-mock-form">
                        <input type="text" placeholder="Số thẻ (16 chữ số)" className="login-input" style={{ marginBottom: 8 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" placeholder="MM/YY" className="login-input" />
                          <input type="text" placeholder="CVC" className="login-input" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPaymentInvoice(null)} disabled={paymentProcessing}>Hủy</button>
              <button className="btn btn-primary" onClick={executePayment} disabled={paymentProcessing}>
                {paymentProcessing ? 'Đang giao dịch...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
