// Trang chủ (Home Page)
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { schedulingAPI, clinicalAPI, cmsAPI } from '../../services/api';
import QuickBooking from '../../components/QuickBooking';
import Hero from '../../components/Hero';
import DepartmentCard from '../../components/cards/DepartmentCard';
import DoctorCard from '../../components/cards/DoctorCard';
import PostCard from '../../components/cards/PostCard';
import postPlaceholder1 from '../../images/hero1.jpg';
import postPlaceholder2 from '../../images/hero2.jpg';
import postPlaceholder3 from '../../images/hero3.jpg';

const POST_PLACEHOLDERS = [postPlaceholder1, postPlaceholder2, postPlaceholder3];

const [/* placeholder */] = [];


export default function Home() {
  const navigate = useNavigate();
  const bookingRef = useRef();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States to pass down and prefill the QuickBooking widget
  const [activeDoctor, setActiveDoctor] = useState('');
  const [activeDept, setActiveDept] = useState('');

  function scrollToBooking() {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const handleBookDoctor = (doc) => {
    setActiveDoctor(doc.id || doc._id || '');
    // Find department ID that matches the doctor's department name
    if (doc.department) {
      const matchDep = departments.find(dept => (dept.departmentName || dept.name) === doc.department);
      if (matchDep) {
        setActiveDept(matchDep._id);
      }
    }
    scrollToBooking();
  };

  const handleSelectDepartment = (depId) => {
    setActiveDept(depId);
    setActiveDoctor(''); // reset doctor selection to default
    scrollToBooking();
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [depRes, docRes, postRes] = await Promise.all([
          schedulingAPI.getDepartments(),
          clinicalAPI.getDoctors(),
          cmsAPI.getPosts()
        ]);
        setDepartments(depRes.data?.data || []);
        setDoctors(docRes.data?.data || []);
        setPosts(postRes.data?.data || []);
      } catch (err) {
        console.error('Home fetch error', err);
        setError('Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="app">
      <main>
        {/* Trust Stats Bar */}
        <Hero />

        <div className="home-content">

          {/* Departments Grid Section */}
          {/* <div className="card">
            <div className="card-title-bar">
              <h3>Khoa Lâm Sàng Nổi Bật</h3>
              <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold' }}>Chuyên nghiệp & Tận tâm</span>
            </div>
            <div className="department-grid">
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>Đang tải danh sách chuyên khoa...</div>
              ) : departments.length ? (
                departments.map((d, i) => (
                  <DepartmentCard 
                    key={i} 
                    {...d} 
                    onViewDoctors={() => handleSelectDepartment(d._id)} 
                    />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1' }}>Không tìm thấy chuyên khoa nào</div>
              )}
            </div>
          </div> */}

          {/* Doctors Grid Section - Redesigned to be highly professional and visually stunning */}
          <section style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--color-secondary, #00a89d)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                backgroundColor: 'var(--color-secondary-light, #e6fffa)',
                padding: '5px 14px',
                borderRadius: '50px',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(0, 168, 157, 0.05)'
              }}>Đội ngũ chuyên gia</span>
              
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: '800', 
                color: '#1e293b', 
                margin: '12px 0 8px 0',
                letterSpacing: '-0.5px'
              }}>Đội Ngũ Bác Sĩ Tiêu Biểu</h2>
              
              <p style={{ 
                fontSize: '15px', 
                color: '#64748b', 
                maxWidth: '620px', 
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                Quy tụ những Phó giáo sư, Tiến sĩ và bác sĩ ưu tú với học vị cao và nhiều năm kinh nghiệm lâm sàng trực tiếp thăm khám và trị liệu.
              </p>
            </div>
            
            <div className="home-doctors-grid">
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>
                  Đang tải danh sách bác sĩ...
                </div>
              ) : doctors.length ? (
                doctors.slice(0, 4).map((d, i) => (
                  <DoctorCard
                    key={i}
                    {...d}
                    onBook={() => handleBookDoctor(d)}
                  />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%', gridColumn: '1/-1' }}>
                  Không có thông tin bác sĩ
                </div>
              )}
            </div>

            {!loading && doctors.length > 4 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
                <button
                  onClick={() => navigate('/specialists')}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'var(--color-primary, #3b82f6)',
                    backgroundColor: 'var(--color-primary-light, #eff6ff)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.06)',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary, #3b82f6)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-light, #eff6ff)';
                    e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Xem toàn bộ đội ngũ bác sĩ
                </button>
              </div>
            )}
          </section>

          {/* QuickBooking Inline Card Section */}
          <div className="card" ref={bookingRef} id="booking-section">
            <QuickBooking
              doctors={doctors}
              departments={departments}
              initialDoctorId={activeDoctor}
              initialDepartmentId={activeDept}
              isInline={true}
            />
          </div>

          {/* News & Latest Posts Section */}
          <div className="post-list">
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>Đang tải tin tức y khoa...</div>
            ) : posts.length ? (
              posts.slice(0, 3).map((p, i) => (
                <PostCard
                  key={i}
                  title={p.title}
                  excerpt={p.excerpt}
                  date={p.publishedAt || p.date}
                  thumbnail={p.thumbnail || p.thumbnailURL || p.imageUrl || p.image || POST_PLACEHOLDERS[i % POST_PLACEHOLDERS.length]}
                  onRead={() => navigate(`/news?slug=${p.slug || p._id}`)}
                />
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1' }}>Chưa có tin tức mới cập nhật</div>
            )}
          </div>

        </div>

        {error && (
          <div style={{
            color: 'hsl(0, 84%, 40%)',
            backgroundColor: 'hsl(0, 100%, 97%)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            padding: '12px',
            borderRadius: 'var(--radius-input)',
            marginTop: '24px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
      </main>
    </div>
  );
}
