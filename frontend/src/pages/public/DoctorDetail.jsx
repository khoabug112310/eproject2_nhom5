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

  const responsiveStyles = `
    .doctor-detail-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 30px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .doctor-detail-layout {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .doctor-sidebar {
        max-width: 480px;
        margin: 0 auto;
        width: 100%;
      }
    }
    .detail-card {
      background: white;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
      transition: box-shadow 0.2s ease;
    }
    .detail-card:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
    }
  `;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 10px', boxSizing: 'border-box' }} className="fade-in">
      <style>{responsiveStyles}</style>

      {/* Breadcrumbs & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748b' }}>
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
            fontSize: '13.5px',
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
      <div className="doctor-detail-layout">
        
        {/* Left Column: Sidebar / Key Action Card */}
        <div className="doctor-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: 'white',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}>
            
            {/* Rectangular Image Cover (object-fit: cover) */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '320px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              {avatar && !imageError ? (
                <img 
                  src={avatar} 
                  alt={doctor.fullName} 
                  onError={() => setImageError(true)}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }} 
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '44px',
                  fontWeight: '800',
                  color: 'white'
                }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Quick Stats Panel */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '16px',
              marginBottom: '20px',
              border: '1px solid var(--color-border, #e2e8f0)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Experience</span>
                <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>{doctor.experienceYears || 0} Years</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Consultation Fee</span>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--color-primary, #2563eb)' }}>{formatCurrency(doctor.baseFee)}</span>
              </div>
            </div>

            {/* Call To Action Book */}
            <button
              onClick={handleBook}
              style={{
                width: '100%',
                padding: '14px 20px',
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
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.2)';
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
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

        {/* Right Column: Detailed Biography & Title Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Title Section */}
          <div className="detail-card" style={{ padding: '30px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '1.5px', 
              color: 'var(--color-primary, #2563eb)',
              backgroundColor: 'var(--color-primary-light, #eff6ff)',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              Specialist Profile
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              {doctor.fullName}
            </h1>
            <div style={{ fontSize: '16px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>{doctor.specialization}</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ color: 'var(--color-secondary-dark, #0284c7)' }}>{deptName}</span>
            </div>
          </div>

          {/* Qualifications block */}
          <div className="detail-card">
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🎓</span> Qualifications & Expertise
            </h3>
            <div style={{ 
              fontSize: '14.5px', 
              lineHeight: '1.6',
              padding: '16px 20px',
              backgroundColor: 'var(--color-primary-light, #eff6ff)',
              borderLeft: '4px solid var(--color-primary, #2563eb)',
              borderRadius: '8px',
              fontWeight: '700',
              color: 'var(--color-primary-dark, #1d4ed8)'
            }}>
              {doctor.qualifications || 'Specialist Doctor'}
            </div>
          </div>

          {/* Biography block */}
          <div className="detail-card">
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>📝</span> Professional Biography
            </h3>
            <div style={{
              fontSize: '15px',
              lineHeight: '1.75',
              color: '#334155',
              whiteSpace: 'pre-line'
            }}>
              {doctor.bio || 'A dedicated specialist with deep clinical knowledge and a compassionate, patient-centered approach to care. Committed to offering modern diagnostics integrated with traditional medicine methods to deliver effective clinical treatments.'}
            </div>
          </div>

          {/* Booking & Clinic Schedule note */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--color-border, #e2e8f0)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: 'none'
          }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>🏥</span> Consultation Hours & Information
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
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
