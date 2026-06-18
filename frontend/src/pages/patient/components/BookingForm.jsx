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
      setError('Please select a department, date, and time.');
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
      setMessage('Appointment booked successfully. Our care team will contact you to confirm.');
      setRequestedDate('');
      setRequestedTime('08:00');
      setSymptoms('');
      setDoctorId('');
      if (onBooked) onBooked();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error booking the appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quick-booking">
      <header className="quick-booking-header card-title-bar">
        <div>
          <p>Quick booking</p>
          <h4>Request a new appointment</h4>
        </div>
      </header>
      <div className="quick-booking-subtitle">
        <p>Choose a department and a convenient time, then our care team will confirm.</p>
      </div>

      <form className="quick-booking-body" onSubmit={handleSubmit}>
        {message && <div className="form-message form-message--success">{message}</div>}
        {error && <div className="form-message form-message--error">{error}</div>}

        <div className="form-grid">
          <label className="form-group">
            Department
            <select value={departmentId} onChange={handleDepartmentChange}>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName || dept.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-group">
            Appointment date
            <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
          </label>
        </div>

        {departmentId && (
          <div className="form-grid">
            <label className="form-group">
              Preferred doctor
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select a doctor (optional)</option>
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doc) => (
                    <option key={doc.id || doc._id} value={doc.id || doc._id}>
                      {doc.fullName} {doc.specialization ? `- ${doc.specialization}` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No doctors in this department yet</option>
                )}
              </select>
            </label>
          </div>
        )}

        <div className="form-grid">
          <label className="form-group">
            Time slot
            <select value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)}>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-group">
          Symptoms / Reason for visit
          <textarea
            rows={5}
            placeholder="Describe your symptoms, signs, or reason for the visit so the doctor can understand better..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Confirm booking'}
        </button>
      </form>
    </section>
  );
}
