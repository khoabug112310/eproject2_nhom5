import React, { useEffect } from 'react';
import QuickBooking from './QuickBooking';

export default function QuickBookingModal({ show, onClose, initialDoctorId = '', initialDepartmentId = '' }) {
  useEffect(() => {
    if (show) {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
        {/* Close Button */}
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
            padding: '4px',
            zIndex: 10
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          aria-label="Close"
        >
          &times;
        </button>
        <QuickBooking 
          isInline={false} 
          isModal={true} 
          onSuccess={onClose}
          initialDoctorId={initialDoctorId}
          initialDepartmentId={initialDepartmentId}
        />
      </div>
    </div>
  );
}
