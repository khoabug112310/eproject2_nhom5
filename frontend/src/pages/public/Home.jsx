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

          {/* Doctors Carousel Section */}
          <div className="card">
            <div className="card-title-bar">
              <h3>Đội Ngũ Bác Sĩ Tiêu Biểu</h3>
              <span style={{ fontSize: '13px', color: 'var(--color-secondary)', fontWeight: 'bold' }}>Học vị cao - Giàu kinh nghiệm</span>
            </div>
            <div className="doctor-carousel">
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%', color: 'var(--color-text-muted)' }}>Đang tải danh sách bác sĩ...</div>
              ) : doctors.length ? (
                doctors.slice(0, 8).map((d, i) => (
                  <DoctorCard
                    key={i}
                    {...d}
                    onBook={() => handleBookDoctor(d)}
                  />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%' }}>Không có thông tin bác sĩ</div>
              )}
            </div>
          </div>

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

                  thumbnail={p.thumbnail || p.imageUrl || p.image}
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
