import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import RegisterModal from './RegisterModal';

export default function LoginModal({ show, onClose }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (show) {
      setPhone('');
      setPassword('');
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [show, onClose]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    authAPI.login(phone, password)
      .then((res) => {
        const { token, role, username, displayName } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', role || '');
        localStorage.setItem('userName', username || phone || '');
        localStorage.setItem('userDisplayName', displayName || username || phone || '');
        onClose();
        if (role === 'admin') window.location.href = '/admin/dashboard';
        else if (role === 'doctor') window.location.href = '/doctor/schedule';
        else if (role === 'staff') window.location.href = '/staff/dashboard';
        else if (role === 'accountant') window.location.href = '/accountant/dashboard';
        else window.location.href = '/patient/dashboard';
      })
      .catch((err) => {
        alert(err?.response?.data?.message || 'Login failed');
      });
  };

  return (
    <div style={overlayStyle} onMouseDown={onClose} role="dialog" aria-modal="true">
      <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>
        <h3 style={{marginTop:0}}>Đăng nhập</h3>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Số điện thoại</label>
          <input
            style={inputStyle}
            type="tel"
            placeholder="Nhập số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            />

          <label style={labelStyle}>Mật khẩu</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:12}}>
            <div>
              <button type="button" className="btn" onClick={() => setShowRegister(true)}>Đăng ký</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="btn" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary">Đăng nhập</button>
            </div>
          </div>
        </form>
      </div>
      {showRegister && <RegisterModal show={showRegister} onClose={() => setShowRegister(false)} />}
    </div>
  );
}


const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyle = {
  background: '#fff',
  padding: 20,
  borderRadius: 8,
  width: 360,
  maxWidth: '90%',
  boxShadow: '0 6px 24px rgba(0,0,0,0.25)'
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  marginTop: 6,
  marginBottom: 8,
  boxSizing: 'border-box'
};

const labelStyle = { fontSize: 13, marginTop: 8 };
