import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { profilesAPI } from '../../services/api';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await profilesAPI.getDoctor(id);
        if (!mounted) return;
        if (res.data?.success && res.data?.data) {
          setDoctor(res.data.data);
        } else {
          setError('Doctor profile not found.');
        }
      } catch (err) {
        console.error('Fetch doctor detail error:', err);
        if (mounted) {
          setError(err.response?.data?.message || 'Error loading doctor profile.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleBook = () => {
    if (!doctor) return;
    const deptId = doctor.departmentId?._id || doctor.departmentId || '';
    window.dispatchEvent(
      new CustomEvent('open-booking-modal', {
        detail: {
          doctorId: doctor._id || doctor.id || '',
          departmentId: deptId,
        },
      })
    );
  };

  const getInitials = (name) => {
    if (!name) return 'BS';
    const clean = String(name)
      .replace(/(PGS\.TS\.BS\.|PGS\.TS\.|TS\.BS\.|ThS\.BS\.|BS\.CKII\.|BS\.CKI\.|BS\.)/g, '')
      .trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Contact for details';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px', color: '#64748b' }}>
        <div className="spinner"></div>
        <p style={{ fontWeight: '600' }}>Loading doctor details...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚠️</span>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Profile Not Found</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>{error || "We couldn't retrieve the details for this doctor."}</p>
        <button className="btn btn-ghost" onClick={() => navigate('/specialists')}>
          Back to Specialists
        </button>
      </div>
    );
  }

  const initials = getInitials(doctor.fullName);
  const avatar = doctor.avatarURL;
  const deptName = doctor.departmentId?.departmentName || doctor.department || 'General Clinic';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', boxSizing: 'border-box' }} className="fade-in">
      {/* Breadcrumbs & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
          <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
          <span>/</span>
          <Link to="/specialists" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>Specialists</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-primary, #2563eb)', fontWeight: '600' }}>{doctor.fullName}</span>
        </div>
        <button 
          onClick={() => navigate('/specialists')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #2563eb)',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            padding: 0,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Specialists
        </button>
      </div>

      {/* Main Profile Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '30px' }} className="grid-form">
        
        {/* Left Column: Portrait & Key Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(15,23,42,0.06))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            {/* Avatar block with blurring */}
            <div style={{
              position: 'relative',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(15,23,42,0.1)'
            }}>
              {avatar && !imageError ? (
                <>
                  <img 
                    src={avatar} 
                    alt="" 
                    style={{ 
                      position: 'absolute',
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      filter: 'blur(10px) brightness(0.6)',
                      opacity: 0.5,
                      transform: 'scale(1.15)',
                      pointerEvents: 'none'
                    }} 
                  />
                  <img 
                    src={avatar} 
                    alt={doctor.fullName} 
                    onError={() => setImageError(true)}
                    style={{ 
                      position: 'relative',
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      zIndex: 1
                    }} 
                  />
                </>
              ) : (
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '800',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                }}>
                  {initials}
                </div>
              )}
            </div>

            {/* General Info */}
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>{doctor.fullName}</h2>
            <div style={{ fontSize: '14px', color: 'var(--color-primary, #2563eb)', fontWeight: '700', marginBottom: '8px' }}>
              {doctor.specialization}
            </div>
            
            {deptName && (
              <span style={{ 
                color: 'var(--color-primary-dark, #1d4ed8)', 
                backgroundColor: 'var(--color-primary-light, #eff6ff)', 
                border: '1px solid var(--color-primary-soft, #dbeafe)',
                padding: '4px 12px', 
                borderRadius: '8px', 
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-block',
                marginBottom: '20px'
              }}>{deptName}</span>
            )}

            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              width: '100%',
              borderTop: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 0',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>Experience</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{doctor.experienceYears || 0} Years</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>Base Fee</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{formatCurrency(doctor.baseFee)}</div>
              </div>
            </div>

            {/* Call To Action Book */}
            <button
              onClick={handleBook}
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%)',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.25s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.filter = 'brightness(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.filter = 'none';
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book Appointment
            </button>

          </div>

        </div>

        {/* Right Column: Detailed Bio & Qualifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Qualifications block */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(15,23,42,0.06))'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🎓</span> Qualifications & Expertise
            </h3>
            <div style={{ 
              fontSize: '15px', 
              lineHeight: '1.6',
              padding: '16px 20px',
              backgroundColor: '#fffbeb',
              borderLeft: '4px solid #d97706',
              borderRadius: '8px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              {doctor.qualifications || 'Specialist Doctor'}
            </div>
          </div>

          {/* Biography block */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(15,23,42,0.06))'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>📝</span> Professional Biography
            </h3>
            <div style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#475569',
              whiteSpace: 'pre-line'
            }}>
              {doctor.bio || 'A dedicated specialist with deep clinical knowledge and a compassionate, patient-centered approach to care. Committed to offering modern diagnostics integrated with traditional medicine methods to deliver effective clinical treatments.'}
            </div>
          </div>

          {/* Booking & Clinic Schedule note */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>🏥</span> Consultation Hours & Information
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
              The doctor is regularly scheduled for consultations at Hopsontai General Clinic.
              <br />
              <strong>Hours:</strong> Monday – Sunday: 7:00 AM – 8:00 PM.
              <br />
              Please select **Book Appointment** to see open dates, select examination time slots, and submit your medical inquiry securely.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
