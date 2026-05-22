import React, { useEffect, useState, useRef } from 'react';
import QuickBooking from '../../components/QuickBooking';
import { schedulingAPI } from '../../services/api';

export default function Services() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const bookingRef = useRef();
  
  // Prefill department state for QuickBooking
  const [activeDept, setActiveDept] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await schedulingAPI.getDepartments();
        if (!mounted) return;
        setDepartments(res.data?.data || []);
      } catch (err) {
        console.error('Load departments error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const servicePackages = [
    {
      id: 'basic',
      icon: '🩺',
      title: 'Gói Khám Sức Khỏe Cơ Bản',
      desc: 'Đánh giá tổng quát tình trạng sức khỏe hệ hô hấp, tuần hoàn, gan, thận và xét nghiệm máu cơ bản.',
      price: '750.000đ',
      period: 'mỗi lần khám',
      featured: false,
      benefits: [
        'Khám lâm sàng nội tổng quát',
        'Đo chỉ số sinh hiệu (Huyết áp, tim mạch)',
        'Công thức máu & đường huyết đói',
        'Đánh giá chức năng gan (AST, ALT)',
        'Đánh giá chức năng thận (Ure, Creatinin)',
        'Tư vấn kết quả cùng bác sĩ chuyên gia'
      ],
      deptKeyword: 'nội'
    },
    {
      id: 'screening',
      icon: '🫀',
      title: 'Gói Tầm Soát Tim Mạch & Bệnh Lý',
      desc: 'Tầm soát chuyên sâu bệnh lý mạch vành, cao huyết áp, mỡ máu và chỉ số tầm soát dấu ấn ung thư sớm.',
      price: '2.500.000đ',
      period: 'mỗi lần khám',
      featured: true,
      badge: 'Bán chạy',
      benefits: [
        'Tất cả dịch vụ của gói cơ bản',
        'Siêu âm tim màu doppler nâng cao',
        'Đo điện tâm đồ (ECG) phát hiện rối loạn nhịp',
        'Xét nghiệm mỡ máu toàn phần (Cholesterol, LDL, HDL)',
        'Tầm soát dấu ấn ung thư gan, phổi, dạ dày',
        'Chụp X-Quang phổi thẳng kỹ thuật số'
      ],
      deptKeyword: 'tim'
    },
    {
      id: 'pediatric',
      icon: '👶',
      title: 'Gói Khám Nhi Khoa Toàn Diện',
      desc: 'Khám sức khỏe định kỳ cho trẻ, theo dõi cột mốc phát triển, kiểm tra dinh dưỡng và tư vấn tiêm chủng.',
      price: '400.000đ',
      period: 'mỗi lần khám',
      featured: false,
      benefits: [
        'Khám sức khỏe tổng quát nhi khoa',
        'Đánh giá các cột mốc phát triển thể chất',
        'Kiểm tra và tư vấn chế độ dinh dưỡng',
        'Sàng lọc các bệnh lý nhi khoa phổ biến',
        'Hỗ trợ lên phác đồ tiêm chủng chuẩn y khoa',
        'Tặng sổ tay theo dõi sức khỏe cho bé'
      ],
      deptKeyword: 'nhi'
    },
    {
      id: 'vip',
      icon: '💎',
      title: 'Gói Chăm Sóc Sức Khỏe VIP',
      desc: 'Khám ưu tiên không chờ đợi, bác sĩ Trưởng khoa tư vấn riêng biệt, phòng chờ hạng thương gia đẳng cấp.',
      price: '1.800.000đ',
      period: 'mỗi lần khám',
      featured: false,
      benefits: [
        'Ưu tiên khám nhanh không xếp hàng',
        'Khám trực tiếp cùng Trưởng/Phó khoa lâm sàng',
        'Sử dụng phòng chờ VIP Lounge tiện ích',
        'Phục vụ trà, cà phê & ăn nhẹ miễn phí',
        'Thời gian bác sĩ tư vấn chuyên sâu kéo dài',
        'Nhận kết quả nhanh chóng & trả tận nơi'
      ],
      deptKeyword: 'vip'
    }
  ];

  const handleBookPackage = (pkg) => {
    // Find a department that matches the keyword
    const match = departments.find(d => 
      String(d.departmentName || '').toLowerCase().includes(pkg.deptKeyword)
    );
    if (match) {
      setActiveDept(match._id);
    } else if (pkg.id === 'vip') {
      // Look for a VIP department
      const vipMatch = departments.find(d => 
        String(d.departmentName || '').toLowerCase().includes('vip')
      );
      if (vipMatch) setActiveDept(vipMatch._id);
    }
    
    // Scroll to the booking widget
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="app">
      {/* Page Header Banner */}
      <div className="page-banner">
        <h2>Dịch Vụ Chăm Sóc Sức Khỏe</h2>
        <p>Phòng khám Đa Khoa Hợp Sơn Tài cung cấp đa dạng các gói khám từ cơ bản đến chuyên sâu, chi phí công khai minh bạch, phù hợp với nhu cầu của từng cá nhân và gia đình.</p>
      </div>

      <div className="home-grid">
        <div className="main-column">
          
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Các Gói Dịch Vụ Khám Tiêu Biểu</h3>
            
            {/* Packages Grid */}
            <div className="service-packages-grid">
              {servicePackages.map((pkg) => (
                <div key={pkg.id} className={`package-card ${pkg.featured ? 'featured' : ''}`}>
                  {pkg.featured && pkg.badge && (
                    <div className="package-badge">{pkg.badge}</div>
                  )}
                  
                  <div>
                    <div className="package-icon">{pkg.icon}</div>
                    <h4 className="package-title">{pkg.title}</h4>
                    <p className="package-desc">{pkg.desc}</p>
                    
                    <div className="package-price-wrap">
                      <span className="package-price">{pkg.price}</span>
                      <span className="package-price-period">/ {pkg.period}</span>
                    </div>

                    <ul className="package-benefits">
                      {pkg.benefits.map((benefit, index) => (
                        <li key={index} className="package-benefit-item">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    className={`btn package-cta ${pkg.featured ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleBookPackage(pkg)}
                  >
                    Đặt lịch khám ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* QuickBooking sidebar */}
        <aside className="aside-column">
          <div ref={bookingRef}>
            <QuickBooking 
              departments={departments} 
              initialDepartmentId={activeDept}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
