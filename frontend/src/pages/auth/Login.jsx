import React, { useState } from 'react';
import { authAPI } from '../../services/api';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
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
      // Show specific message for invalid credentials (401) otherwise generic
      if (err?.response?.status === 401) {
        setError('Incorrect username or password. Please try again.');
      } else {
        setError(err?.response?.data?.message || 'Login failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-card-new">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="login-brand-title">Hopsontai Clinic</h1>
          <p className="login-brand-sub">Log in to access the management system</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-err-new">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span style={{ flex: 1 }}>{error}</span>
            <button className="login-retry-btn" onClick={() => { setError(''); setPhone(''); setPassword(''); }}>Retry</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Phone */}
          <div className="login-field-new">
            <label htmlFor="login-phone">Phone number</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                id="login-phone"
                className="login-input-new"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field-new">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="login-password"
                className="login-input-new"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn-new" disabled={loading}>
            {loading ? (
              <>
                <span className="cn-spinner" />
                Logging in...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="17" height="17">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Log in
              </>
            )}
          </button>
        </form>

        <a className="login-footer-link" href="/">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </a>
      </div>
    </div>
  );
}
