// Layout công khai (Trang chủ, Đăng nhập, Đăng ký)
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import logoImg from '../images/Logo.png';
import hero1 from '../images/hero1.jpg';
import hero2 from '../images/hero2.jpg';
import hero3 from '../images/hero3.jpg';
import HeroSlideshow from './HeroSlideshow';
import LoginModal from '../components/LoginModal';

export default function PublicLayout({ children }) {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <div className="public-layout">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="logo-wrap">
            {/* Put your logo file at frontend/public/logo.png and it will be served at /logo.png */}
            <img src={logoImg} alt="Phòng khám đa khoa Hợp Sơn Tài logo" onError={(e)=>{e.target.style.display='none'}} />
            <div className="text-logo">Phòng Khám Đa Khoa Hợp Sơn Tài</div>
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
            <a className="btn btn-primary btn-quick" href="/booking">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Đặt lịch nhanh
            </a>
          </div>
        </div>
      </div>

      {/* Main header/nav (separated component) */}
      <div className="header-separator" />
      <Header />

      {/* Full-width hero slideshow under the header using images in src/images */}
      <HeroSlideshow images={[hero1, hero2, hero3]} />

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />

      <main className="container">{children}</main>
      <footer>
        <p>&copy; 2025 Clinic. All rights reserved.</p>
      </footer>
    </div>
  );
}
