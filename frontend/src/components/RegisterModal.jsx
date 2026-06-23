import React, { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

export default function RegisterModal({ show, onClose }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (show) {
      setStep(1); 
      setPhone(''); 
      setPassword(''); 
      setConfirmPassword('');
      setFullName(''); 
      setDateOfBirth(''); 
      setGender(''); 
      setEmail('');
      setMessage('');
      setIsError(false);
    }
  }, [show]);

  if (!show) return null;

  // DOB Limits for age 18 to 100
  const today = new Date();
  const maxYear = today.getFullYear() - 18;
  const minYear = today.getFullYear() - 100;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const maxDate = `${maxYear}-${month}-${day}`;
  const minDate = `${minYear}-${month}-${day}`;

  const handleCheckPhone = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    try {
      // Call register with only phone to check status
      await authAPI.register({ phone });
      // If it succeeds (which is rare without other info), go to info step
      setStep(3);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message;
      const existingName = err?.response?.data?.data?.fullName || '';
      if (status === 409) {
        // Account exists in profiles but is not active
        if (existingName) {
          setMessage(`Hello ${existingName}, this phone number already exists in our patient records. Please set a new password to activate your online account.`);
        } else {
          setMessage('This phone number already exists in our patient records. Please set a new password to activate your online account.');
        }
        setStep(2);
      } else if (status === 400) {
        // New registration required
        setStep(3);
      } else {
        setMessage(msg);
        setIsError(true);
      }
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // Validate password match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please check again.');
      setIsError(true);
      return;
    }

    // Validate age for step 3 registration
    if (step === 3) {
      if (!dateOfBirth) {
        setMessage('Please select your date of birth.');
        setIsError(true);
        return;
      }

      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      const dayDiff = today.getDate() - dobDate.getDate();
      
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (age < 18) {
        setMessage('Registration failed. You must be at least 18 years old.');
        setIsError(true);
        return;
      }

      if (age > 100) {
        setMessage('Registration failed. Invalid date of birth (age must be under 100).');
        setIsError(true);
        return;
      }

      if (!gender) {
        setMessage('Registration failed. Please select your gender.');
        setIsError(true);
        return;
      }
    }

    try {
      const res = await authAPI.register({ phone, password, fullName, dateOfBirth, gender, email });
      setMessage('Account registered successfully.');
      // Auto login after registration
      const lg = await authAPI.login(phone, password);
      const { token, role, username, displayName } = lg.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role || '');
      localStorage.setItem('userName', username || phone || '');
      localStorage.setItem('userDisplayName', displayName || username || phone || '');
      
      onClose();
      // redirect by role
      if (role === 'admin') window.location.href = '/admin/dashboard';
      else if (role === 'doctor') window.location.href = '/doctor/schedule';
      else if (role === 'staff') window.location.href = '/staff/dashboard';
      else if (role === 'accountant') window.location.href = '/accountant/dashboard';
      else window.location.href = '/patient/dashboard';
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message);
      setIsError(true);
    }
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
          aria-label="Close"
        >
          ×
        </button>

        <div className="modal-header">
          <div className="modal-title">Create an account</div>
          <div className="modal-subtitle">Sign up to book appointments and track your medical records</div>
        </div>

        {/* Stepper Progress bar */}
        <div className="register-stepper">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <div className={`step-indicator ${step === 3 ? 'active' : ''}`}>
            3
          </div>
        </div>

        {message && (
          <div className={`inline-alert ${isError ? '' : 'success'}`}>
            <span>{isError ? '⚠️' : '✓'}</span> {message}
          </div>
        )}

        {/* STEP 1: Phone number validation */}
        {step === 1 && (
          <form onSubmit={handleCheckPhone}>
            <div className="form-group-outline">
              <label htmlFor="reg-phone">Phone number</label>
              <input
                id="reg-phone"
                type="tel"
                placeholder="Enter your phone number to continue"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} style={{ fontSize: '13px', padding: '8px 12px' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                Continue
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Activation of existing records */}
        {step === 2 && (
          <form onSubmit={handleActivate}>
            <div className="form-group-outline">
              <label htmlFor="reg-activate-email">Email</label>
              <input
                id="reg-activate-email"
                type="email"
                placeholder="e.g. john.smith@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group-outline">
              <label htmlFor="reg-activate-password">New password <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                id="reg-activate-password"
                type="password"
                placeholder="Set your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group-outline">
              <label htmlFor="reg-activate-confirm-password">Confirm new password</label>
              <input
                id="reg-activate-confirm-password"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(1)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                Activate account
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Complete Registration */}
        {step === 3 && (
          <form onSubmit={handleActivate}>
            <div className="form-group-outline">
              <label htmlFor="reg-name">Full name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group-outline">
              <label htmlFor="reg-email">Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                id="reg-email"
                type="email"
                placeholder="e.g. john.smith@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group-outline">
                <label htmlFor="reg-dob">Date of birth</label>
                <input 
                  id="reg-dob"
                  type="date" 
                  value={dateOfBirth} 
                  onChange={(e) => setDateOfBirth(e.target.value)} 
                  min={minDate}
                  max={maxDate}
                  required
                />
              </div>

              <div className="form-group-outline">
                <label htmlFor="reg-gender">Gender</label>
                <select
                  id="reg-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">-- Select gender --</option>
                  <option value="Nam">Male</option>
                  <option value="Nữ">Female</option>
                  <option value="Khác">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group-outline">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Set your access password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group-outline">
              <label htmlFor="reg-confirm-password">Confirm password</label>
              <input
                id="reg-confirm-password"
                type="password"
                placeholder="Re-enter your access password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep(1)}
                style={{ fontSize: '13px', padding: '8px 12px' }}
              >
                Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                Complete registration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
