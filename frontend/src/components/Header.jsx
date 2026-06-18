import React from 'react';
import { useLocation } from 'react-router-dom';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Departments', href: '/departments' },
  { label: 'Doctors', href: '/specialists' },
  { label: 'News', href: '/news' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="site-header compact">
      <nav className="nav">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
