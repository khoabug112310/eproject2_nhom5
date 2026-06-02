import React, { useState } from 'react';
import { authAPI } from '../../services/api';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authAPI.login(phone, password);
      const { token, role, username, displayName } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role || '');
      localStorage.setItem('userName', username || phone || '');
      localStorage.setItem('userDisplayName', displayName || username || phone || '');
      if (role === 'admin') window.location.href = '/admin/dashboard';
      else if (role === 'doctor') window.location.href = '/doctor/schedule';
      else if (role === 'staff') window.location.href = '/staff/dashboard';
      else if (role === 'accountant') window.location.href = '/accountant/dashboard';
      else window.location.href = '/patient/dashboard';
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="role-dashboard-shell">
      <div className="role-hero" style={{maxWidth: 520, margin: '40px auto'}}>
        <p className="role-kicker">Đăng nhập hệ thống</p>
        <h1>Nhập số điện thoại và mật khẩu</h1>
        <p className="role-subtitle">Dùng tài khoản theo số điện thoại để đi vào đúng khu vực bệnh nhân, CSKH, kế toán, bác sĩ hoặc admin.</p>

        <form onSubmit={handleSubmit} style={{marginTop: 20}}>
          <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:6}}>Số điện thoại</label>
          <input
            className="login-input"
            type="tel"
            placeholder="Nhập số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:6,marginTop:12}}>Mật khẩu</label>
          <input
            className="login-input"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div style={{marginTop:12,color:'#b42318',fontSize:14}}>{error}</div>}

          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
            <a className="btn btn-ghost" href="/">Quay lại</a>
            <button type="submit" className="btn btn-primary">Đăng nhập</button>
          </div>
        </form>
      </div>
    </div>
  );
}
