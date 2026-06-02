import React from 'react';
import RoleTopNav from './RoleTopNav';

export default function RoleDashboardShell({ title, subtitle, cards, role }) {
  return (
    <div className="role-dashboard-shell">
      <RoleTopNav role={role} />
      <div className="role-hero">
        <p className="role-kicker">Phòng khám đa khoa Hợp Sơn Tài</p>
        <h1>{title}</h1>
        <p className="role-subtitle">{subtitle}</p>
      </div>

      <div className="role-card-grid">
        {cards.map((card) => (
          <section className="role-card" key={card.title}>
            <div className="role-card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </section>
        ))}
      </div>
    </div>
  );
}