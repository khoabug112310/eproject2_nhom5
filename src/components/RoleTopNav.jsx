import React from 'react';

const roleLabels = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  staff: 'CSKH',
  accountant: 'Kế toán',
  admin: 'Quản trị',
};

const navByRole = {
  patient: [
    // { label: 'Dashboard', href: '/patient/dashboard' },
    // { label: 'Đặt lịch nhanh', href: '/booking' },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/schedule' },
  ],
  staff: [
    // { label: 'Dashboard', href: '/staff/dashboard' },
  ],
  accountant: [
    { label: 'Dashboard', href: '/accountant/dashboard' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
  ],
};

export default function RoleTopNav({ role }) {
  const displayName = localStorage.getItem('userDisplayName') || localStorage.getItem('userName') || 'Người dùng';
  const links = navByRole[role] || [];
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDisplayName');
    window.location.href = '/';
  };

  return (
    <header className="role-topnav">
      <div className="role-topnav__brand">
        <div className="role-topnav__title">Phòng khám đa khoa Hợp Sơn Tài</div>
        <div className="role-topnav__subtitle">{roleLabels[role] || 'Hệ thống'}</div>
      </div>

      <nav className="role-topnav__nav">
        {links.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
      </nav>

      <div className="role-topnav__user">
        <div className="role-topnav__avatar" aria-hidden="true">{initials || 'U'}</div>
        <span className="role-topnav__name">{displayName}</span>
        <span className="role-topnav__role">{roleLabels[role] || 'Hệ thống'}</span>
        <button type="button" className="role-topnav__logout" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </header>
  );
}