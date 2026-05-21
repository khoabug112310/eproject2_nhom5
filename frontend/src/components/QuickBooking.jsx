import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { schedulingAPI } from '../services/api';

export default function QuickBooking({ departments = [], doctors = [] }) {
  const [department, setDepartment] = useState(departments[0]?._id || departments[0]?.name || '');
  const [doctor, setDoctor] = useState(doctors[0]?._id || '');
  const [time, setTime] = useState('09:00');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const onResize = () => setOpen(window.innerWidth > 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Authenticated patient -> create appointment
        const payload = { requestedDate: new Date().toISOString(), requestedTime: time, departmentId: department, doctorId: doctor, symptoms: '' };
        const resp = await schedulingAPI.bookAppointment(payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đặt lịch thành công. Chúng tôi sẽ xác nhận sớm.');
          setName(''); setPhone('');
        } else {
          setError(resp.data?.message || 'Không thể đặt lịch');
        }
      } else {
        // Fallback to quick booking
        const payload = { name, phone, department, doctor, time };
        const url = '/api/booking';
        const resp = await axios.post(url, payload);
        if (resp.data && resp.data.success) {
          setSuccess('Đã gửi yêu cầu. Chúng tôi sẽ liên hệ lại sớm.');
          setName(''); setPhone('');
        } else {
          setError(resp.data?.message || 'Không thể gửi yêu cầu');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quick-booking card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{margin:0}}>Đặt lịch nhanh</h3>
        <button type="button" className="quickbooking-toggle" onClick={() => setOpen(s => !s)} aria-expanded={open} style={{background:'transparent',border:0,cursor:'pointer'}}>
          {open ? 'Thu gọn' : 'Mở'}
        </button>
      </div>

      {success && <div className="muted" role="status" style={{color:'green',marginTop:8}}>{success}</div>}
      {error && <div className="muted" role="alert" style={{color:'red',marginTop:8}}>{error}</div>}

      <div className={`quick-booking-body ${open ? 'open' : 'collapsed'}`}>
        <form onSubmit={handleSubmit}>
          <label>
            Khoa
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">-- Chọn khoa --</option>
              {departments.map(d => (
                <option key={d._id || d.name || d.departmentName} value={d.name || d.departmentName || d._id}>{d.name || d.departmentName}</option>
              ))}
            </select>
          </label>

          <label>
            Bác sĩ
            <select value={doctor} onChange={e => setDoctor(e.target.value)}>
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map(d => (
                <option key={d._id || d.fullName} value={d.fullName || d._id}>{d.fullName} ({d.specialization || ''})</option>
              ))}
            </select>
          </label>

          <label>
            Giờ
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </label>

          <label>
            Họ tên
            <input value={name} onChange={e => setName(e.target.value)} required />
          </label>

          <label>
            Số điện thoại
            <input value={phone} onChange={e => setPhone(e.target.value)} required />
          </label>

          <div style={{marginTop:8}}>
            <button type="submit" disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi đặt lịch'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
