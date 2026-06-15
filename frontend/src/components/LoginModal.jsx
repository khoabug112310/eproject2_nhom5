import React, { useEffect, useState, useRef } from 'react';
import { authAPI } from '../services/api';
import RegisterModal from './RegisterModal';

export default function LoginModal({ show, onClose }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setPhone('');
      setPassword('');
      setError('');
      // Tự động focus ô nhập số điện thoại khi mở modal
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 50);
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [show, onClose]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 1. Kiểm tra cấu trúc số điện thoại Việt Nam trước khi gửi lên Back-end
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không đúng định dạng. Vui lòng nhập lại (Ví dụ: 0912345678).');
      return; // Dừng lại ở đây, chặn không cho gọi API login
    }

    // 2. Nếu cấu trúc hợp lệ thì mới tiến hành gọi API xử lý đăng nhập
    authAPI.login(phone, password)
      .then((res) => {
        const { token, role, username, displayName } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', role || '');
        localStorage.setItem('userName', username || phone || '');
        localStorage.setItem('userDisplayName', displayName || username || phone || '');
        onClose();
        
        // Điều hướng phân quyền dựa trên Role nhận về
        if (role === 'admin') window.location.href = '/admin/dashboard';
        else if (role === 'doctor') window.location.href = '/doctor/schedule';
        else if (role === 'staff') window.location.href = '/staff/dashboard';
        else if (role === 'accountant') window.location.href = '/accountant/dashboard';
        else window.location.href = '/patient/dashboard';
      })
      .catch((err) => {
        // Luôn hiển thị thông báo tiếng Việt, bỏ qua "Invalid credentials" từ backend
        setError('Số điện thoại hoặc mật khẩu không đúng. Vui lòng kiểm tra và nhập lại!');
        setPassword('');
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-card" 
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px 32px 32px',
          width: '400px',
          maxWidth: '92%',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15), 0 10px 20px -10px rgba(15, 23, 42, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #f1f5f9'
        }}
      >
        
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#94a3b8',
            lineHeight: 1,
            transition: 'color 0.2s',
            outline: 'none',
            padding: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          aria-label="Đóng"
        >
          &times;
        </button>
 
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '800', 
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px'
          }}>
            Đăng Nhập
          </h3>
          <p style={{ 
            fontSize: '13px', 
            color: '#64748b', 
            margin: 0,
            lineHeight: '1.5'
          }}>
            Nhập số điện thoại để truy cập hệ thống khám bệnh trực tuyến
          </p>
        </div>
 
        {/* Khu vực hiển thị thông báo lỗi (Lỗi cấu trúc hoặc sai tài khoản) */}
        {error && (
          <div 
            role="alert" 
            style={{ 
              color: '#b91c1c', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fee2e2', 
              padding: '10px 14px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              fontWeight: '600', 
              marginBottom: '20px',
              lineHeight: '1.4'
            }}
          >
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label 
              htmlFor="login-phone" 
              style={{ 
                fontSize: '13.5px', 
                fontWeight: '700', 
                color: '#334155' 
              }}
            >
              Số Điện Thoại
            </label>
            <input
              id="login-phone"
              type="text" // Đổi từ "tel" sang "text" để Regex kiểm tra chuẩn xác hơn khi nhập chữ
              ref={phoneInputRef}
              placeholder="Nhập số điện thoại của bạn"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label 
              htmlFor="login-password" 
              style={{ 
                fontSize: '13.5px', 
                fontWeight: '700', 
                color: '#334155' 
              }}
            >
              Mật Khẩu
            </label>
            <input
              id="login-password"
              type="password"
              ref={passwordInputRef}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            <button 
              type="submit" 
              style={{
                width: '100%',
                height: '44px',
                background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
              }}
            >
              Đăng Nhập
            </button>

            <button 
              type="button" 
              onClick={() => setShowRegister(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary, #3b82f6)',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'center',
                transition: 'color 0.2s',
                outline: 'none',
                alignSelf: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-secondary, #00a89d)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary, #3b82f6)'}
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </form>
      </div>

      {showRegister && (
        <RegisterModal 
          show={showRegister} 
          onClose={() => {
            setShowRegister(false);
            onClose(); // Đóng modal đăng nhập khi họ hoàn tất đăng ký
          }} 
        />
      )}
    </div>
  );
}