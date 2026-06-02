import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const roleLabels = {
  patient: 'Bệnh nhân',
  doctor: 'Bác sĩ',
  staff: 'CSKH',
  accountant: 'Kế toán',
  admin: 'Quản trị',
};

const navByRole = {
  patient: [
    { label: 'Trang chủ', href: '/' },
    // { label: 'Dashboard', href: '/patient/dashboard' },
  ],
  doctor: [
    { label: 'Dashboard', href: '/doctor/schedule' },
  ],
  staff: [
    { label: 'Dashboard', href: '/staff/dashboard' },
  ],
  accountant: [
    { label: 'Dashboard', href: '/accountant/dashboard' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
  ],
};

export default function RoleTopNav({ role }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.displayName || user?.username || localStorage.getItem('userDisplayName') || 'Người dùng';
  const links = navByRole[role] || [];
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleProfileClick = () => {
    if (role === 'patient') {
      navigate('/patient/dashboard?tab=profile');
    }
  };

  const notifications = [
    {
      title: 'Hóa đơn thanh toán',
      description: 'Bạn có 1 hóa đơn khám chờ thanh toán. Vui lòng kiểm tra mục Hóa đơn & Thanh toán.',
    },
    {
      title: 'Lịch nghỉ phòng khám',
      description: 'Phòng khám nghỉ lễ ngày 30/4 - 01/5, các lịch khám được điều phối lại theo lịch mới.',
    },
    {
      title: 'Chính sách mới',
      description: 'Chính sách bảo mật và điều khoản khám bệnh đã được cập nhật. Hãy đọc lại khi có thời gian.',
    },
  ];

  return (
    <header className="role-topnav">
      <div className="role-topnav__brand">
        <div className="role-topnav__title">Phòng khám đa khoa Hợp Sơn Tài</div>
        <div className="role-topnav__subtitle">{roleLabels[role] || 'Hệ thống'}</div>
      </div>

      <nav className="role-topnav__nav">
        {links.map((item) => (
          <Link key={item.href} to={item.href}>{item.label}</Link>
        ))}
      </nav>

      <div className="role-topnav__user">
        <div
          className="role-topnav__user-info"
          role={role === 'patient' ? 'button' : undefined}
          onClick={handleProfileClick}
          onMouseEnter={() => setPopoverOpen(true)}
          onMouseLeave={() => setPopoverOpen(false)}
          style={role === 'patient' ? { cursor: 'pointer' } : { cursor: 'default' }}
        >
          <div className="role-topnav__avatar p-avatar" aria-hidden="true">{initials || 'U'}</div>
          <span className="role-topnav__name">{displayName}</span>
          <span className="role-topnav__role">{roleLabels[role] || 'Hệ thống'}</span>

          {popoverOpen && (
            <div className="role-topnav__popover" role="tooltip">
              <div className="role-topnav__popover-title">Thông báo phòng khám</div>
              {notifications.map((note, idx) => (
                <div key={idx} className="role-topnav__popover-item">
                  <strong>{note.title}</strong>
                  <p>{note.description}</p>
                </div>
              ))}
              <div className="role-topnav__popover-footer">
                <span>Nhấn vào avatar để mở hồ sơ</span>
              </div>
            </div>
          )}
        </div>
        <button type="button" className="role-topnav__logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>Đăng xuất</button>
      </div>
    </header>
  );
}