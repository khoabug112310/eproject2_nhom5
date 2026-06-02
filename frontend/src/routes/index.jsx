// Routing setup với React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import RoleGuard from '../components/RoleGuard';
import AccountantDashboard from '../pages/accountant/Dashboard';

// Public Pages
import Home from '../pages/public/Home';
import Departments from '../pages/public/Departments';
import Specialists from '../pages/public/Specialists';
import Services from '../pages/public/Services';
import Posts from '../pages/public/Posts';
import Contact from '../pages/public/Contact';

// Patient Pages
import PatientDashboard from '../pages/patient/Dashboard';

// Doctor Pages
import DoctorSchedule from '../pages/doctor/Schedule';

// Staff Pages
import StaffDashboard from '../pages/staff/Dashboard';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/departments"
          element={
            <PublicLayout>
              <Departments />
            </PublicLayout>
          }
        />
        <Route
          path="/specialists"
          element={
            <PublicLayout>
              <Specialists />
            </PublicLayout>
          }
        />
        <Route
          path="/services"
          element={
            <PublicLayout>
              <Services />
            </PublicLayout>
          }
        />
        <Route
          path="/news"
          element={
            <PublicLayout>
              <Posts />
            </PublicLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />


        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <RoleGuard role="patient">
              <PatientDashboard />
            </RoleGuard>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/schedule"
          element={
            <RoleGuard role="doctor">
              <DoctorSchedule />
            </RoleGuard>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <RoleGuard role="staff">
              <StaffDashboard />
            </RoleGuard>
          }
        />

        {/* Accountant Routes */}
        <Route
          path="/accountant/dashboard"
          element={
            <RoleGuard role="accountant">
              <AccountantDashboard />
            </RoleGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard role="admin">
              <AdminDashboard />
            </RoleGuard>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
