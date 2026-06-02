import React from 'react';
import { Navigate } from 'react-router-dom';

const homeByRole = {
  patient: '/patient/dashboard',
  doctor: '/doctor/schedule',
  staff: '/staff/dashboard',
  accountant: '/accountant/dashboard',
  admin: '/admin/dashboard',
};

export default function RoleGuard({ role, children }) {
  const currentRole = localStorage.getItem('userRole');

  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={homeByRole[currentRole] || '/login'} replace />;
  }

  return children;
}