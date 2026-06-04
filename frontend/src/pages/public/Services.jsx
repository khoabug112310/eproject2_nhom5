import React from 'react';

const historyData = [
  { year: "Năm 2016 - nay", content: "Trên chặng đường hội nhập và phát triển, Bệnh viện kỷ niệm 105 năm thành lập và đón nhận Huân chương Độc lập hạng 3 lần thứ 2; Quy mô 1900 giường bệnh với 55 đơn vị trực thuộc..." },
  { year: "Năm 2011", content: "Kỷ niệm 100 năm thành lập đón nhận Huân chương Độc lập hạng nhất lần thứ 2; Quy mô 1400 giường bệnh..." },
  { year: "Năm 2006", content: "Được Bộ y tế công nhận là Bệnh viện đa khoa hoàn chỉnh hạng đặc biệt đầu tiên của Việt Nam." },
  { year: "Từ 1975 đến nay", content: "Đất nước thống nhất, Bệnh viện Bạch Mai bước vào kỷ nguyên mới, đảm nhiệm trọng trách khám chữa bệnh tuyến cuối của ngành y tế." },
  { year: "Giai đoạn 1965 - 1975", content: "Thời kỳ kháng chiến chống Mỹ, nhiều cán bộ Bệnh viện đã tình nguyện vào Nam chiến đấu... 28 cán bộ y tế đã hy sinh." },
  { year: "Giai đoạn 1954 - 1964", content: "Cải tạo cơ sở vật chất sau chiến tranh tàn phá, tăng số lượng cán bộ và mở rộng quy mô hoạt động chuyên môn." },
  { year: "Giai đoạn 1945 - 1954", content: "Thời kỳ kháng chiến chống Pháp, Bệnh viện là pháo đài của quân và dân ta trong cuộc kháng chiến bảo vệ Thủ đô." },
  { year: "Năm 1945", content: "Bệnh viện được mang tên Bệnh viện Bạch Mai." },
  { year: "Năm 1935", content: "Bệnh viện mang tên René Robin được xây dựng quy mô hơn, là cơ sở thực hành chính của trường Đại học Y khoa Đông Dương." },
  { year: "Năm 1911", content: "Bệnh viện Bạch Mai được thành lập, ban đầu là Nhà thương Cống Vọng nhỏ bé chuyên để thu nhận và điều trị bệnh nhân truyền nhiễm." },
];

export default function AboutClinic() {
  return (
    <div style={{ width: '100%', padding: '0 5%', boxSizing: 'border-box' }}>
      
      {/* 1. BANNER */}
      <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#f8fafc', width: '100%' }}>
        <h1 style={{ color: 'rgb(34, 95, 181)', fontSize: '36px', marginBottom: '10px' }}>Phòng Khám Hợp Sơn Tài</h1>
        <p style={{ fontSize: '18px', color: '#718096' }}>Trí - Đức - Chuyên tâm | Vươn tầm Thế giới</p>
      </div>

      {/* 2. GIỚI THIỆU TỔNG QUAN */}
      <section style={{ padding: '40px 0', maxWidth: '1200px', margin: '0 auto' }}>
        <h3 style={{ color: '#1a365d', borderLeft: '4px solid #2b6cb0', paddingLeft: '10px', fontSize: '24px' }}>Giới thiệu</h3>
        <p style={{ lineHeight: '1.8', color: '#4a5568', fontSize: '16px', marginTop: '20px' }}>
          <strong>Phòng khám Đa khoa Hợp Sơn Tài</strong> là đơn vị y tế uy tín, với tầm nhìn trở thành điểm tựa chăm sóc sức khỏe hàng đầu tại địa phương và khu vực. Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao, an toàn và toàn diện cho mỗi khách hàng bằng tài năng, y đức và sự tận tâm.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '40px' }}>
          <div style={{ background: '#f0f7ff', padding: '25px', borderRadius: '12px' }}>
            <h4 style={{ color: '#2b6cb0', fontSize: '18px' }}>Sứ mệnh</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Cung cấp giải pháp chăm sóc sức khỏe toàn diện, chuyên nghiệp với chi phí hợp lý cho cộng đồng.</p>
          </div>
          <div style={{ background: '#f0f7ff', padding: '25px', borderRadius: '12px' }}>
            <h4 style={{ color: '#2b6cb0', fontSize: '18px' }}>Tầm nhìn</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Trở thành phòng khám đa khoa hàng đầu với công nghệ hiện đại và đội ngũ bác sĩ giàu kinh nghiệm.</p>
          </div>
          <div style={{ background: '#f0f7ff', padding: '25px', borderRadius: '12px' }}>
            <h4 style={{ color: '#2b6cb0', fontSize: '18px' }}>Giá trị cốt lõi</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}><strong>An toàn - Tin cậy - Hiệu quả</strong></p>
          </div>
        </div>
      </section>

      {/* 3. TIMELINE */}
      <div style={{ padding: '60px 0', backgroundColor: '#f9f9f9', width: '100%' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ color: '#2d6a4f', fontSize: '32px', textAlign: 'center' }}>105 năm</h1>
          <h2 style={{ fontSize: '28px', marginBottom: '50px', textAlign: 'center' }}>hình thành và phát triển</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 40px 1fr', alignItems: 'start' }}>
            {historyData.map((item, index) => (
              <React.Fragment key={index}>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#2d6a4f', paddingRight: '20px', paddingTop: '5px' }}>
                  {item.year}
                </div>
                <div style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '2px', backgroundColor: '#2d6a4f', height: '100%' }}></div>
                  <div style={{ position: 'absolute', top: '5px', width: '16px', height: '16px', backgroundColor: '#2d6a4f', borderRadius: '50%' }}></div>
                </div>
                <div style={{ fontSize: '15px', color: '#4a5568', paddingBottom: '50px', paddingLeft: '20px' }}>
                  {item.content}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}