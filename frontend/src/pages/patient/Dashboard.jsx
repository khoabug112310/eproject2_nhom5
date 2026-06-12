import React, { useState, useEffect } from 'react';
import { profilesAPI, schedulingAPI, clinicalAPI, billingAPI, authAPI } from '../../services/api';
import RoleTopNav from '../../components/RoleTopNav';

export default function PatientDashboard() {
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

  const getFormattedLocalDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinBookingDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 17) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return getFormattedLocalDate(tomorrow);
    }
    return getFormattedLocalDate(now);
  };

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

      // 1. Get Me
      const meRes = await authAPI.me();
      const me = meRes.data.data;
      setCurrentUser(me);

      // 2. Get Patients list to find matching profile
      const patientsRes = await profilesAPI.getPatients();
      const patientsList = patientsRes.data.data;
      const matchedPatient = patientsList.find(
        (p) => p.userId?._id === me.userId || p.userId === me.userId || p.phoneNumber === me.username
      );

      if (matchedPatient) {
        setPatient(matchedPatient);
        // Initialize profile form
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

        // Fetch user records, appointments, and invoices
        const apptsRes = await schedulingAPI.getAppointments();
        setAppointments(apptsRes.data.data);

        const invoicesRes = await billingAPI.getInvoices();
        setInvoices(invoicesRes.data.data);

        const recordsRes = await clinicalAPI.getMedicalRecords({ patientId: matchedPatient._id });
        setRecords(recordsRes.data.data);
      } else {
        // Patient profile doesn't exist yet, force user to profile tab to create it
        setActiveTab('profile');
        setProfileForm((prev) => ({
          ...prev,
          phoneNumber: me.username || '',
        }));
      }

      // Load static lists for booking
      const deptsRes = await schedulingAPI.getDepartments();
      setDepartments(deptsRes.data.data);

      const docsRes = await clinicalAPI.getDoctors();
      setDoctors(docsRes.data.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatientProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      // Create user profile on backend (which also creates patient profile on profiles API or auth register activation)
      // Since they are logged in but don't have patient details, we call profilesAPI.updateUser or register a new one.
      // Wait, let's call createDoctor but passing patient role, or check what endpoints exist.
      // Let's create the patient profile by calling register endpoint again, or profilesAPI.createUser.
      // Wait, profilesAPI.updateUser(currentUser.userId, data): let's verify if we can update the User to patient.
      // Or we can check if there's a POST /profiles/users or POST /auth/register.
      // Wait, let's see profilesAPI.createUser which maps to POST /profiles/users.
      const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!patient) return handleCreatePatientProfile(e);

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
          const updatePayload = {
            fullName: profileForm.fullName,
            dateOfBirth: profileForm.dateOfBirth,
            gender: profileForm.gender,
            identityCard: profileForm.identityCard,
            phoneNumber: profileForm.phoneNumber,
            address: profileForm.address,
            insuranceCode: profileForm.insuranceCode,
            emergencyContact: profileForm.emergencyContact,
          };

          // 1. Gửi lệnh cập nhật lên Backend
          await profilesAPI.updateUser(currentUser.userId, updatePayload);
          // 1. CẬP NHẬT NGAY LẬP TỨC TRÊN UI CHO PATIENT
          setPatient((prev) => ({
            ...prev,
            fullName: profileForm.fullName // Ghi đè tên mới vào State của Patient
          }));

          // 2. CẬP NHẬT ĐỒNG BỘ LUÔN TÊN TRONG DANH SÁCH HÓA ĐƠN (INVOICES)
          setInvoices((prevInvoices) =>
            prevInvoices.map((inv) => ({
              ...inv,
              patientId: {
                ...inv.patientId,
                fullName: profileForm.fullName // Ghi đè tên mới vào từng hóa đơn
              }
            }))
          );

          setSuccessMessage('Cập nhật hồ sơ thành công!');

          // 3. Đọc lại dữ liệu để đồng bộ hoàn toàn với database
          await fetchInitialData();
        } catch (err) {
          setErrorMessage(err?.response?.data?.message || 'Không thể cập nhật hồ sơ.');
        } finally {
          setSubmitting(false);
        }
      };


      // Let's call the backend to create/update
      // Since they already exist in User model, we should create Patient model directly.
      // Let's see: profilesAPI.createUser will return 409 if username exists, but wait, does backend createDoctor handle updating?
      // Let's check how we can create a patient record. In profiles/controller.js:
      // If roleName === 'patient', it creates a patient in Patient collection!
      // But user already exists. Wait, can we write a custom request, or does backend authorize updating User?
      // Actually, let's check backend/src/modules/profiles/controller.js updateUser:
      // If it matches patient id, it updates patient. If it matches user id, it updates user.
      // But patient doesn't exist yet! How to create it?
      // In backend/src/modules/auth/controller.js register:
      // It allows creating a patient for existing user if password is correct!
      // Or we can call authAPI.register(payload):
      const regRes = await authAPI.register({
        phone: currentUser.username,
        fullName: profileForm.fullName,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender,
        identityCard: profileForm.identityCard,
        address: profileForm.address,
        insuranceCode: profileForm.insuranceCode,
        emergencyContact: profileForm.emergencyContact
      });

      setSuccessMessage('Khởi tạo hồ sơ bệnh nhân thành công!');
      fetchInitialData();
      setActiveTab('appointments');
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể tạo hồ sơ bệnh nhân.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!patient) return handleCreatePatientProfile(e);

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await profilesAPI.updateUser(patient._id, {
        fullName: profileForm.fullName,
        dateOfBirth: profileForm.dateOfBirth,
        gender: profileForm.gender,
        identityCard: profileForm.identityCard,
        phoneNumber: profileForm.phoneNumber,
        address: profileForm.address,
        insuranceCode: profileForm.insuranceCode,
        emergencyContact: profileForm.emergencyContact,
      });
      setSuccessMessage('Cập nhật hồ sơ thành công!');
      fetchInitialData();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Không thể cập nhật hồ sơ.');
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

    // Check if patient already has a pending appointment
    const hasPendingAppointment = appointments.some(
      (appt) => appt.status === 'Pending'
    );
    if (hasPendingAppointment) {
      setErrorMessage('Bạn đã có một lịch hẹn đang chờ xác nhận. Không thể đăng ký thêm lịch mới.');
      return;
    }

    // Validate booking cutoff time (after 17:00, cannot book for today)
    const selectedDateStr = bookingForm.requestedDate;
    const todayStr = getMinBookingDate();
    if (selectedDateStr < todayStr) {
      setErrorMessage('Không thể đăng ký lịch khám cho ngày hôm nay sau 17:00. Vui lòng chọn từ ngày mai trở đi.');
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
    if (status === 'Pending') { cls = 'badge-warning'; label = 'Chờ xác nhận'; }
    else if (status === 'Confirmed') { cls = 'badge-primary'; label = 'Đã xác nhận'; }
    else if (status === 'Completed') { cls = 'badge-success'; label = 'Hoàn thành'; }
    else if (status === 'Canceled') { cls = 'badge-danger'; label = 'Đã hủy'; }
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

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
