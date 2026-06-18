// Doctor layout (shifts, examinations, prescriptions)
import React from 'react';

export default function DoctorLayout({ children }) {
  return (
    <div className="doctor-layout">
      <aside className="sidebar">
        <nav>
          <h3>Doctor Portal</h3>
          <ul>
            <li><a href="/doctor/schedule">My Schedule</a></li>
            <li><a href="/doctor/appointments">Today Appointments</a></li>
            <li><a href="/doctor/prescriptions">Prescriptions</a></li>
            <li><a href="/doctor/profile">My Profile</a></li>
          </ul>
        </nav>
      </aside>
      <main className="doctor-content">
        <header className="top-bar">
          <h2>Doctor Dashboard</h2>
          <div>Doctor: Dr. Name</div>
        </header>
        {children}
      </main>
    </div>
  );
}
