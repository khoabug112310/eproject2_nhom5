// Layout công khai (Trang chủ, Đăng nhập, Đăng ký)
import React, { useEffect, useState } from 'react';
import { useLocation, Outlet, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import logoImg from '../images/Logo.png';
import hero1 from '../images/hero1.jpg';
import hero2 from '../images/hero2.jpg';
import hero3 from '../images/hero3.jpg';
import HeroSlideshow from './HeroSlideshow';
import LoginModal from '../components/LoginModal';
import { authAPI } from '../services/api';
import { useAuth } from '../store/authContext';

export default function PublicLayout() {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { user, token, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  const currentUser = user || (token ? {
    displayName: localStorage.getItem('userDisplayName') || '',
    roleId: { roleName: localStorage.getItem('userRole') || 'patient' },
  } : null);

  // Hàm quét kiểm tra trạng thái login thực tế qua token
const checkAuth = async () => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const res = await authAPI.me();
        const userData = res.data?.data || res.data;
        if (userData) {
          if (!userData.roleId) {
            userData.roleId = { roleName: userData.role || localStorage.getItem('userRole') || 'patient' };
          }
        }
      } catch (err) {
        console.error("Token không hợp lệ hoặc hết hạn", err);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          localStorage.removeItem('token');
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!user) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userDisplayName');
    }
    navigate('/');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#666' }}>⏳ Đang đồng bộ dữ liệu phòng khám...</div>;
  }

  return (
    <div className="public-layout">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <Link to="/" className="logo-wrap" style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
            <img src={logoImg} alt="Phòng khám đa khoa Hợp Sơn Tài logo" onError={(e)=>{e.target.style.display='none'}} />
            <div className="text-logo">Phòng Khám Đa Khoa Hợp Sơn Tài</div>
          </Link>

          <div className="brand">
            <div className="brand-line small">Sở y tế thành phố Hồ Chí Minh</div>
            <div className="brand-line large">Phòng khám y học cổ truyền Thành phố Hồ Chí Minh</div>
            <div className="brand-line small italic">Thân Thiện - Tận Tâm - Hiệu Quả</div>
          </div>

          <div className="top-actions">
            {currentUser ? (
              <div className="user-logged-in" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={currentUser.roleId?.roleName === 'patient' || currentUser.roleId === 'patient' || localStorage.getItem('userRole') === 'patient' ? '/patient/dashboard?tab=profile' : '/patient/dashboard'}
                  className="user-avatar-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#333' }}
                >
                  <div className="p-avatar" style={{ width: 40, height: 40, fontSize: 18, margin: 0 }}>
                    {(currentUser.fullName || currentUser.displayName || localStorage.getItem('userDisplayName') || 'U').charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>{currentUser.fullName || currentUser.displayName || localStorage.getItem('userDisplayName') || 'Bệnh nhân'}</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>Xem hồ sơ</span>
                  </div>
                </Link>
              </div>
            ) : (
              <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Đăng nhập
              </button>
            )}

            <button className="btn btn-primary btn-quick" onClick={() => {
              const bookingEl = document.getElementById('booking-section');
              if (bookingEl) {
                bookingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                // SỬA LỖI ĐƯỜNG DẪN SAI CHÍNH TẢ DẤU XOÀI ĐÔI KHIẾN HỆ THỐNG PHÂN TUYẾN SAI
                navigate('/#booking-section');
              }
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Đặt lịch nhanh
            </button>
          </div>
        </div>
      </div>

      <div className="header-separator" />
      <Header currentUser={currentUser} onLogout={checkAuth} />

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
                <Link className="btn btn-ghost" to="/departments" style={{ color: '#ffffff', borderColor: '#ffffff', textDecoration: 'none' }}>
                  Xem chuyên khoa
                </Link>
              </div>
            </div>
          </div>
        </HeroSlideshow>
      )}

      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} onLoginSuccess={checkAuth} />

      <main className="container">
        <Outlet context={{ checkAuth, currentUser }} />
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div className="footer-column">
            <div className="footer-brand-title">Phòng Khám Hợp Sơn Tài</div>
            <div className="footer-brand-tagline">Thân Thiện - Tận Tâm - Hiệu Quả</div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', lineHeight: '1.6' }}>
              Chúng tôi tự hào mang lại dịch vụ khám chữa bệnh chất lượng tốt nhất, kết hợp tinh túy của Y học cổ truyền Việt Nam và các trang thiết bị chẩn đoán tiên tiến.
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