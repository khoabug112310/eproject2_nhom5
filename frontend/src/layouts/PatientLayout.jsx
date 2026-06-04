// Layout Bệnh nhân (Dashboard, Lịch sử khám)
import React from 'react';

export default function PatientLayout({ children }) {
  return (
    <div className="patient-layout">
      <aside className="sidebar">
        <nav>
          <h3>Patient Portal</h3>
          <ul>
            <li><a href="/patient/dashboard">Dashboard</a></li>
            <li><a href="/patient/book-appointment">Book Appointment</a></li>
            <li><a href="/patient/appointments">My Appointments</a></li>
            <li><a href="/patient/medical-records">Medical Records</a></li>
            <li><a href="/patient/invoices">Invoices</a></li>
            <li><a href="/patient/profile">My Profile</a></li>
          </ul>
        </nav>
      </aside>
      <main className="patient-content">
        <header className="top-bar">
          <h2>Patient Dashboard</h2>
          <div>Patient: Your Name</div>
        </header>
        {children}
      </main>
    </div>
  );
}
