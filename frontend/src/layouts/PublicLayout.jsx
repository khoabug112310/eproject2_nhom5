// Public layout (homepage, login, register)
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import logoImg from '../images/Logo.png';
import hero1 from '../images/hero1.jpg';
import hero2 from '../images/hero2.jpg';
import hero3 from '../images/hero3.jpg';
import HeroSlideshow from './HeroSlideshow';
import LoginModal from '../components/LoginModal';
import QuickBookingModal from '../components/QuickBookingModal';
import ChatbotWidget from '../components/ChatbotWidget';

export default function PublicLayout({ children }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState({ doctorId: '', departmentId: '' });
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userDisplayName') || localStorage.getItem('userName');
    if (token) {
      setIsLoggedIn(true);
      setUserDisplayName(name || 'Patient');
      setUserRole(role || 'patient');
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDisplayName');
    window.location.href = '/';
  };

  const goToDashboard = () => {
    const dest = {
      admin: '/admin/dashboard',
      doctor: '/doctor/schedule',
      staff: '/staff/dashboard',
      accountant: '/accountant/dashboard',
    }[userRole] || '/patient/dashboard';
    window.location.href = dest;
  };

  useEffect(() => {
    const handleOpenBooking = (e) => {
      const { doctorId = '', departmentId = '' } = e.detail || {};
      setBookingPrefill({ doctorId, departmentId });
      setShowBooking(true);
    };
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="public-layout">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="logo-wrap" style={{ cursor: 'pointer' }} onClick={() => (window.location.href = '/')}>
            <img src={logoImg} alt="Hopsontai Clinic logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="text-logo">Hopsontai Clinic</div>
          </div>

          <div className="brand">
            <div className="brand-line small">Ho Chi Minh City Department of Health</div>
            <div className="brand-line large">Hopsontai General &amp; Traditional Medicine Clinic</div>
            <div className="brand-line small italic">Friendly · Dedicated · Effective</div>
          </div>

          <div className="top-actions">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  onClick={goToDashboard}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    padding: '6px 14px', borderRadius: '50px',
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid rgba(13, 148, 136, 0.2)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.2)'; }}
                  title="Go to my dashboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {userDisplayName}
                  </span>
                </div>
                <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '50px' }}>
                  Log out
                </button>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Log in
                </button>
                <button className="btn btn-primary btn-quick" onClick={() => {
                  setBookingPrefill({ doctorId: '', departmentId: '' });
                  setShowBooking(true);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Quick Booking
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Header />

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
      <QuickBookingModal 
        show={showBooking} 
        onClose={() => {
          setShowBooking(false);
          setBookingPrefill({ doctorId: '', departmentId: '' });
        }} 
        initialDoctorId={bookingPrefill.doctorId}
        initialDepartmentId={bookingPrefill.departmentId}
      />
      <ChatbotWidget />

      <main className="container">
        {/* Full-width hero slideshow on the homepage */}
        {isHome && (
          <HeroSlideshow images={[hero1, hero2, hero3]}>
            <div className="hero-overlay-container" style={{ padding: '20px 32px' }}>
              <div className="hero-overlay-content" style={{ maxWidth: '600px' }}>
                <h1 style={{ fontSize: '30px', lineHeight: '1.25', marginBottom: '10px', textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>
                  Compassionate healthcare — book your visit in just a few clicks
                </h1>
                <p style={{ fontSize: '14px', opacity: 0.92, lineHeight: '1.6', marginBottom: '18px' }}>
                  Highly qualified physicians, modern medical equipment, and the combined strengths of traditional and modern medicine. Schedule an appointment in a few simple steps.
                </p>
                <div className="hero-overlay-ctas" style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={() => {
                    setBookingPrefill({ doctorId: '', departmentId: '' });
                    setShowBooking(true);
                  }}>
                    Book Now
                  </button>
                  <a className="btn btn-ghost" href="/departments" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', padding: '10px 20px' }}>
                    View Departments
                  </a>
                </div>
              </div>
            </div>
          </HeroSlideshow>
        )}
        {children}
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="footer-column">
            <div className="footer-brand-title">Hopsontai Clinic</div>
            <div className="footer-brand-tagline">Friendly · Dedicated · Effective</div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', lineHeight: '1.6' }}>
              We take pride in delivering the highest quality medical care, combining the essence of Vietnamese traditional medicine with advanced diagnostic technology.
            </p>
          </div>
          <div className="footer-column">
            <h4>Contact Information</h4>
            <div className="footer-info-item"><span>📍</span> Address: 123 Nguyen Trai Street, District 5, Ho Chi Minh City</div>
            <div className="footer-info-item"><span>📞</span> Booking hotline: 091-444-4444</div>
            <div className="footer-info-item"><span>✉️</span> Support: contact@hopsontai.vn</div>
          </div>
          <div className="footer-column">
            <h4>Working Hours</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>Monday – Sunday: 7:00 AM – 8:00 PM</p>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>After-hours visits: Available on request</p>
            <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '12px', fontWeight: 'bold' }}>
              🏥 Emergency &amp; consultation on duty 24/7
            </p>
          </div>
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Hopsontai General Clinic. All rights reserved.
        </div>
      </footer>

      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed', bottom: '30px', right: '86px', width: '46px', height: '46px',
          borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          color: 'white', border: 'none', outline: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, opacity: showScrollTop ? 1 : 0, transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: showScrollTop ? 'auto' : 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
}
