// Layout công khai (Trang chủ, Đăng nhập, Đăng ký)
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

// TỚI ĐÂY: Import component đặt lịch nhanh và API cần thiết để cấp dữ liệu cho form
import QuickBooking from '../components/QuickBooking';
import { schedulingAPI, clinicalAPI } from '../services/api';

export default function PublicLayout({ children }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Check login state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userDisplayName') || localStorage.getItem('userName');
    if (token) {
      setIsLoggedIn(true);
      setUserDisplayName(name || 'Bệnh nhân');
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

  useEffect(() => {
    const handleOpenBooking = () => setShowBooking(true);
    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="public-layout">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="logo-wrap" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            <img src={logoImg} alt="Phòng khám đa khoa Hợp Sơn Tài logo" onError={(e)=>{e.target.style.display='none'}} />
            <div className="text-logo">Phòng Khám Hợp Sơn Tài</div>
          </div>

          <div className="brand">
            <div className="brand-line small">Sở y tế thành phố Hồ Chí Minh</div>
            <div className="brand-line large">Phòng khám y học cổ truyền Thành phố Hồ Chí Minh</div>
            <div className="brand-line small italic">Thân Thiện - Tận Tâm - Hiệu Quả</div>
          </div>

          <div className="top-actions">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  onClick={() => {
                    if (userRole === 'admin') window.location.href = '/admin/dashboard';
                    else if (userRole === 'doctor') window.location.href = '/doctor/schedule';
                    else if (userRole === 'staff') window.location.href = '/staff/dashboard';
                    else if (userRole === 'accountant') window.location.href = '/accountant/dashboard';
                    else window.location.href = '/patient/dashboard';
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    backgroundColor: 'var(--color-primary-light, #eff6ff)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="Đi đến Trang cá nhân"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #3b82f6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-dark, #1e40af)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                    {userDisplayName}
                  </span>
                </div>
                <button 
                  className="btn btn-ghost" 
                  onClick={handleLogout} 
                  style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '50px' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Đăng nhập
                </button>
                <button className="btn btn-primary btn-quick" onClick={() => setShowBooking(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Đặt lịch nhanh
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="header-separator" />
      <Header />

      {/* Full-width hero slideshow */}
      {isHome && (
        <HeroSlideshow images={[hero1, hero2, hero3]}>
          <div className="hero-overlay-container" style={{ padding: '20px 32px' }}>
            <div className="hero-overlay-content" style={{ maxWidth: '600px' }}>
              <h1 style={{ fontSize: '26px', lineHeight: '1.3', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                Chăm sóc sức khỏe tận tâm — đặt lịch nhanh, tiện lợi
              </h1>
              <p style={{ fontSize: '13.5px', opacity: 0.9, lineHeight: '1.5', marginBottom: '16px' }}>
                Đội ngũ bác sĩ chuyên môn cao, trang thiết bị y tế hiện đại, kết hợp tinh hoa Y Học Cổ Truyền và Y Học Hiện Đại. Đặt lịch khám chỉ trong vài bước đơn giản.
              </p>
              <div className="hero-overlay-ctas" style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }} onClick={() => setShowBooking(true)}>
                  Đặt lịch ngay
                </button>
                <a className="btn btn-ghost" href="/departments" style={{ color: '#ffffff', borderColor: '#ffffff', padding: '8px 18px', fontSize: '13px' }}>
                  Xem chuyên khoa
                </a>
              </div>
            </div>
          </div>
        </HeroSlideshow>
      )}

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
      <QuickBookingModal show={showBooking} onClose={() => setShowBooking(false)} />
      <ChatbotWidget />



      <main className="container">{children}</main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="footer-column">
            <div className="footer-brand-title">Phòng Khám Hợp Sơn Tài</div>
            <div className="footer-brand-tagline">Thân Thiện - Tận Tâm - Hiệu Quả</div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', lineHeight: '1.6' }}>
              Chúng tôi tự hào mang lại dịch vụ khám chữa bệnh chất lượng tốt nhất, kết hợp tinh túy của Y học cổ truyền Việt Nam và các trang thiết bị chuẩn đoán tiên tiến.
            </p>
          </div>
          <div className="footer-column">
            <h4>Thông Tin Liên Hệ</h4>
            <div className="footer-info-item"><span>📍</span> Địa chỉ: 123 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh</div>
            <div className="footer-info-item"><span>📞</span> Hotline đặt lịch: 091-444-4444</div>
            <div className="footer-info-item"><span>✉️</span> Hỗ trợ: contact@hopsontai.vn</div>
          </div>
          <div className="footer-column">
            <h4>Giờ Làm Việc</h4>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>Thứ 2 - Chủ Nhật: 7:00 - 20:00</p>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>Khám ngoài giờ hành chính: Có hỗ trợ</p>
            <p style={{ fontSize: '12px', color: 'var(--color-secondary)', marginTop: '12px', fontWeight: 'bold' }}>
              🏥 Trực cấp cứu & tư vấn 24/7
            </p>
          </div>
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Phòng Khám Đa Khoa Hợp Sơn Tài. Bảo lưu mọi quyền.
        </div>
      </footer>

      {/* Back to Top button */}
      <button
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '86px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-secondary, #0f766e) 100%)',
          color: 'white',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => {
          if (showScrollTop) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (showScrollTop) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }
        }}
        title="Lên đầu trang"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  );
}