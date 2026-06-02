import React from 'react';

export default function DoctorCard({ avatar, fullName, specialization, department, rating, nextSlot, onBook }) {
  // Random rating display if rating is not provided
  const displayRating = rating || (4.5 + Math.random() * 0.5).toFixed(1);

  return (
    <div className="doc-card fade-in">
      <div>
        <div className="doc-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt={fullName} onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <span className="doc-avatar-placeholder">👨‍⚕️</span>
          )}
        </div>
        <div className="doc-details">
          <div className="doc-name">{fullName}</div>
          <div className="doc-specialty">{specialization}</div>
          {department && <div className="doc-dept-badge">{department}</div>}
        </div>
      </div>
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '4px', 
          fontSize: '13px', 
          color: 'var(--color-accent)', 
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
        
        </div>
        <div className="doc-slots">
          {nextSlot ? `Lịch hẹn trống: ${nextSlot}` : 'Hôm nay: Trống lịch'}
        </div>
        <button className="doc-action-btn" onClick={onBook}>
          Đặt lịch khám
        </button>
      </div>
    </div>
  );
}
