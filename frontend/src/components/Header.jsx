import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header({ currentUser, onLogout }) {
  const navigate = useNavigate();

  // Đọc quyền Role dự phòng từ localStorage để đảm bảo tính chính xác tuyệt đối
  const savedRole = localStorage.getItem('userRole') || '';
  const displayName = currentUser?.fullName || currentUser?.displayName || localStorage.getItem('userDisplayName') || 'Bệnh nhân';

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDisplayName');
    if (onLogout) onLogout(); 
    navigate('/'); 
  };

  // Xác định xem người dùng có phải là bệnh nhân hay không
  const isPatient = 
    currentUser?.role === 'patient' || 
    currentUser?.roleId === 'patient' || 
    currentUser?.roleId?.roleName === 'patient' || 
    savedRole === 'patient';

  return (
    <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 40px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div className="logo">
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0066CC', fontSize: '20px' }}>
          🏥 Phòng Khám Hợp Sơn Tài
        </Link>
      </div>

      <nav className="public-menu" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>TRANG CHỦ</Link>
        <Link to="/departments" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>KHOA</Link>
        <Link to="/specialists" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>BÁC SĨ</Link>
        <Link to="/services" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>DỊCH VỤ</Link>
        <Link to="/posts" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>TIN TỨC</Link>
        <Link to="/contact" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>LIÊN HỆ</Link>
      </nav>

      <div className="auth-buttons">
        {(currentUser || localStorage.getItem('token')) ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to={isPatient ? '/patient/dashboard?tab=profile' : '/patient/dashboard'}
              className="user-avatar-link"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#333' }}
            >
              <div className="p-avatar" style={{ width: 40, height: 40, fontSize: 18, margin: 0 }}>
                {displayName?.charAt(0) || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{displayName}</span>
                <span style={{ fontSize: '12px', color: '#666' }}>Hồ sơ bệnh nhân</span>
              </div>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: '#0066CC', fontWeight: '500', fontSize: '14px' }}>
              👤 Đăng nhập
            </Link>
            <Link to="/?tab=book" style={{ padding: '8px 16px', background: '#00A89D', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}>
              📅 Đặt lịch nhanh
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}