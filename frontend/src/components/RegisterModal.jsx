import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export default function RegisterModal({ show, onClose }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (show) {
      setStep(1); setPhone(''); setPassword(''); setFullName(''); setDateOfBirth(''); setGender(''); setMessage('');
    }
  }, [show]);

  if (!show) return null;

  const handleCheckPhone = async (e) => {
    e.preventDefault();
    try {
      // Call register with only phone to see backend response
      await authAPI.register({ phone });
      // If it succeeds (unlikely without password) move to next
      setStep(3);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message;
      if (status === 409) {
        // Account exists -> ask for password to activate
        setMessage('Tài khoản đã tồn tại. Vui lòng nhập mật khẩu để kích hoạt.');
        setStep(2);
      } else if (status === 400) {
        // New registration requires full info + password
        setStep(3);
      } else {
        setMessage(msg);
      }
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.register({ phone, password, fullName, dateOfBirth, gender });
      setMessage('Đăng ký thành công.');
      // Optionally auto-login
      const lg = await authAPI.login(phone, password);
      const { token, role, username, displayName } = lg.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role || '');
      localStorage.setItem('userName', username || phone || '');
      localStorage.setItem('userDisplayName', displayName || username || phone || '');
      if (role) {
        onClose();
        // redirect by role
        if (role === 'admin') window.location.href = '/admin/dashboard';
        else if (role === 'doctor') window.location.href = '/doctor/schedule';
        else if (role === 'staff') window.location.href = '/staff/dashboard';
        else if (role === 'accountant') window.location.href = '/accountant/dashboard';
        else window.location.href = '/patient/dashboard';
      }
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div style={overlayStyle} onMouseDown={onClose} role="dialog" aria-modal="true">
      <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>
        <h3 style={{marginTop:0}}>Đăng ký</h3>
        {message && <div style={{color:'red',marginBottom:8}}>{message}</div>}

        {step === 1 && (
          <form onSubmit={handleCheckPhone}>
            <label>Số điện thoại</label>
            <input style={inputStyle} value={phone} onChange={(e)=>setPhone(e.target.value)} required />
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button type="button" className="btn" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary">Tiếp tục</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleActivate}>
            <label>Mật khẩu</label>
            <input style={inputStyle} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button type="button" className="btn" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary">Kích hoạt</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleActivate}>
            <label>Họ và tên</label>
            <input style={inputStyle} value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
            <label>Ngày sinh</label>
            <input style={inputStyle} type="date" value={dateOfBirth} onChange={(e)=>setDateOfBirth(e.target.value)} />
            <label>Giới tính</label>
            <select style={inputStyle} value={gender} onChange={(e)=>setGender(e.target.value)}>
              <option value="">Không chọn</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            <label>Mật khẩu</label>
            <input style={inputStyle} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button type="button" className="btn" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn btn-primary">Hoàn tất đăng ký</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const overlayStyle = { position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999 };
const modalStyle = { background:'#fff',padding:20,borderRadius:8,width:420,maxWidth:'95%',boxShadow:'0 6px 24px rgba(0,0,0,0.25)' };
const inputStyle = { width:'100%',padding:'8px 10px',marginTop:6,marginBottom:8,boxSizing:'border-box' };
