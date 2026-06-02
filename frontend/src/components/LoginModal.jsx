import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import RegisterModal from './RegisterModal';

export default function LoginModal({ show, onClose, onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(phone, password);
    if (!result.success) {
      setError(result.error || 'Số điện thoại hoặc mật khẩu không đúng');
      return;
    }

    if (onLoginSuccess) {
      await onLoginSuccess();
    }

    onClose();

    const role = result.role;
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'doctor') navigate('/doctor/schedule');
    else if (role === 'staff') navigate('/staff/dashboard');
    else if (role === 'accountant') navigate('/accountant/dashboard');
    else navigate('/patient/dashboard');
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
              type="tel"
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
            onClose(); // Close login modal too when they complete register
          }} 
        />
      )}
    </div>
  );
}