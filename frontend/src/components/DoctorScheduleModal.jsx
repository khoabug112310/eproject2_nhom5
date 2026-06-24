import React, { useState, useEffect } from 'react';
import { schedulingAPI, clinicalAPI } from '../services/api';

export default function DoctorScheduleModal({ appointment, onClose, onConfirm, isLoading }) {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');

  const getLocalYYYYMMDDStr = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form states for reassigning
  const [checkDate, setCheckDate] = useState(
    appointment?.requestedDate
      ? getLocalYYYYMMDDStr(appointment.requestedDate)
      : getLocalYYYYMMDDStr(new Date())
  );
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(appointment?.requestedTime || '08:00 - 09:00');

  // Load doctors from same department on mount
  useEffect(() => {
    if (appointment?.departmentId?._id) {
      fetchDoctors();
    }
  }, [appointment]);

  // Load schedules whenever checkDate changes
  useEffect(() => {
    if (checkDate) {
      fetchSchedules();
    }
  }, [checkDate]);

  const fetchDoctors = async () => {
    try {
      setError('');
      const res = await clinicalAPI.getDoctors({
        department: appointment.departmentId._id,
      });
      setDoctors(res.data.data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Error loading the doctor list.');
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      setError('');
      // Fetch all schedules for this date
      const res = await schedulingAPI.getSchedules(undefined, checkDate);
      setSchedules(res.data.data || []);
      // Reset selected schedule if date changes
      setSelectedScheduleId('');
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Error loading schedules for the selected date.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Find the selected schedule object
  const selectedScheduleObj = schedules.find(s => s._id === selectedScheduleId);
  const selectedDocObj = selectedScheduleObj
    ? doctors.find(d => d._id === selectedScheduleObj.doctorId)
    : null;

  // Filter schedules to only show department doctors and optionally apply doctor filter
  const departmentDocIds = doctors.map(d => d._id);
  const filteredShifts = schedules.filter(s => {
    const matchesDept = departmentDocIds.includes(s.doctorId);
    const matchesDoc = !filterDoctorId || s.doctorId === filterDoctorId;
    return matchesDept && matchesDoc;
  });

  const handleConfirmReassign = () => {
    if (!selectedScheduleObj) return;
    onConfirm({
      doctorId: selectedScheduleObj.doctorId,
      scheduleId: selectedScheduleObj._id,
      requestedDate: checkDate,
      requestedTime: selectedTimeSlot,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Check Doctor Schedules &amp; Transfer</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Current Appointment info */}
          <div className="section section--info" style={{ background: '#f8fafc', borderLeft: '4px solid var(--color-primary)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 13, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Current Appointment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13 }}>
              <div><strong>Patient:</strong> {appointment?.patientId?.fullName || 'Guest'}</div>
              <div><strong>Original Date:</strong> {appointment?.requestedDate ? new Date(appointment.requestedDate).toLocaleDateString('en-US') : '—'}</div>
              <div><strong>Original Time:</strong> {appointment?.requestedTime || '—'}</div>
              <div><strong>Original Doctor:</strong> {appointment?.doctorId ? `Dr. ${appointment.doctorId.fullName}` : 'Not Assigned'}</div>
            </div>
          </div>

          {/* Search/Filters bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', background: 'var(--color-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Check Date</label>
              <input
                type="date"
                value={checkDate}
                onChange={e => setCheckDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13 }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Filter Doctor</label>
              <select
                value={filterDoctorId}
                onChange={e => setFilterDoctorId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13 }}
              >
                <option value="">All Doctors in Department</option>
                {doctors.map(doc => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.fullName} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shifts results */}
          <div className="section" style={{ borderLeft: '4px solid var(--color-info)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Available shifts on {new Date(checkDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
            
            {loadingSchedules ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading working shifts...</div>
            ) : filteredShifts.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0', fontSize: 13 }}>
                No active schedules or matching shifts found on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredShifts.map(s => {
                  const docInfo = doctors.find(d => d._id === s.doctorId);
                  const isFull = (s.currentBooked || 0) >= (s.maxPatients || 0);
                  const isSelected = selectedScheduleId === s._id;
                  
                  return (
                    <div
                      key={s._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? '#f0fdfa' : isFull ? '#fffbeb' : '#fff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 14, color: 'var(--color-text-dark)' }}>
                          Dr. {docInfo?.fullName || 'Unknown Doctor'}
                        </strong>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          ⏰ {s.startTime} - {s.endTime} | 👥 Booked: {s.currentBooked || 0} / {s.maxPatients || 0}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`badge ${isFull ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: 11 }}>
                          {isFull ? 'Full / Closed' : 'Available'}
                        </span>
                        <button
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ padding: '4px 10px', fontSize: 12, minWidth: 70 }}
                          onClick={() => setSelectedScheduleId(s._id)}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time slot & Confirmation section */}
          {selectedScheduleObj && selectedDocObj && (
            <div style={{ marginTop: 20, padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: 'var(--color-success-dark)' }}>Confirm reassignment Details</h4>
              
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-body)' }}>Reschedule Time Slot *</label>
                  <input
                    type="text"
                    value={selectedTimeSlot}
                    onChange={e => setSelectedTimeSlot(e.target.value)}
                    placeholder="e.g. 08:30 - 09:30"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      background: 'var(--color-surface)'
                    }}
                    required
                  />
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                📝 Rescheduling appointment to <strong>Dr. {selectedDocObj.fullName}</strong> on <strong>{new Date(checkDate).toLocaleDateString('en-US')}</strong> at <strong>{selectedTimeSlot}</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmReassign}
            disabled={isLoading || !selectedScheduleId || !selectedTimeSlot}
          >
            {isLoading ? 'Processing...' : 'Confirm Transfer'}
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
