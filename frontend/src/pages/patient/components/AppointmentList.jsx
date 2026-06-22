import React from 'react';

const statusConfig = {
  Pending:   { label: 'Awaiting care approval', cls: 'status-pending' },
  Confirmed: { label: 'Confirmed — Please arrive on time', cls: 'status-confirmed' },
  Completed: { label: 'Examination completed', cls: 'status-completed' },
  Canceled:  { label: 'Cancelled', cls: 'status-canceled' },
};

export default function AppointmentList({ appointments = [], onCancel }) {
  return (
    <section className="card patient-appointments">
      <header className="card-title-bar">
        <div>
          <p>Appointments</p>
          <h2>Upcoming appointments</h2>
        </div>
        <span>{appointments.length} items</span>
      </header>

      {appointments.length === 0 ? (
        <div className="patient-empty">You have no appointments yet.</div>
      ) : (
        <div className="appointment-list">
          {appointments.slice(0, 5).map((appointment) => (
            <article key={appointment._id} className="appointment-item">
              <div>
                <p>{new Date(appointment.requestedDate).toLocaleDateString('en-US')}</p>
                <p>{appointment.requestedTime}</p>
                <p>{appointment.departmentId?.departmentName || 'General'}</p>
                {appointment.doctorId?.fullName && <p>Dr. {appointment.doctorId.fullName}</p>}
              </div>
              <div>
                <span className={`status-pill ${statusConfig[appointment.status]?.cls || ''}`}>
                  {statusConfig[appointment.status]?.label || appointment.status}
                </span>
                {appointment.status === 'Pending' && (
                  <button className="btn btn-ghost" type="button" onClick={() => onCancel?.(appointment._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
