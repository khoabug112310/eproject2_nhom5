import React from 'react';
import NotificationBell from './NotificationBell';

const roleLabels = {
  patient: 'Patient',
  doctor: 'Doctor',
  staff: 'Customer Care',
  accountant: 'Accountant',
  admin: 'Administrator',
};

const navByRole = {
  patient: [],
  doctor: [
    { label: 'Home', href: '/' },
  ],
  staff: [
    { label: 'Dashboard', href: '/staff/dashboard' },
    { label: 'Home', href: '/' },
  ],
  accountant: [
    { label: 'Home', href: '/' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Home', href: '/' },
  ],
};

export default function RoleTopNav({ role }) {
  const displayName = localStorage.getItem('userDisplayName') || localStorage.getItem('userName') || 'User';
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
        <a href="/" className="role-topnav__title" style={{ textDecoration: 'none', color: 'inherit' }}>Hopsontai General Clinic</a>
        <div className="role-topnav__subtitle">{roleLabels[role] || 'System'}</div>
      </div>

      <nav className="role-topnav__nav">
        {links.map((item) => (
          <a key={item.href} href={item.href}>{item.label}</a>
        ))}
      </nav>

      <div className="role-topnav__user">
        {(role === 'patient' || role === 'staff') && <NotificationBell />}
        <div className="role-topnav__avatar" aria-hidden="true">{initials || 'U'}</div>
        <span className="role-topnav__name">{displayName}</span>
        <span className="role-topnav__role">{roleLabels[role] || 'System'}</span>
        <button type="button" className="role-topnav__logout" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}