import React, { useState, useEffect } from 'react';
import { clinicalAPI, schedulingAPI } from '../../../services/api';

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
];

export default function BookingForm({ onBooked }) {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('08:00');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, docRes] = await Promise.all([
          schedulingAPI.getDepartments(),
          clinicalAPI.getDoctors(),
        ]);
        setDepartments(deptRes.data?.data || []);
        setDoctors(docRes.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);

  const handleDepartmentChange = (event) => {
    const selectedId = event.target.value;
    setDepartmentId(selectedId);
    setDoctorId('');
  };

  const selectedDepartment = departments.find((dept) => dept._id === departmentId);
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDepartment) return false;
    return doc.department === (selectedDepartment.departmentName || selectedDepartment.name);
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!departmentId || !requestedDate || !requestedTime) {
      setError('Vui lòng chọn khoa, ngày và giờ.');
      return;
    }

    setLoading(true);
    try {
      await schedulingAPI.bookAppointment({
        departmentId,
        doctorId: doctorId || undefined,
        requestedDate,
        requestedTime,
        symptoms,
      });
      setMessage('Đặt lịch thành công. CSKH sẽ liên hệ xác nhận.');
      setRequestedDate('');
      setRequestedTime('08:00');
      setSymptoms('');
      setDoctorId('');
      if (onBooked) onBooked();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi khi đặt lịch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quick-booking">
      <header className="quick-booking-header card-title-bar">
        <div>
          <p>Đặt lịch nhanh</p>
          <h4>Yêu cầu lịch khám mới</h4>
        </div>
      </header>
      <div className="quick-booking-subtitle">
        <p>Chọn khoa và thời gian phù hợp, sau đó CSKH sẽ xác nhận.</p>
      </div>

      <form className="quick-booking-body" onSubmit={handleSubmit}>
        {message && <div className="form-message form-message--success">{message}</div>}
        {error && <div className="form-message form-message--error">{error}</div>}

        <div className="form-grid">
          <label className="form-group">
            Khoa khám
            <select value={departmentId} onChange={handleDepartmentChange}>
              <option value="">Chọn khoa</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName || dept.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-group">
            Ngày khám
            <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
          </label>
        </div>

        {departmentId && (
          <div className="form-grid">
            <label className="form-group">
              Bác sĩ mong muốn
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Chọn bác sĩ (tùy chọn)</option>
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doc) => (
                    <option key={doc.id || doc._id} value={doc.id || doc._id}>
                      {doc.fullName} {doc.specialization ? `- ${doc.specialization}` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Chưa có bác sĩ trong khoa này</option>
                )}
              </select>
            </label>
          </div>
        )}

        <div className="form-grid">
          <label className="form-group">
            Khung giờ
            <select value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-group">
          Triệu chứng lâm sàng / Lý do khám
          <textarea
            rows={5}
            placeholder="Mô tả chi tiết triệu chứng, dấu hiệu hoặc lý do khám để bác sĩ nắm rõ hơn..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
        </button>
      </form>
    </section>
  );
}
