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
      
      // GIỮ LẠI KHUNG TRẮNG NGUYÊN BẢN (KHÔNG BO GÓC)
      background: 'white',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-md)',
      
      // CHỈNH LẠI KÍCH THƯỚC VÀ CĂN GIỮA ĐỂ CÂN ĐỐI
      maxWidth: '1200px',    // Giới hạn chiều rộng của hộp trắng (bạn có thể đổi thành 1000px hoặc tùy ý để vừa vặn hơn)
      margin: '0 auto 24px auto', // Căn đều trái/phải để hộp trắng nằm chính giữa màn hình, phía dưới cách 24px
      
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