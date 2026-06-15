import React from 'react';

const historyData = [
  { 
    year: "Hiện nay", 
    title: "Chuyển đổi số toàn diện", 
    content: "Hướng tới mô hình y khoa thông minh hiện đại. Tích hợp hồ sơ bệnh án điện tử, nâng cấp tối đa trải nghiệm người dùng và tiếp tục nâng cao chuyên môn đội ngũ y bác sĩ." 
  },
  { 
    year: "Năm 2024", 
    title: "Vươn tầm chất lượng y khoa", 
    content: "Chính thức ra mắt gói khám sức khỏe VIP, hợp tác chuyên môn với các chuyên gia đầu ngành tuyến trung ương và hoàn thiện hệ thống tư vấn, đặt lịch trực tuyến." 
  },
  { 
    year: "Năm 2022", 
    title: "Cột mốc 10.000+ bệnh nhân", 
    content: "Đạt mốc chăm sóc sức khỏe cho hơn 10.000 lượt bệnh nhân tin tưởng. Mở rộng cơ sở vật chất và tăng cường quy mô phòng khám ngoại trú." 
  },
  { 
    year: "Năm 2020", 
    title: "Đầu tư trang thiết bị công nghệ cao", 
    content: "Nâng cấp toàn bộ máy móc chẩn đoán hình ảnh (siêu âm 4D, nội soi tiêu hóa không đau) và chính thức mở rộng thêm chuyên khoa Sản phụ khoa, Da liễu." 
  },
  { 
    year: "Năm 2018", 
    title: "Thành lập & Khởi đầu sứ mệnh", 
    content: "Phòng khám Đa khoa Hợp Sơn Tài được thành lập với mục tiêu mang lại dịch vụ y tế chất lượng cao, thân thiện và chi phí hợp lý nhất cho cộng đồng." 
  },
];

const valuesData = [
  {
    title: "Sứ mệnh",
    desc: "Cung cấp giải pháp chăm sóc sức khỏe toàn diện, chuyên nghiệp với chi phí hợp lý nhất cho mọi gia đình Việt."
  },
  {
    title: "Tầm nhìn",
    desc: "Trở thành hệ thống phòng khám đa khoa kỹ thuật số hiện đại hàng đầu với chất lượng chuẩn quốc tế."
  },
  {
    title: "Giá trị cốt lõi",
    desc: "Lấy y đức làm nền tảng, sự an toàn và hài lòng của người bệnh làm thước đo giá trị cao nhất."
  }
];

export default function About() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. HERO BANNER */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'linear-gradient(135deg, var(--color-primary-dark, #1e3a8a) 0%, var(--color-secondary-dark, #0f766e) 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background overlay circles */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="fade-in">
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            background: 'rgba(255,255,255,0.18)', 
            padding: '6px 16px', 
            borderRadius: '50px',
            display: 'inline-block',
            marginBottom: '20px'
          }}>Về chúng tôi</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Phòng Khám Đa Khoa Hợp Sơn Tài
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Nơi kết tinh của Tài năng, Y đức và Công nghệ hiện đại để mang lại sự an tâm tuyệt đối cho sức khỏe của bạn.
          </p>
        </div>
      </section>

      {/* 2. OVERVIEW & VALUES */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Intro Text */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ 
              color: 'var(--color-text, #1e293b)', 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: '20px',
              borderLeft: '5px solid var(--color-primary, #3b82f6)',
              paddingLeft: '16px'
            }}>
              Cam Kết Về Một Nền Y Khoa Tận Tâm
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--color-text-muted, #64748b)', margin: '0 0 20px 0' }}>
              Được thành lập từ khao khát xây dựng một mô hình phòng khám thân thiện, tối giản thủ tục và chuyên sâu chất lượng, <strong>Hợp Sơn Tài</strong> không ngừng cải tiến quy trình phục vụ. Chúng tôi hiểu rằng, mỗi lượt khám không chỉ là chẩn đoán bệnh mà còn là sự chia sẻ, lắng nghe và đồng hành cùng bệnh nhân.
            </p>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Đội ngũ bác sĩ của chúng tôi là các chuyên gia có nhiều năm kinh nghiệm, luôn tận tụy học hỏi và nâng cao chuyên môn để đưa ra phác đồ tối ưu, tiết kiệm chi phí tối đa cho người bệnh.
            </p>
          </div>

          {/* Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {valuesData.map((val, idx) => (
              <div 
                key={idx} 
                style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: 'var(--radius-card, 16px)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))';
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))';
                  e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--color-text, #1e293b)' }}>{val.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-muted, #64748b)' }}>{val.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. TIMELINE & MILESTONES */}
      <div style={{ padding: '80px 20px', backgroundColor: 'var(--color-bg-alt, #f8fafc)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text, #1e293b)', margin: '0 0 12px 0' }}>
              Hành Trình Kiến Tạo & Phát Triển
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Nhìn lại những cột mốc phát triển vững chắc của Phòng khám Đa khoa Hợp Sơn Tài
            </p>
          </div>

          <div style={{ position: 'relative', paddingLeft: '40px' }}>
            {/* Main Vertical Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--color-primary, #3b82f6), var(--color-secondary, #10b981))'
            }} />

            {historyData.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  position: 'relative', 
                  marginBottom: '40px',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Timeline Bullet */}
                <div style={{
                  position: 'absolute',
                  left: '-37px',
                  top: '6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '3px solid var(--color-primary, #3b82f6)',
                  boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
                  zIndex: 2,
                  boxSizing: 'border-box'
                }} />

                {/* Timeline Content Card */}
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'white',
                    backgroundColor: 'var(--color-primary, #3b82f6)',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}>{item.year}</span>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: 'var(--color-text, #1e293b)' 
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.7', 
                    color: 'var(--color-text-muted, #64748b)' 
                  }}>
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      
    </div>
  );
}
