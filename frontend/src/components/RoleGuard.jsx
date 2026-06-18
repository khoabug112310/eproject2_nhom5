import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const homeByRole = {
  patient: '/patient/dashboard',
  doctor: '/doctor/schedule',
  staff: '/staff/dashboard',
  accountant: '/accountant/dashboard',
  admin: '/admin/dashboard',
};

export default function RoleGuard({ role, children }) {
  const { user } = useAuth();
  const currentRole = user?.role;

  if (!currentRole) {
    return <Navigate to="/?login=true" replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={homeByRole[currentRole] || '/?login=true'} replace />;
  }

  return children;
}