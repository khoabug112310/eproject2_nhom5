import React, { useState, useEffect } from 'react';
import { clinicalAPI } from '../services/api';

export default function Hero() {
  const [statsData, setStatsData] = useState({
    departments: 0,
    doctors: 0,
    patients: 0,
    appointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await clinicalAPI.getPublicStats();
        if (res.data?.success && active) {
          setStatsData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch public stats', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStats();

    const handleBookingSuccess = () => {
      fetchStats();
    };

    window.addEventListener('booking-success', handleBookingSuccess);

    return () => {
      active = false;
      window.removeEventListener('booking-success', handleBookingSuccess);
    };
  }, []);

  const stats = [
    { number: loading ? '...' : `${statsData.departments}`, label: 'Chuyên khoa sâu' },
    { number: loading ? '...' : `${statsData.doctors}`, label: 'Bác sĩ chuyên khoa' },
    { number: loading ? '...' : `${statsData.patients}`, label: 'Bệnh nhân tin tưởng' },
    { number: loading ? '...' : `${statsData.appointments}`, label: 'Lượt khám y khoa' },
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