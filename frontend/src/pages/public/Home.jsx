// Trang chủ (Home Page)
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { schedulingAPI, clinicalAPI, cmsAPI } from '../../services/api';
import QuickBooking from '../../components/QuickBooking';
import Hero from '../../components/Hero';
import DepartmentCard from '../../components/cards/DepartmentCard';
import DoctorCard from '../../components/cards/DoctorCard';
import PostCard from '../../components/cards/PostCard';

const [/* placeholder */] = [];


export default function Home() {
  const bookingRef = useRef();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function scrollToBooking(){
    bookingRef.current?.scrollIntoView({behavior:'smooth',block:'center'});
  }

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
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="app">
      <main>
        <Hero onPrimaryClick={scrollToBooking} />
        <div className="home-grid">
          <div className="main-column">
            <div className="card">
              <h3>Khoa nổi bật</h3>
              <div className="department-grid">
                {loading ? (
                  <div>Đang tải khoa...</div>
                ) : (departments.length ? departments.map((d,i)=>(<DepartmentCard key={i} {...d} />)) : <div>Không có khoa</div>)}
              </div>
            </div>

            <div className="card">
              <h3>Bác sĩ tiêu biểu</h3>
              <div className="doctor-carousel">
                {loading ? <div>Đang tải bác sĩ...</div> : (doctors.length ? doctors.slice(0,6).map((d,i)=>(<DoctorCard key={i} {...d} />)) : <div>Không có bác sĩ</div>)}
              </div>
            </div>

            <div className="card">
              <h3>Tin tức mới</h3>
              <div className="post-list">
                {loading ? <div>Đang tải tin...</div> : (posts.length ? posts.map((p,i)=>(<PostCard key={i} {...p} />)) : <div>Không có tin tức</div>)}
              </div>
            </div>
          </div>

          <aside className="aside-column">
            <div className="card" ref={bookingRef}>
              <QuickBooking doctors={doctors} departments={departments} />
            </div>
          </aside>
        </div>
        {error && <div style={{color:'red',marginTop:12}}>{error}</div>}
      </main>
    </div>
  );
}
