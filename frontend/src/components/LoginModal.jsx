import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import RegisterModal from './RegisterModal';

export default function LoginModal({ show, onClose }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (show) {
      setPhone('');
      setPassword('');
      setError('');
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
        // Bắt lỗi sai tài khoản / mật khẩu từ phía Back-end trả về
        setError(err?.response?.data?.message || 'Số điện thoại hoặc mật khẩu không đúng');
      });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          type="button" 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            lineHeight: 1
          }}
          aria-label="Đóng"
        >
          ×
        </button>

        <div className="modal-header">
          <div className="modal-logo">🔐</div>
          <div className="modal-title">Đăng nhập cổng thông tin</div>
          <div className="modal-subtitle">Chào mừng trở lại! Vui lòng điền thông tin bên dưới</div>
        </div>

        {/* Khu vực hiển thị thông báo lỗi (Lỗi cấu trúc hoặc sai tài khoản) */}
        {error && (
          <div className="inline-alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group-outline">
            <label htmlFor="login-phone">Số điện thoại</label>
            <input
              id="login-phone"
              type="text" // Đổi từ "tel" sang "text" để Regex kiểm tra chuẩn xác hơn khi nhập chữ
              placeholder="Nhập số điện thoại của bạn"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group-outline">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => {
                setShowRegister(true);
              }}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              Chưa có tài khoản? Đăng ký
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontSize: '13px', padding: '8px 12px' }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                Đăng nhập
              </button>
            </div>
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