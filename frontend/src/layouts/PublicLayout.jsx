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

// TỚI ĐÂY: Import component đặt lịch nhanh và API cần thiết để cấp dữ liệu cho form
import QuickBooking from '../components/QuickBooking';
import { schedulingAPI, clinicalAPI } from '../services/api';

export default function PublicLayout({ children }) {
  const [showLogin, setShowLogin] = useState(false);
  
  // 1. Tạo state đóng/mở cho Modal đặt lịch nhanh
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // 2. Tạo state lưu trữ dữ liệu bác sĩ và chuyên khoa để truyền vào form
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const location = useLocation();
  const isHome = location.pathname === '/';

  // 3. Gọi dữ liệu sẵn từ API để form luôn có sẵn data khi bật lên
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depRes, docRes] = await Promise.all([
          schedulingAPI.getDepartments(),
          clinicalAPI.getDoctors()
        ]);
        setDepartments(depRes.data?.data || []);
        setDoctors(docRes.data?.data || []);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu cho QuickBooking Modal:", err);
      }
    };
    fetchData();
  }, []);

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
            <button className="btn btn-ghost" onClick={() => setShowLogin(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Đăng nhập
            </button>
            
            {/* 4. SỬA ĐỔI: Bấm nút này sẽ kích hoạt bật Mở Modal đặt lịch */}
            <button className="btn btn-primary btn-quick" onClick={() => setShowBookingModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Đặt lịch nhanh
            </button>
          </div>
        </div>
      </div>

      <div className="header-separator" />
      <Header />

      {/* Full-width hero slideshow */}
      {isHome && (
        <HeroSlideshow images={[hero1, hero2, hero3]}>
          <div className="hero-overlay-container">
            <div className="hero-overlay-content">
              <h1>Chăm sóc sức khỏe tận tâm — đặt lịch nhanh, tiện lợi</h1>
              <p>Đội ngũ bác sĩ chuyên môn cao, trang thiết bị y tế hiện đại, kết hợp tinh hoa Y Học Cổ Truyền và Y Học Hiện Đại. Đặt lịch khám chỉ trong vài bước đơn giản.</p>
              <div className="hero-overlay-ctas">
                
                {/* 5. SỬA ĐỔI: Bấm nút trên Banner cũng bật Mở Modal đặt lịch */}
                <button className="btn btn-primary" onClick={() => setShowBookingModal(true)}>
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

      {/* ========================================================================= */}
      {/* 6. THÊM MỚI: GIAO DIỆN MODAL POPUP ĐẶT LỊCH NHANH CHUYÊN BIỆT */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', // Lớp nền tối mờ phía sau
          backdropFilter: 'blur(4px)',               // Làm mờ nhẹ hậu cảnh
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,                              // Luôn nằm trên cùng mọi thành phần
          padding: '20px'
        }}
        onClick={() => setShowBookingModal(false)} // Bấm ra ngoài rìa để đóng modal
        >
          <div style={{
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '700px',                       // Chiều rộng form vừa vặn, đẹp mắt
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out',
            maxHeight: '90vh',                       // Tránh tràn màn hình điện thoại nhỏ
            overflowY: 'auto'                        // Cho phép cuộn bên trong nếu form dài
          }}
          onClick={(e) => e.stopPropagation()}       // Ngăn sự kiện click bị lan ra ngoài gây đóng modal nhầm
          >
            {/* Nút Đóng (X) đặt ở góc phải */}
            <button 
              onClick={() => setShowBookingModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#64748b',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Tiêu đề Modal */}
            <div style={{ padding: '24px 24px 0 24px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Đăng Ký Khám Bệnh Nhanh
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Vui lòng điền thông tin dưới đây, trợ lý y tế sẽ liên hệ xác nhận ngay.
              </p>
            </div>

            {/* Nội dung Form chính */}
            <div style={{ padding: '24px' }}>
              <QuickBooking
                doctors={doctors}
                departments={departments}
                isInline={true} 
                onSuccess={() => setShowBookingModal(false)} // Tự động đóng khi người dùng đặt thành công
              />
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}

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
    </div>
  );
}