import React from 'react';

export default function DepartmentCard({ name, departmentName, description, doctorCount, onViewDoctors }) {
  const displayName = name || departmentName || 'Chuyên Khoa';
  
  // Custom Initials, Gradients and Colors for a highly professional corporate medical feel
  const getDeptConfig = (deptName) => {
    const lower = String(deptName).toLowerCase();
    
    // Choose default values
    let initials = 'CK';
    let grad = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    let color = '#475569';

    if (lower.includes('nội khoa & tim mạch') || (lower.includes('nội') && (lower.includes('tim') || lower.includes('mạch')))) {
      initials = 'NTM';
      grad = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
      color = '#1e40af';
    } else if (lower.includes('nội')) {
      initials = 'NK';
      grad = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
      color = '#1e40af';
    } else if (lower.includes('ngoại')) {
      initials = 'NG';
      grad = 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)';
      color = '#9f1239';
    } else if (lower.includes('nhi')) {
      initials = 'NH';
      grad = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
      color = '#166534';
    } else if (lower.includes('sản') || lower.includes('phụ')) {
      initials = 'SP';
      grad = 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)';
      color = '#9d174d';
    } else if (lower.includes('tim') || lower.includes('mạch')) {
      initials = 'TM';
      grad = 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)';
      color = '#c53030';
    } else if (lower.includes('cổ truyền') || lower.includes('đông y')) {
      initials = 'DY';
      grad = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
      color = '#15803d';
    } else if (lower.includes('răng') || lower.includes('nha')) {
      initials = 'RHM';
      grad = 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)';
      color = '#6b21a8';
    } else if (lower.includes('tai') || lower.includes('họng')) {
      initials = 'TMH';
      grad = 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)';
      color = '#c2410c';
    } else if (lower.includes('mắt') || lower.includes('nhãn')) {
      initials = 'MK';
      grad = 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)';
      color = '#0891b2';
    } else if (lower.includes('da liễu')) {
      initials = 'DL';
      grad = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
      color = '#0369a1';
    } else if (lower.includes('thần kinh') || lower.includes('não')) {
      initials = 'TK';
      grad = 'linear-gradient(135deg, #f5f5f7 0%, #e4e4e7 100%)';
      color = '#3f3f46';
    } else if (lower.includes('xét nghiệm')) {
      initials = 'XN';
      grad = 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)';
      color = '#0f766e';
    } else {
      // Fallback dynamic generator for any other department names
      const words = String(deptName).trim().split(/\s+/);
      if (words.length >= 2) {
        initials = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1 && words[0].length > 0) {
        initials = words[0].substring(0, 2).toUpperCase();
      }
    }

    return { initials, grad, color };
  };

  const { initials, grad, color } = getDeptConfig(displayName);

  return (
    <div 
      className="fade-in" 
      style={{
        background: 'white',
        border: '1px solid #f1f5f9',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
        e.currentTarget.style.borderColor = '#f1f5f9';
      }}
    >
      <div>
        {/* Header containing initials and badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: grad,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: '800',
            color: color,
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02), inset 0 2px 4px rgba(255,255,255,0.4)',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            {initials}
          </div>
          
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: color,
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            padding: '4px 10px',
            borderRadius: '50px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {doctorCount || 0} bác sĩ
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 10px 0',
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b'
        }}>{displayName}</h3>

        {/* Description */}
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#64748b',
          height: '62px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }} title={description}>
          {description || 'Chuyên khoa cung cấp dịch vụ khám và điều trị chất lượng cao với trang thiết bị hiện đại và đội ngũ chuyên gia tận tâm.'}
        </p>
      </div>

      {/* Button link */}
      <button 
        style={{
          width: '100%',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: '700',
          borderRadius: '10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          color: '#1e293b',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary, #3b82f6)';
          e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.color = '#1e293b';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onViewDoctors();
        }}
      >
        Xem đội ngũ bác sĩ
        <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
