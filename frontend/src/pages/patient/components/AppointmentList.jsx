import React from 'react';

const statusLabels = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Canceled: 'Canceled',
};

export default function AppointmentList({ appointments = [], onCancel }) {
  return (
    <section className="card patient-appointments">
      <header className="card-title-bar">
        <div>
          <p>Lịch hẹn</p>
          <h2>Lịch khám sắp tới</h2>
        </div>
        <span>{appointments.length} mục</span>
      </header>

      {appointments.length === 0 ? (
        <div className="patient-empty">Bạn chưa có lịch hẹn nào.</div>
      ) : (
        <div className="appointment-list">
          {appointments.slice(0, 5).map((appointment) => (
            <article key={appointment._id} className="appointment-item">
              <div>
                <p>{new Date(appointment.requestedDate).toLocaleDateString('vi-VN')}</p>
                <p>{appointment.requestedTime}</p>
                <p>{appointment.departmentId?.departmentName || 'Khoa chung'}</p>
                {appointment.doctorId?.fullName && <p>BS. {appointment.doctorId.fullName}</p>}
              </div>
              <div>
                <span className="status-pill">{statusLabels[appointment.status] || appointment.status}</span>
                {appointment.status === 'Pending' && (
                  <button className="btn btn-ghost" type="button" onClick={() => onCancel?.(appointment._id)}>
                    Hủy
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
