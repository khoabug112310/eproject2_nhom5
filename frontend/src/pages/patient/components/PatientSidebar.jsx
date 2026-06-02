import React from 'react';

export default function PatientSidebar({ patient, invoices = [] }) {
  const unpaid = invoices.filter((i) => i.status !== 'Paid').length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  return (
    <aside className="patient-sidebar">
      <section className="card patient-sidebar__profile">
        <div className="patient-sidebar__avatar">{(patient?.fullName?.charAt(0) || 'U').toUpperCase()}</div>
        <div>
          <p>{patient?.fullName || 'Khách hàng'}</p>
          <p>{patient?.phoneNumber || 'Chưa có số điện thoại'}</p>
        </div>

        <div className="patient-sidebar__details">
          <div>
            <span>Mã bệnh nhân</span>
            <strong>{patient?._id ? patient._id.substring(0, 6) : '---'}</strong>
          </div>
          <div>
            <span>Ngày sinh</span>
            <strong>{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : '---'}</strong>
          </div>
          <div>
            <span>Giới tính</span>
            <strong>{patient?.gender || '---'}</strong>
          </div>
          <div>
            <span>Địa chỉ</span>
            <strong>{patient?.address || '---'}</strong>
          </div>
          <div>
            <span>Chưa thanh toán</span>
            <strong>{unpaid}</strong>
          </div>
        </div>
      </section>

      <section className="card patient-sidebar__actions">
        <h4>Quick Actions</h4>
        <div className="patient-sidebar__links">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            ➕ Đặt lịch
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('showBilling'));
            }}
          >
            💳 Hóa đơn ({invoices.length})
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => document.getElementById('records')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            📑 Hồ sơ bệnh án
          </button>
        </div>
      </section>

      <section className="card patient-sidebar__support">
        <h4>CSKH</h4>
        <p>Hotline: <strong>1900 6868</strong></p>
        <p>Email: <strong>support@clinic.local</strong></p>
        <div className="patient-sidebar__actions-row">
          <button className="btn btn-ghost" onClick={() => window.location.href = '/contact'}>Gửi yêu cầu</button>
          <button className="btn btn-ghost" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </section>
    </aside>
  );
}
