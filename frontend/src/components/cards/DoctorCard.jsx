import React, { useState } from 'react';

export default function DoctorCard({ avatar, fullName, specialization, department, experienceYears, qualifications, bio, onBook }) {
  const [imageError, setImageError] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Helper to extract doctor's initials from the actual name (ignoring titles)
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

  const initials = getInitials(fullName);

  return (
    <div 
      className="doc-card fade-in" 
      style={{
        background: 'white',
        border: '1px solid #cbd5e1',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.02)',
        padding: 0,
        maxWidth: '300px',
        width: '100%',
        margin: '0 auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.05)';
        e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
        const img = e.currentTarget.querySelector('.doc-portrait-img');
        if (img) img.style.transform = 'scale(1.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.02)';
        e.currentTarget.style.borderColor = '#cbd5e1';
        const img = e.currentTarget.querySelector('.doc-portrait-img');
        if (img) img.style.transform = 'scale(1)';
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Large Portrait Image Header */}
        <div style={{
          position: 'relative',
          height: '150px',
          width: '100%',
          overflow: 'hidden',
          background: '#0f172a', // Dark theme background fallback
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {avatar && !imageError ? (
            <>
              {/* Blurred background image to fill side gaps */}
              <img 
                src={avatar} 
                alt="" 
                style={{ 
                  position: 'absolute',
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  filter: 'blur(12px) brightness(0.6)',
                  opacity: 0.65,
                  transform: 'scale(1.1)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} 
              />
              {/* Main crisp doctor portrait */}
              <img 
                src={avatar} 
                alt={fullName} 
                className="doc-portrait-img"
                onError={() => setImageError(true)}
                style={{ 
                  position: 'relative',
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  zIndex: 1,
                  transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            </>
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '800',
              color: 'white',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
            }}>
              {initials}
            </div>
          )}

        </div>

        {/* Doctor Metadata Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          <div>
            <h4 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '17px', 
              fontWeight: '700', 
              color: '#1e293b', 
              lineHeight: '1.4' 
            }}>{fullName}</h4>
            
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--color-primary, #3b82f6)', 
              fontWeight: '700',
              marginBottom: '6px'
            }}>
              {specialization}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '4px'
            }}>
              {department && (
                <span style={{ 
                  color: 'var(--color-primary-dark, #1d4ed8)', 
                  backgroundColor: 'var(--color-primary-light, #eff6ff)', 
                  border: '1px solid var(--color-primary-soft, #dbeafe)',
                  padding: '3px 8px', 
                  borderRadius: '6px', 
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>{department}</span>
              )}
              {experienceYears && (
                <span style={{ 
                  color: '#475569', 
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>{experienceYears} yrs experience</span>
              )}
            </div>
          </div>

          <div style={{ 
            fontSize: '12.5px', 
            lineHeight: '1.5',
            paddingTop: '10px',
            marginBottom: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: '#fffbeb',
            borderLeft: '4px solid #d97706',
            borderRight: '1px solid #fef3c7',
            borderTop: '1px solid #fef3c7',
            borderBottom: '1px solid #fef3c7',
            padding: '8px 12px',
            borderRadius: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: '800',
              color: '#b45309',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🎓 Qualifications & Expertise
            </div>
            <div style={{ fontWeight: '700', color: '#1e293b' }}>
              {qualifications || 'Specialist Doctor'}
            </div>
          </div>

          <p style={{
            margin: 0,
            fontSize: '12.5px',
            lineHeight: '1.6',
            color: '#64748b',
            height: isBioExpanded ? 'auto' : '60px',
            overflow: isBioExpanded ? 'visible' : 'hidden',
            textOverflow: 'ellipsis',
            display: isBioExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: isBioExpanded ? 'none' : 3,
            WebkitBoxOrient: 'vertical'
          }} title={bio}>
            {bio || 'A dedicated specialist with deep clinical knowledge and a compassionate, patient-centered approach to care.'}
          </p>
        </div>
      </div>

      {/* Two Buttons Footer */}
      <div style={{ padding: '0 20px 20px 20px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '12.5px',
            fontWeight: '700',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            backgroundColor: 'white',
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            outline: 'none',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
            e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#475569';
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsBioExpanded(!isBioExpanded);
          }}
        >
          {isBioExpanded ? 'Collapse' : 'View Details'}
        </button>

        <button 
          type="button"
          style={{
            flex: 1.3,
            padding: '10px 8px',
            fontSize: '12.5px',
            fontWeight: '700',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'all 0.25s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.25)';
            e.currentTarget.style.filter = 'brightness(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
            e.currentTarget.style.filter = 'none';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
        >
          Book Appointment
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
