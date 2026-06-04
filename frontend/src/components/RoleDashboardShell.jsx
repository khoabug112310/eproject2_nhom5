import React from 'react';
import RoleTopNav from './RoleTopNav';

export default function RoleDashboardShell({ title, subtitle, cards, role }) {
  return (
    <div className="role-dashboard-shell" style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc', // Nền xám nhạt cực sang giúp nổi bật các card trắng
      minHeight: '100vh',
      paddingBottom: '40px'
    }}>
      {/* Thanh điều hướng trên cùng */}
      <RoleTopNav role={role} />
      
      {/* Khu vực Hero chào đón */}
      <div className="role-hero" style={{
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)', // Gradient xanh y tế nhạt
        padding: '48px 24px',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '32px'
      }}>
        <p className="role-kicker" style={{
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontSize: '12px',
          fontWeight: '700',
          color: '#0284c7', // Màu xanh thương hiệu chính
          marginBottom: '8px'
        }}>
          Phòng khám đa khoa Hợp Sơn Tài
        </p>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#0f172a',
          margin: '0 0 12px 0',
          letterSpacing: '-0.5px'
        }}>
          {title}
        </h1>
        <p className="role-subtitle" style={{
          fontSize: '16px',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          {subtitle}
        </p>
      </div>

      {/* Lưới hiển thị các thẻ chức năng */}
      <div className="role-card-grid" style={{
        display: 'grid',
        // Tự động chia cột thông minh: tối thiểu 280px, tối đa xếp đều nhau
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px'
      }}>
        {cards.map((card) => (
          <section 
            className="role-card" 
            key={card.title}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px', // Bo góc hiện đại
              padding: '28px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Đổ bóng mịn
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
            // Thêm hiệu ứng hover tương tác bằng JS inline đơn giản
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Vùng chứa Icon được chau chuốt */}
            <div className="role-card-icon" style={{
              fontSize: '24px',
              backgroundColor: '#f0f9ff', // Nền xanh nhạt ôm lấy icon
              color: '#0284c7',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {card.icon}
            </div>
            
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              {card.title}
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {card.description}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}