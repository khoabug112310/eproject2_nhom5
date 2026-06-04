import React, { useState, useEffect } from 'react';
import { schedulingAPI, clinicalAPI } from '../services/api';

export default function DoctorScheduleModal({ appointment, onClose, onConfirm, isLoading }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(appointment?.doctorId?._id);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');

  // Load doctors from the same department on mount
  useEffect(() => {
    if (appointment?.departmentId?._id) {
      fetchDoctors();
    }
  }, [appointment]);

  // Load schedules for the selected doctor whenever it changes
  useEffect(() => {
    if (selectedDoctorId && appointment?.requestedDate) {
      fetchSchedule(selectedDoctorId);
    }
  }, [selectedDoctorId, appointment?.requestedDate]);

  const fetchDoctors = async () => {
    try {
      setError('');
      const res = await clinicalAPI.getDoctors({
        department: appointment.departmentId._id,
      });
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Lỗi khi tải danh sách bác sĩ');
    }
  };

  const fetchSchedule = async (doctorId) => {
    try {
      setLoadingSchedules(true);
      setError('');
      const dateStr = new Date(appointment.requestedDate).toISOString().split('T')[0];
      const res = await schedulingAPI.getSchedules(doctorId, dateStr);
      setSchedules(res.data.data || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Lỗi khi tải lịch bác sĩ');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const getCurrentDoctorSchedule = () => {
    if (!appointment?.doctorId?._id) return null;
    const dateStr = new Date(appointment.requestedDate).toISOString().split('T')[0];
    const schedule = schedules.find(
      s => String(s.doctorId) === String(appointment.doctorId._id) &&
        new Date(s.workDate).toISOString().split('T')[0] === dateStr
    );
    return schedule;
  };

  const getSelectedDoctorSchedule = () => {
    if (!selectedDoctorId) return null;
    const dateStr = new Date(appointment.requestedDate).toISOString().split('T')[0];
    const schedule = schedules.find(
      s => String(s.doctorId) === String(selectedDoctorId) &&
        new Date(s.workDate).toISOString().split('T')[0] === dateStr
    );
    return schedule;
  };

  const isDoctorAvailable = (doctorSchedule) => {
    if (!doctorSchedule) return false;
    return doctorSchedule.currentBooked < doctorSchedule.maxPatients;
  };

  const currentSchedule = getCurrentDoctorSchedule();
  const selectedSchedule = getSelectedDoctorSchedule();
  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId);
  const originalDoctor = doctors.find(d => d._id === appointment?.doctorId?._id);

  const canChangeDoctor = selectedDoctorId !== appointment?.doctorId?._id;
  const isNewDoctorAvailable = isDoctorAvailable(selectedSchedule);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Kiểm tra lịch bác sĩ & Đổi bác sĩ</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Appointment Details */}
          <div className="section section--info">
            <h4>Thông tin lịch khám</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Ngày khám:</span>
                <span className="value">{new Date(appointment.requestedDate).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="info-item">
                <span className="label">Giờ khám:</span>
                <span className="value">{appointment.requestedTime}</span>
              </div>
              <div className="info-item">
                <span className="label">Phòng ban:</span>
                <span className="value">{appointment.departmentId?.departmentName}</span>
              </div>
            </div>
          </div>

          {/* Current Doctor Schedule */}
          <div className="section section--current">
            <h4>🔵 Bác sĩ hiện tại</h4>
            {originalDoctor ? (
              <div className="doctor-card">
                <div className="doctor-card__header">
                  <p className="doctor-name"><strong>{originalDoctor.fullName}</strong></p>
                  <p className="doctor-spec">{originalDoctor.specialization}</p>
                </div>
                <div className="doctor-card__body">
                  {currentSchedule ? (
                    <div className="schedule-info">
                      <p className="schedule-time">⏰ {currentSchedule.startTime} - {currentSchedule.endTime}</p>
                      <p className="schedule-capacity">
                        Sức chứa: {currentSchedule.currentBooked}/{currentSchedule.maxPatients}
                        <span className={isDoctorAvailable(currentSchedule) ? 'capacity-available' : 'capacity-full'}>
                          {isDoctorAvailable(currentSchedule) ? '✓ Còn trống' : '✗ Đã kín'}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="no-schedule">Không có lịch làm việc trong ngày này</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted">Chưa chỉ định bác sĩ</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="section section--selection">
            <h4>🔄 Chọn bác sĩ khác (cùng phòng ban)</h4>
            {loadingSchedules ? (
              <p className="text-center">Đang tải...</p>
            ) : (
              <div className="doctor-selector">
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="select-input"
                  disabled={isLoading}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.fullName} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Selected Doctor Schedule */}
          {selectedDoctorId && selectedDoctor && (
            <div className="section section--selected">
              <h4>✓ Bác sĩ được chọn</h4>
              <div className={`doctor-card ${!isNewDoctorAvailable ? 'doctor-card--unavailable' : ''}`}>
                <div className="doctor-card__header">
                  <p className="doctor-name"><strong>{selectedDoctor.fullName}</strong></p>
                  <p className="doctor-spec">{selectedDoctor.specialization}</p>
                </div>
                <div className="doctor-card__body">
                  {selectedSchedule ? (
                    <div className="schedule-info">
                      <p className="schedule-time">⏰ {selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                      <p className="schedule-capacity">
                        Sức chứa: {selectedSchedule.currentBooked}/{selectedSchedule.maxPatients}
                        <span className={isNewDoctorAvailable ? 'capacity-available' : 'capacity-full'}>
                          {isNewDoctorAvailable ? '✓ Còn trống' : '✗ Đã kín'}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="no-schedule warning">⚠ Bác sĩ này không có lịch làm việc trong ngày này</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Note */}
          {canChangeDoctor && (
            <div className="confirmation-note">
              <p className="note-title">📝 Ghi chú:</p>
              <p>
                Bạn sắp thay đổi bác sĩ từ <strong>{originalDoctor?.fullName}</strong> sang <strong>{selectedDoctor?.fullName}</strong>.
                Hãy đảm bảo bác sĩ mới có giờ trống trước khi xác nhận.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(selectedDoctorId)}
            disabled={isLoading || !selectedDoctorId || (canChangeDoctor && !isNewDoctorAvailable)}
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background-color: #f5f5f5;
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 6px;
          border-left: 4px solid #0066cc;
        }

        .section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
        }

        .info-item .label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .info-item .value {
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }

        .section--current {
          border-left-color: #007bff;
        }

        .section--selection {
          border-left-color: #0066cc;
        }

        .section--selected {
          border-left-color: #28a745;
        }

        .doctor-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin: 10px 0;
        }

        .doctor-card--unavailable {
          opacity: 0.6;
          background-color: #fff3cd;
        }

        .doctor-card__header {
          padding: 12px;
          background-color: #f5f7fa;
          border-bottom: 1px solid #e0e0e0;
        }

        .doctor-name {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #333;
        }

        .doctor-spec {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .doctor-card__body {
          padding: 12px;
        }

        .schedule-info {
          font-size: 13px;
        }

        .schedule-time {
          margin: 0 0 8px 0;
          color: #333;
        }

        .schedule-capacity {
          margin: 0;
          color: #666;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .capacity-available {
          color: #28a745;
          font-weight: 600;
          font-size: 12px;
          background-color: #d4edda;
          padding: 2px 8px;
          border-radius: 3px;
        }

        .capacity-full {
          color: #dc3545;
          font-weight: 600;
          font-size: 12px;
          background-color: #f8d7da;
          padding: 2px 8px;
          border-radius: 3px;
        }

        .no-schedule {
          color: #999;
          font-size: 13px;
          margin: 0;
          font-style: italic;
        }

        .no-schedule.warning {
          color: #ff6b6b;
        }

        .doctor-selector {
          margin-top: 10px;
        }

        .select-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .select-input:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .select-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .confirmation-note {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          padding: 12px;
          margin: 15px 0;
        }

        .note-title {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 600;
          color: #856404;
        }

        .confirmation-note p:last-child {
          margin: 0;
          font-size: 13px;
          color: #856404;
          line-height: 1.5;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #e0e0e0;
          background-color: #f9f9f9;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #0066cc;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0052a3;
        }

        .btn-primary:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #d0d0d0;
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .text-muted {
          color: #999;
          font-size: 13px;
        }

        .text-center {
          text-align: center;
          color: #666;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 13px;
        }

        .alert-danger {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
}
