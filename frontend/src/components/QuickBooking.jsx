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
  const [symptoms, setSymptoms] = useState('');
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
    if (initialDoctorId) setDoctor(initialDoctorId);
  }, [initialDoctorId]);

  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [fetchingSchedule, setFetchingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const generateTimeSlots = (startStr, endStr) => {
    const slots = [];
    if (!startStr || !endStr) return slots;
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    
    while (current <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, '0');
      const m = String(current % 60).padStart(2, '0');
      const slot = `${h}:${m}`;
      
      // Exclude lunch break 12:00 - 13:00
      if (!(slot >= '12:00' && slot < '13:00')) {
        slots.push(slot);
      }
      current += 30;
    }
    return slots;
  };

  const generateAllTimeSlots = (schedules) => {
    let allSlots = [];
    schedules.forEach(sched => {
      const slots = generateTimeSlots(sched.startTime, sched.endTime);
      allSlots = [...allSlots, ...slots];
    });
    return [...new Set(allSlots)].sort();
  };

  useEffect(() => {
    if (doctor && date) {
      setFetchingSchedule(true);
      setScheduleError(null);
      setDoctorSchedules([]);
      
      schedulingAPI.getSchedules(doctor, date)
        .then(res => {
          const schedules = res.data?.data || [];
          if (schedules.length > 0) {
            setDoctorSchedules(schedules);
          } else {
            setDoctorSchedules([]);
            setScheduleError('Bác sĩ không có lịch làm việc vào ngày đã chọn. Vui lòng chọn ngày khác.');
          }
        })
        .catch(err => {
          console.error('Error fetching schedules:', err);
          setScheduleError('Không thể kiểm tra lịch làm việc của bác sĩ.');
        })
        .finally(() => {
          setFetchingSchedule(false);
        });
    } else {
      setDoctorSchedules([]);
      setScheduleError(null);
    }
  }, [doctor, date]);

  useEffect(() => {
    if (doctorSchedules.length > 0) {
      const slots = generateAllTimeSlots(doctorSchedules);
      if (slots.length > 0 && !slots.includes(time)) {
        setTime(slots[0]);
      }
    }
  }, [doctorSchedules]);

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
    setSymptoms('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validate phone format
    const phoneRegex = /^(84|0[3|5|7|8|9])([0-9]{8})$/;
    if (!phoneRegex.test(phone)) {
      setError('Invalid phone number. Please enter a valid Vietnamese number (e.g. 0912345678)');
      setLoading(false);
      return;
    }

    // Validate working hours / doctor schedule
    if (doctor) {
      if (doctorSchedules.length === 0) {
        setError('Bác sĩ không có lịch làm việc vào ngày đã chọn. Vui lòng chọn ngày khác hoặc chọn bác sĩ khác.');
        setLoading(false);
        return;
      }
      const isValid = doctorSchedules.some(sched => time >= sched.startTime && time <= sched.endTime);
      if (!isValid) {
        setError('Giờ hẹn phải nằm trong khung giờ làm việc của bác sĩ.');
        setLoading(false);
        return;
      }
    } else {
      if (time < '09:00' || time > '17:00') {
        setError('Appointment time must be between 09:00 and 17:00.');
        setLoading(false);
        return;
      }
    }

    try {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      if (isPatientLoggedIn) {
        // Authenticated patient -> create appointment
        const payload = {
          requestedDate: new Date(date).toISOString(),
          requestedTime: time,
          departmentId: department,
          doctorId: doctor || undefined,
          symptoms: symptoms.trim() || `Quick booking - Patient: ${trimmedName} (Phone: ${trimmedPhone})`,
        };
        const resp = await schedulingAPI.bookAppointment(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Appointment booked successfully! Our customer care team will contact you shortly.');
          setDepartment(''); setDoctor(''); setTime('09:00'); setDate(getMinBookingDate());
          if (!isPatientLoggedIn) {
            setName('');
            setPhone('');
          }
          if (onSuccess) onSuccess(); // Trigger callback to close the modal in the outer layout
          setTimeout(() => setSuccess(null), 5000);
          // Trigger event to refresh stats in real-time
          window.dispatchEvent(new CustomEvent('booking-success'));
        } else {
          setError(resp.data?.message || 'Unable to book the appointment');
        }
      } else {
        // Fallback to public quick booking
        const payload = {
          name: trimmedName,
          phone: trimmedPhone,
          departmentId: department,
          doctorId: doctor || undefined,
          requestedDate: date,
          requestedTime: time,
          symptoms: symptoms.trim() || undefined,
        };
        const resp = await bookingAPI.submitQuickBooking(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Your booking request has been sent! The clinic will contact you as soon as possible.');
          setDepartment(''); setDoctor(''); setTime('09:00'); setDate(getMinBookingDate());
          if (!isPatientLoggedIn) {
            setName('');
            setPhone('');
          }
          if (onSuccess) onSuccess(); // Trigger callback to close the modal in the outer layout
          setTimeout(() => setSuccess(null), 5000);
          // Trigger event to refresh stats in real-time
          window.dispatchEvent(new CustomEvent('booking-success'));
        } else {
          setError(resp.data?.message || 'Unable to send the request');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`quick-booking ${isInline ? 'quick-booking--inline' : ''} ${isModal ? 'quick-booking--modal' : ''}`} id="booking-section">
      <div className="quick-booking-header">
        <div className="quick-booking-title-group">
          <h3>Quick Appointment Booking</h3>
          <p className="quick-booking-subtitle">Simple process, completely free</p>
        </div>
        {!isInline && !isModal && (
          <button type="button" className="quickbooking-toggle" onClick={() => setOpen(s => !s)} aria-expanded={open}>
            {open ? 'Collapse' : 'Open'}
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
              Department <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <select value={department} onChange={handleDepartmentChange} required>
                <option value="">-- Select department --</option>
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
              Preferred Doctor
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              <select value={doctor} onChange={e => setDoctor(e.target.value)}>
                <option value="">-- Any doctor --</option>
                {filteredDoctors.map(d => (
                  <option key={d.id || d._id} value={d.id || d._id}>{d.fullName} ({d.specialization || 'Doctor'})</option>
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
              Appointment Date <span style={{ color: '#ef4444' }}>*</span>
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
              Appointment Time <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <select 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required
                disabled={doctor && doctorSchedules.length === 0}
              >
                {doctor ? (
                  doctorSchedules.length > 0 ? (
                    generateAllTimeSlots(doctorSchedules).map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))
                  ) : (
                    <option value="">-- Không có lịch trực --</option>
                  )
                ) : (
                  ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))
                )}
              </select>
              <div className="booking-select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Schedule status messages */}
          {fetchingSchedule && (
            <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 12px 0' }}>
              <span className="btn-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', borderTopColor: 'var(--color-primary)' }}></span>
              Đang kiểm tra lịch làm việc của bác sĩ...
            </div>
          )}

          {scheduleError && (
            <div style={{ 
              gridColumn: '1 / -1', 
              fontSize: '13px', 
              backgroundColor: '#fff7ed', 
              color: '#c2410c', 
              border: '1px solid #ffedd5',
              padding: '10px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '4px 0 12px 0'
            }}>
              <span>⚠️</span>
              <span>{scheduleError}</span>
            </div>
          )}

          <div className="booking-field-group">
            <label className="booking-label">
              Patient Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input 
                placeholder="Enter your full name"
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
              Contact Phone Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="booking-input-wrapper">
              <svg className="booking-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input 
                type="tel" 
                placeholder="e.g. 0912345678"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required 
                autoComplete="off"
                disabled={isPatientLoggedIn}
                style={isPatientLoggedIn ? { backgroundColor: '#e2e8f0', cursor: 'not-allowed', color: '#64748b' } : {}}
              />
            </div>
          </div>

          <div className="booking-field-group" style={{ gridColumn: '1 / -1' }}>
            <label className="booking-label">Symptoms / Reason for visit</label>
            <div className="booking-input-wrapper" style={{ display: 'block', position: 'relative' }}>
              <svg 
                className="booking-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ top: '14px', transform: 'none' }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <textarea
                placeholder="Describe your symptoms, reason for visit, or any special requirements (optional)..."
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                maxLength={1000}
                rows={isModal ? 2 : 4}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 38px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--color-text-dark)',
                  fontFamily: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: isModal ? '60px' : '100px',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            gridColumn: '1 / -1',
            marginTop: isModal ? '12px' : '24px'
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
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}