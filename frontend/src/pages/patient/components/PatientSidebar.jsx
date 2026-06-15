import React from 'react';

function maskString(value, visibleStart = 3, visibleEnd = 3) {
  if (!value) return '';
  const s = String(value);
  if (s.length <= visibleStart + visibleEnd) return s.replace(/.(?=.{2})/g, '*');
  const first = s.slice(0, visibleStart);
  const last = s.slice(-visibleEnd);
  const masked = '*'.repeat(Math.max(3, s.length - visibleStart - visibleEnd));
  return `${first}${masked}${last}`;
}

function maskPhone(phone) {
  return maskString(phone, 3, 3);
}

function maskId(id) {
  return maskString(id, 2, 2);
}

export default function PatientSidebar({ patient, invoices = [], onEditPatient }) {
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
          <p className="patient-sidebar__phone">{patient?.phoneNumber ? maskPhone(patient.phoneNumber) : 'Chưa có số điện thoại'}</p>
        </div>

        <div className="patient-sidebar__details">
          <div>
            <span>Ngày sinh</span>
            <strong>{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('vi-VN') : '---'}</strong>
          </div>
          <div>
            <span>Giới tính</span>
            <strong>{patient?.gender || '---'}</strong>
          </div>
          <div>
            <span>CCCD</span>
            <strong>{patient?.identityCard ? maskId(patient.identityCard) : '---'}</strong>
          </div>
          <div>
            <span>Mã BHYT</span>
            <strong>{patient?.insuranceCode ? maskId(patient.insuranceCode) : '---'}</strong>
          </div>
          <div>
            <span>Địa chỉ</span>
            <strong>{patient?.address || '---'}</strong>
          </div>
          {/* removed unpaid count to keep sidebar focused on personal info */}
        </div>
      </section>

      <section className="card patient-sidebar__actions">
        <div className="patient-sidebar__links">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.dispatchEvent(new CustomEvent('toggleBooking'))}
          >
            ➕ Đặt lịch
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('toggleAppointments'))}
          >
            📅 Lịch hẹn
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onEditPatient}
          >
            ✎ Cập nhật thông tin
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('togglePayments'))}
          >
            💳 Hóa đơn ({invoices.length})
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('toggleRecords'))}
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
