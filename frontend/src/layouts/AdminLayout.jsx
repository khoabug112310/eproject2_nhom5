// Admin layout (manages the whole system)
import React from 'react';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <nav>
          <h3>Admin Panel</h3>
          <ul>
            <li><a href="/admin/dashboard">Dashboard</a></li>
            <li><a href="/admin/users">Users</a></li>
            <li><a href="/admin/departments">Departments</a></li>
            <li><a href="/admin/medicines">Medicines</a></li>
            <li><a href="/admin/settings">Settings</a></li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <header className="top-bar">
          <h2>Admin Dashboard</h2>
          <div>User: Admin</div>
        </header>
        {children}
      </main>
    </div>
  );
}
