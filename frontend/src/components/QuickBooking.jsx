import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { schedulingAPI } from '../services/api';

// Hàm tiện ích lấy ngày hôm nay theo định dạng YYYY-MM-DD chuẩn múi giờ địa phương
const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function QuickBooking({ departments = [], doctors = [], initialDoctorId = '', initialDepartmentId = '', isInline = false, onSuccess }) {
  const [department, setDepartment] = useState(initialDepartmentId);
  const [doctor, setDoctor] = useState(initialDoctorId);
  
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('09:00');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (initialDepartmentId) setDepartment(initialDepartmentId);
  }, [initialDepartmentId]);

  useEffect(() => {
    if (initialDoctorId) setDoctor(initialDoctorId);
  }, [initialDoctorId]);

  const selectedDepObj = departments.find(d => d._id === department);
  const selectedDepName = selectedDepObj ? (selectedDepObj.departmentName || selectedDepObj.name) : '';

  const selectedDocObj = doctors.find(d => (d.id || d._id) === doctor);
  const selectedDocName = selectedDocObj ? selectedDocObj.fullName : '';

  const filteredDoctors = doctors.filter(doc => {
    if (!department) return true;
    return doc.department === selectedDepName;
  });

  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    setDepartment(newDeptId);
    
    const newDepObj = departments.find(d => d._id === newDeptId);
    const newDepName = newDepObj ? (newDepObj.departmentName || newDepObj.name) : '';
    
    const matches = doctors.filter(doc => !newDeptId || doc.department === newDepName);
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
    setDate(getTodayString());
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (ví dụ: 0912345678)');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = { 
          bookingDate: date, 
          time, 
          departmentId: department, 
          doctorId: doctor || undefined, 
          symptoms: 'Đặt lịch nhanh' 
        };
        const resp = await schedulingAPI.bookAppointment(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đặt lịch khám thành công! Nhân viên chăm sóc khách hàng sẽ liên hệ sớm.');
          resetForm();
          if (onSuccess) onSuccess(); // Gọi callback đóng modal ở ngoài layout
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setError(resp.data?.message || 'Không thể đặt lịch');
        }
      } else {
        const payload = { 
          name, 
          phone, 
          department: selectedDepName || department, 
          doctor: selectedDocName || doctor,         
          bookingDate: date, 
          time 
        };
        
        const url = 'http://localhost:4000/api/booking';
        const resp = await axios.post(url, payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đã gửi yêu cầu đặt lịch! Phòng khám sẽ liên hệ lại với bạn sớm nhất.');
          resetForm();
          if (onSuccess) onSuccess(); // Gọi callback đóng modal ở ngoài layout
          setTimeout(() => setSuccess(null), 5000);
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
        <h3>Đặt Lịch Khám Nhanh</h3>
        {!isInline && (
          <button type="button" className="quickbooking-toggle" onClick={() => setOpen(s => !s)} aria-expanded={open}>
            {open ? 'Thu gọn' : 'Mở'}
          </button>
        )}
      </div>

      {success && (
        <div className="booking-banner success" role="status">
          <span>✓</span> {success}
        </div>
      )}
      {error && (
        <div className="booking-banner error" role="alert">
          <span>⚠</span> {error}
        </div>
      )}

      <div className={`quick-booking-body ${open ? 'open' : 'collapsed'}`} style={{ marginTop: '12px' }}>
        <form onSubmit={handleSubmit}>
          <label>
            <span className="label-text">Chuyên Khoa <span className="required-star">*</span></span>
            <select value={department} onChange={handleDepartmentChange} required>
              <option value="">-- Chọn chuyên khoa --</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.departmentName || d.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="label-text">Bác Sĩ Mong Muốn</span>
            <select value={doctor} onChange={e => setDoctor(e.target.value)}>
              <option value="">-- Bác sĩ bất kỳ --</option>
              {filteredDoctors.map(d => (
                <option key={d.id || d._id} value={d.id || d._id}>{d.fullName} ({d.specialization || 'Bác sĩ'})</option>
              ))}
            </select>
          </label>

          <label>
            <span className="label-text">Ngày Hẹn Khám <span className="required-star">*</span></span>
            <input 
              type="date" 
              value={date} 
              min={getTodayString()} 
              onChange={e => setDate(e.target.value)} 
              required 
            />
          </label>

          <label>
            <span className="label-text">Giờ Hẹn Khám <span className="required-star">*</span></span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </label>

          <label>
            <span className="label-text">Họ và Tên Bệnh Nhân <span className="required-star">*</span></span>
            <input 
              placeholder="Nhập đầy đủ họ tên" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </label>

          <label>
            <span className="label-text">Số Điện Thoại Liên Hệ <span className="required-star">*</span></span>
            <input 
              type="tel" 
              placeholder="Ví dụ: 0912345678" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
            />
          </label>

          {/* SỬA ĐỔI CHÍNH TẠI ĐÂY: Bọc nút bấm vào div Flexbox để căn giữa tuyệt đối */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%', 
            gridColumn: '1 / -1', // Nếu form dùng CSS Grid 2 cột, dòng này ép div chiếm hết hàng để nút nằm giữa chuẩn
            marginTop: '24px'
          }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '12px 32px', // Tăng nhẹ bề ngang nhìn nút sẽ cân đối, bề thế hơn khi ở giữa
                cursor: 'pointer'
              }}
            >
              {loading ? 'Đang gửi thông tin...' : 'Xác Nhận Đăng Ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}