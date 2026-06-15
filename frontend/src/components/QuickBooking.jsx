import React, { useState, useEffect } from 'react';
import { schedulingAPI, clinicalAPI, bookingAPI } from '../services/api';

export default function QuickBooking({ 
  departments = [], 
  doctors = [], 
  initialDoctorId = '', 
  initialDepartmentId = '', 
  isInline = false,
  isModal = false,
  onSuccess
}) {
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

  const minBookingDate = getMinBookingDate();

  const [department, setDepartment] = useState(initialDepartmentId);
  const [doctor, setDoctor] = useState(initialDoctorId);
  const [date, setDate] = useState(() => getMinBookingDate());
  const [time, setTime] = useState('09:00');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(true);
  const [isPatientLoggedIn, setIsPatientLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const loggedIn = !!(token && role === 'patient');
    setIsPatientLoggedIn(loggedIn);
    if (loggedIn) {
      const storedName = localStorage.getItem('userDisplayName');
      const storedPhone = localStorage.getItem('userName');
      if (storedName) setName(storedName);
      if (storedPhone) setPhone(storedPhone);
    }
  }, []);

  const [localDepartments, setLocalDepartments] = useState([]);
  const [localDoctors, setLocalDoctors] = useState([]);

  useEffect(() => {
    if (departments.length === 0) {
      schedulingAPI.getDepartments()
        .then(res => setLocalDepartments(res.data?.data || []))
        .catch(err => console.error(err));
    }
  }, [departments]);

  useEffect(() => {
    if (doctors.length === 0) {
      clinicalAPI.getDoctors()
        .then(res => setLocalDoctors(res.data?.data || []))
        .catch(err => console.error(err));
    }
  }, [doctors]);

  const activeDepartments = departments.length > 0 ? departments : localDepartments;
  const activeDoctors = doctors.length > 0 ? doctors : localDoctors;

  useEffect(() => {
    if (initialDepartmentId) setDepartment(initialDepartmentId);
  }, [initialDepartmentId]);

  useEffect(() => {
    if (initialDoctorId) setDoctor(initialDoctorId);
  }, [initialDoctorId]);

  // Dynamic filtering of doctors based on selected department ID
  const selectedDepObj = activeDepartments.find(d => d._id === department);
  const selectedDepName = selectedDepObj ? (selectedDepObj.departmentName || selectedDepObj.name) : '';

  const selectedDocObj = activeDoctors.find(d => (d.id || d._id) === doctor);
  const selectedDocName = selectedDocObj ? selectedDocObj.fullName : '';

  const filteredDoctors = activeDoctors.filter(doc => {
    if (!department) return true; // show all if no department selected yet
    return doc.department === selectedDepName;
  });

  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    setDepartment(newDeptId);
    
    // Find the new department name
    const newDepObj = activeDepartments.find(d => d._id === newDeptId);
    const newDepName = newDepObj ? (newDepObj.departmentName || newDepObj.name) : '';
    
    // Check if currently selected doctor is still valid under new department
    const matches = activeDoctors.filter(doc => !newDeptId || doc.department === newDepName);
    const isStillValid = matches.some(doc => (doc.id || doc._id) === doctor);
    if (!isStillValid) {
      setDoctor('');
    }
  };


  useEffect(() => {
    if (isInline) {
      setOpen(true);
      return;
    }
    const onResize = () => setOpen(window.innerWidth > 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isInline]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setDepartment('');
    setDoctor('');
    setTime('09:00');
    setDate(getMinBookingDate());
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validate phone format
    const phoneRegex = /^(84|0[3|5|7|8|9])([0-9]{8})$/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (ví dụ: 0912345678)');
      setLoading(false);
      return;
    }

    // Validate working hours (09:00 - 17:00)
    if (time < '09:00' || time > '17:00') {
      setError('Khung giờ hẹn khám phải nằm trong khoảng từ 09:00 đến 17:00.');
      setLoading(false);
      return;
    }

    try {
<<<<<<< HEAD
      const token = localStorage.getItem('token');
      if (token) {
        const payload = { 
          bookingDate: date, 
          time, 
=======
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      if (isPatientLoggedIn) {
        // Authenticated patient -> create appointment
        const payload = { 
          requestedDate: new Date(date).toISOString(), 
          requestedTime: time, 
          departmentId: department, 
          doctorId: doctor || undefined, 
          symptoms: `Đặt lịch nhanh - Bệnh nhân: ${trimmedName} (SĐT: ${trimmedPhone})` 
        };
        const resp = await schedulingAPI.bookAppointment(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đặt lịch khám thành công! Nhân viên chăm sóc khách hàng sẽ liên hệ sớm.');
          setDepartment(''); setDoctor(''); setTime('09:00'); setDate(getMinBookingDate());
          if (!isPatientLoggedIn) {
            setName('');
            setPhone('');
          }
          if (onSuccess) onSuccess(); // Gọi callback đóng modal ở ngoài layout
          setTimeout(() => setSuccess(null), 5000);
          // Trigger event to refresh stats in real-time
          window.dispatchEvent(new CustomEvent('booking-success'));
        } else {
          setError(resp.data?.message || 'Không thể đặt lịch');
        }
      } else {
        // Fallback to public quick booking
        const payload = { 
          name: trimmedName, 
          phone: trimmedPhone, 
          departmentId: department, 
          doctorId: doctor || undefined, 
          requestedDate: date, 
          requestedTime: time 
        };
        const resp = await bookingAPI.submitQuickBooking(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đã gửi yêu cầu đặt lịch! Phòng khám sẽ liên hệ lại với bạn sớm nhất.');
          setDepartment(''); setDoctor(''); setTime('09:00'); setDate(getMinBookingDate());
          if (!isPatientLoggedIn) {
            setName('');
            setPhone('');
          }
          if (onSuccess) onSuccess(); // Gọi callback đóng modal ở ngoài layout
          setTimeout(() => setSuccess(null), 5000);
          // Trigger event to refresh stats in real-time
          window.dispatchEvent(new CustomEvent('booking-success'));
        } else {
          setError(resp.data?.message || 'Không thể gửi yêu cầu');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`quick-booking ${isInline ? 'quick-booking--inline' : ''}`} id="booking-section">
      <div className="quick-booking-header">
        <div className="quick-booking-title-group">
          <h3>Đặt Lịch Khám Nhanh</h3>
          <p className="quick-booking-subtitle">Thủ tục đơn giản, hoàn toàn miễn phí</p>
        </div>
        {!isInline && !isModal && (
          <button type="button" className="quickbooking-toggle" onClick={() => setOpen(s => !s)} aria-expanded={open}>
            {open ? 'Thu gọn' : 'Mở'}
          </button>
        )}
      </div>

      {success && (
        <div className="booking-banner success" role="status">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="booking-banner error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className={`quick-booking-body ${open ? 'open' : 'collapsed'}`} style={{ marginTop: '12px' }}>
        <form onSubmit={handleSubmit} className="form-grid-2">
          <div className="booking-field-group">
            <label className="booking-label">
              Chuyên Khoa
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <select value={department} onChange={handleDepartmentChange} required>
                <option value="">-- Chọn chuyên khoa --</option>
                {activeDepartments.map(d => (
                  <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
                ))}
              </select>
              <div className="booking-select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="booking-field-group">
            <label className="booking-label">
              Bác Sĩ Mong Muốn
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              <select value={doctor} onChange={e => setDoctor(e.target.value)}>
                <option value="">-- Bác sĩ bất kỳ --</option>
                {filteredDoctors.map(d => (
                  <option key={d.id || d._id} value={d.id || d._id}>{d.fullName} ({d.specialization || 'Bác sĩ'})</option>
                ))}
              </select>
              <div className="booking-select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="booking-field-group">
            <label className="booking-label">
              Ngày Hẹn Khám
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input 
                type="date" 
                value={date} 
                min={minBookingDate}
                onChange={e => setDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="booking-field-group">
            <label className="booking-label">
              Giờ Hẹn Khám
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <input 
                type="time" 
                value={time} 
                min="09:00"
                max="17:00"
                onChange={e => setTime(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="booking-field-group">
            <label className="booking-label">
              Họ và Tên Bệnh Nhân
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input 
                placeholder="Nhập đầy đủ họ tên" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                autoComplete="off"
                disabled={isPatientLoggedIn}
                style={isPatientLoggedIn ? { backgroundColor: '#e2e8f0', cursor: 'not-allowed', color: '#64748b' } : {}}
              />
            </div>
          </div>

          <div className="booking-field-group">
            <label className="booking-label">
              Số Điện Thoại Liên Hệ
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input 
                type="tel" 
                placeholder="Ví dụ: 0912345678" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
                autoComplete="off"
                disabled={isPatientLoggedIn}
                style={isPatientLoggedIn ? { backgroundColor: '#e2e8f0', cursor: 'not-allowed', color: '#64748b' } : {}}
              />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%', 
            gridColumn: '1 / -1', 
            marginTop: '24px'
          }}>
            <button type="submit" disabled={loading} className="booking-submit-btn" style={{ padding: '12px 32px' }}>
              {loading ? (
                <span className="btn-spinner"></span>
              ) : (
                <>
                  <svg className="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Xác Nhận Đăng Ký</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}