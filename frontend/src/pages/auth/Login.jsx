import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(phone, password);
      if (!result.success) {
        setError(result.error || 'Đăng nhập thất bại');
        return;
      }

      const role = result.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'doctor') navigate('/doctor/schedule');
      else if (role === 'staff') navigate('/staff/dashboard');
      else if (role === 'accountant') navigate('/accountant/dashboard');
      else navigate('/patient/dashboard');
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
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Quay lại</button>
            <button type="submit" className="btn btn-primary">Đăng nhập</button>
          </div>
        </form>
      </div>
    </div>
  );
}