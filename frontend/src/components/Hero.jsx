import React from 'react';

export default function Hero() {
  const stats = [
    { number: '15+', label: 'Chuyên khoa sâu' },
    { number: '50+', label: 'Bác sĩ chuyên khoa' },
    { number: '10K+', label: 'Bệnh nhân tin tưởng' },
    { number: '24/7', label: 'Tư vấn trực tuyến' },
  ];

  return (
    <section className="fade-in" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      padding: '24px',
      background: 'white',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-md)',
      marginBottom: '24px',
      textAlign: 'center',
    }}>
      {stats.map((s, idx) => (
        <div key={idx} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {idx > 0 && (
            <div style={{
              position: 'absolute',
              left: '-8px',
              top: '15%',
              bottom: '15%',
              width: '1px',
              backgroundColor: 'var(--color-border)',
            }} />
          )}
          <div style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>{s.number}</div>
          <div style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            fontWeight: '700',
            marginTop: '4px',
          }}>{s.label}</div>
        </div>
      ))}
    </section>
  );
}
