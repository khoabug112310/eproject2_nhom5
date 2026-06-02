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

export default function PublicLayout({ children }) {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="public-layout">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="logo-wrap" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
            {/* Put your logo file at frontend/public/logo.png and it will be served at /logo.png */}
            <img src={logoImg} alt="Phòng khám đa khoa Hợp Sơn Tài logo" onError={(e)=>{e.target.style.display='none'}} />
            <div className="text-logo">Phòng Khám Hợp Sơn Tài</div>
          </div>

          <div className="brand">
            <div className="brand-line small">Sở y tế thành phố Hồ Chí Minh</div>
            <div className="brand-line large">Phòng khám y học cổ truyền Thành phố Hồ Chí Minh</div>
            <div className="brand-line small italic">Thân Thiện - Tận Tâm - Hiệu Quả</div>
          </div>

          <div className="top-actions">
            <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Đăng nhập
            </button>
            <button className="btn btn-primary btn-quick" onClick={() => {
              const bookingEl = document.getElementById('booking-section');
              if (bookingEl) {
                bookingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                window.location.href = '/#booking-section';
              }
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Đặt lịch nhanh
            </button>
          </div>
        </div>
      </div>

      {/* Main header/nav (separated component) */}
      <div className="header-separator" />
      <Header />

      {/* Full-width hero slideshow with premium text overlay (Homepage only) */}
      {isHome && (
        <HeroSlideshow images={[hero1, hero2, hero3]}>
          <div className="hero-overlay-container">
            <div className="hero-overlay-content">
              <h1>Chăm sóc sức khỏe tận tâm — đặt lịch nhanh, tiện lợi</h1>
              <p>Đội ngũ bác sĩ chuyên môn cao, trang thiết bị y tế hiện đại, kết hợp tinh hoa Y Học Cổ Truyền và Y Học Hiện Đại. Đặt lịch khám chỉ trong vài bước đơn giản.</p>
              <div className="hero-overlay-ctas">
                <button className="btn btn-primary" onClick={() => {
                  const bookingEl = document.getElementById('booking-section');
                  bookingEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}>
                  Đặt lịch ngay
                </button>
                <a className="btn btn-ghost" href="/departments" style={{ color: '#ffffff', borderColor: '#ffffff' }}>
                  Xem chuyên khoa
                </a>
              </div>
            </div>
          </div>
        </HeroSlideshow>
      )}

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />

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
            <div className="footer-info-item">
              <span>📍</span> Địa chỉ: 123 Đường Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh
            </div>
            <div className="footer-info-item">
              <span>📞</span> Hotline đặt lịch: 091-444-4444
            </div>
            <div className="footer-info-item">
              <span>✉️</span> Hỗ trợ: contact@hopsontai.vn
            </div>
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
    </div>
  );
}
