import React, { useEffect, useState, useRef } from 'react';
import { authAPI } from '../services/api';
import RegisterModal from './RegisterModal';

export default function LoginModal({ show, onClose }) {
  // Existing state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  // New state for forgot password flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const forgotPhoneRef = useRef(null);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (show) {
      setPhone('');
      setPassword('');
      setError('');
      setSuccess('');
      setShowForgot(false);
      setForgotPhone('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotError('');
      setForgotSuccess('');
      setForgotStep(1);
      setOtpArray(['', '', '', '', '', '']);
      setIsSendingOtp(false);
      setIsResetting(false);
      setCountdown(0);
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 50);
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [show, onClose]);

  if (!show) return null;

  const handleSendOtp = async () => {
    if (isSendingOtp) return;
    if (!forgotPhone) {
      setForgotError('Please enter your phone number or email.');
      return;
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneRegex.test(forgotPhone) && !emailRegex.test(forgotPhone)) {
      setForgotError('Invalid phone number or email format. Please check and try again.');
      return;
    }
    setIsSendingOtp(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const response = await authAPI.forgotPassword(forgotPhone);
      setOtpArray(['', '', '', '', '', '']);
      setOtpCode('');
      setForgotStep(2);
      setForgotError('');
      
      setForgotSuccess(response?.data?.message || 'OTP verification code has been sent.');
      
      setCountdown(60); // Đặt thời gian đếm ngược 60 giây
      // Auto focus first OTP input box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setForgotError(err?.response?.data?.message || 'Failed to send OTP code. Please check your phone number or email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (value, index) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtpArray = [...otpArray];
    newOtpArray[index] = value;
    setOtpArray(newOtpArray);

    // Automatically focus next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        // Move to previous box if current is empty
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setOtpArray(chars);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const codeValue = otpArray.join('');
    if (codeValue.length !== 6) {
      setForgotError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setForgotError('');
    setForgotSuccess('');
    try {
      await authAPI.verifyOtp(forgotPhone, codeValue);
      setOtpCode(codeValue);
      setForgotStep(3);
      setForgotError('');
    } catch (err) {
      setForgotError(err?.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    if (isResetting) return;
    if (!newPassword || !confirmPassword) {
      setForgotError('Please fill in your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setIsResetting(true);
    setForgotError('');
    try {
      await authAPI.resetPassword(forgotPhone, otpCode, newPassword);
      setForgotPhone('');
      setOtpCode('');
      setOtpArray(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setForgotError('');
      setForgotSuccess('');
      setForgotStep(1);
      
      // Go to login view immediately & show success alert
      setShowForgot(false);
      setSuccess('Password reset successfully! Please log in with your new password.');
      setError('');
    } catch (err) {
      setForgotError(err?.response?.data?.message || 'Failed to reset password. Please verify your OTP code.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneRegex.test(phone) && !emailRegex.test(phone)) {
      setError('Invalid phone number or email format. Please check and try again.');
      return;
    }

    authAPI.login(phone, password)
      .then((res) => {
        const { token, role, username, displayName, userId } = res.data.data;
        const prefix = (role === 'patient') ? '' : 'portal_';
        localStorage.setItem(`${prefix}token`, token);
        localStorage.setItem(`${prefix}userRole`, role || '');
        localStorage.setItem(`${prefix}userName`, username || phone || '');
        localStorage.setItem(`${prefix}userDisplayName`, displayName || username || phone || '');
        localStorage.setItem(`${prefix}userId`, userId || '');
        onClose();
        
        if (role === 'admin') window.location.href = '/admin/dashboard';
        else if (role === 'doctor') window.location.href = '/doctor/schedule';
        else if (role === 'staff') window.location.href = '/staff/dashboard';
        else if (role === 'accountant') window.location.href = '/accountant/dashboard';
        else {
          const path = window.location.pathname;
          if (path.startsWith('/specialists') || path === '/' || path.startsWith('/news') || path.startsWith('/departments') || path.startsWith('/contact') || path.startsWith('/about')) {
            window.location.reload();
          } else {
            window.location.href = '/patient/dashboard';
          }
        }
      })
      .catch((err) => {
        setError('Incorrect phone number/email or password. Please try again!');
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
          aria-label="Close"
        >
          &times;
        </button>
 
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            {showForgot ? 'Reset Password' : 'Log In'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
            {showForgot ? 'Enter your details to recover your account' : 'Enter your phone number or email to access the online clinic system'}
          </p>
        </div>
 
        {error && (
          <div role="alert" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', lineHeight: '1.4' }}>
            {error}
          </div>
        )}

        {success && (
          <div role="alert" style={{ color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {showForgot ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Step Stepper Progress Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '0 10px 10px 10px' }}>
              {/* Progress track line */}
              <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', backgroundColor: '#e2e8f0', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '15px', left: 0, width: forgotStep === 1 ? '0%' : forgotStep === 2 ? '50%' : '100%', height: '2px', backgroundColor: 'var(--color-primary, #3b82f6)', transition: 'width 0.3s ease', zIndex: 1 }} />
              
              {/* Step 1 dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: forgotStep >= 1 ? 'var(--color-primary, #3b82f6)' : '#ffffff', border: `2px solid ${forgotStep >= 1 ? 'var(--color-primary, #3b82f6)' : '#94a3b8'}`, color: forgotStep >= 1 ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', transition: 'all 0.3s ease', boxShadow: forgotStep === 1 ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none' }}>
                  {forgotStep > 1 ? '✓' : '1'}
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '600', color: forgotStep >= 1 ? '#0f172a' : '#94a3b8', marginTop: '6px', transition: 'all 0.3s ease' }}>Phone/Email</span>
              </div>

              {/* Step 2 dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: forgotStep >= 2 ? 'var(--color-primary, #3b82f6)' : '#ffffff', border: `2px solid ${forgotStep >= 2 ? 'var(--color-primary, #3b82f6)' : '#e2e8f0'}`, color: forgotStep >= 2 ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', transition: 'all 0.3s ease', boxShadow: forgotStep === 2 ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none' }}>
                  {forgotStep > 2 ? '✓' : '2'}
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '600', color: forgotStep >= 2 ? '#0f172a' : '#94a3b8', marginTop: '6px', transition: 'all 0.3s ease' }}>Verify OTP</span>
              </div>

              {/* Step 3 dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: forgotStep >= 3 ? 'var(--color-primary, #3b82f6)' : '#ffffff', border: `2px solid ${forgotStep >= 3 ? 'var(--color-primary, #3b82f6)' : '#e2e8f0'}`, color: forgotStep >= 3 ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', transition: 'all 0.3s ease', boxShadow: forgotStep === 3 ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none' }}>
                  3
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '600', color: forgotStep >= 3 ? '#0f172a' : '#94a3b8', marginTop: '6px', transition: 'all 0.3s ease' }}>Reset</span>
              </div>
            </div>

            {forgotSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="forgot-phone" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>Phone number or Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input id="forgot-phone" type="text" ref={forgotPhoneRef} placeholder="Enter your registered phone number or email" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', backgroundColor: '#ffffff', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {forgotError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  disabled={isSendingOtp}
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    background: isSendingOtp ? '#94a3b8' : 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)', 
                    color: 'white', 
                    border: 'none', 
                    fontWeight: '700', 
                    fontSize: '14px', 
                    borderRadius: '10px', 
                    cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSendingOtp ? 'Sending code...' : 'Send Code'}
                </button>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="otp-box-0" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>OTP Verification Code <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-box-${index}`}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onPaste={handleOtpPaste}
                        style={{
                          width: '46px',
                          height: '46px',
                          textAlign: 'center',
                          fontSize: '20px',
                          fontWeight: '700',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          color: '#0f172a',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary, #3b82f6)'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '13px' }}>
                  {countdown > 0 ? (
                    <span style={{ color: '#64748b' }}>Resend code in {countdown} seconds</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #3b82f6)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        padding: '4px'
                      }}
                    >
                      Resend OTP code
                    </button>
                  )}
                </div>
                {forgotError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => { setForgotStep(1); setForgotError(''); setForgotSuccess(''); setOtpArray(['', '', '', '', '', '']); setOtpCode(''); }} style={{ flex: 1, height: '44px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: '700', fontSize: '14px', borderRadius: '10px', cursor: 'pointer' }}>Back</button>
                  <button type="button" onClick={handleVerifyOtp} style={{ flex: 1, height: '44px', background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)', color: 'white', border: 'none', fontWeight: '700', fontSize: '14px', borderRadius: '10px', cursor: 'pointer' }}>Continue</button>
                </div>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="new-password" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>New password <span style={{ color: '#ef4444' }}>*</span></label>
                  <input id="new-password" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', backgroundColor: '#ffffff', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="confirm-password" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>Confirm new password <span style={{ color: '#ef4444' }}>*</span></label>
                  <input id="confirm-password" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', backgroundColor: '#ffffff', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {forgotError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}
                <div>
                  <button 
                    type="button" 
                    onClick={handleResetPassword} 
                    disabled={isResetting}
                    style={{ 
                      width: '100%', 
                      height: '44px', 
                      background: isResetting ? '#94a3b8' : 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)', 
                      color: 'white', 
                      border: 'none', 
                      fontWeight: '700', 
                      fontSize: '14px', 
                      borderRadius: '10px', 
                      cursor: isResetting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isResetting ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
            <button 
              type="button" 
              onClick={() => { 
                setShowForgot(false); 
                setForgotPhone(''); 
                setOtpCode(''); 
                setNewPassword(''); 
                setConfirmPassword(''); 
                setForgotError(''); 
                setForgotSuccess(''); 
                setForgotStep(1); 
                setError('');
                setSuccess('');
              }} 
              disabled={isSendingOtp || isResetting}
              style={{ 
                marginTop: '10px', 
                background: 'none', 
                border: 'none', 
                color: (isSendingOtp || isResetting) ? '#cbd5e1' : '#64748b', 
                cursor: (isSendingOtp || isResetting) ? 'not-allowed' : 'pointer', 
                fontSize: '13px' 
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="login-phone" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>Phone number or Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="login-phone" type="text" ref={phoneInputRef} placeholder="Enter phone number or email" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', backgroundColor: '#ffffff', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="login-password" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="login-password" type="password" ref={passwordInputRef} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#0f172a', backgroundColor: '#ffffff', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px', alignItems: 'center' }}>
              <button type="submit" style={{ width: '100%', height: '44px', background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)', color: 'white', border: 'none', fontWeight: '700', fontSize: '14px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)', transition: 'all 0.25s ease' }}>Log In</button>
              <button type="button" onClick={() => setShowRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--color-primary, #3b82f6)', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', padding: '4px 0' }}>Don't have an account? Sign up now</button>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setError('');
                  setSuccess('');
                  setForgotStep(1);
                  setOtpArray(['', '', '', '', '', '']);
                  setOtpCode('');
                  setForgotPhone('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary, #3b82f6)', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', padding: '4px 0' }}
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}
      </div>

      {showRegister && (
        <RegisterModal 
          show={showRegister} 
          onClose={() => {
            setShowRegister(false);
            onClose();
          }} 
        />
      )}
    </div>
  );
}