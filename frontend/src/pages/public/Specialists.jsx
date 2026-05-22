import React, { useEffect, useState, useRef } from 'react';
import QuickBooking from '../../components/QuickBooking';
import DoctorCard from '../../components/cards/DoctorCard';
import { clinicalAPI, schedulingAPI } from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Specialists() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const query = useQuery();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ref to scroll to booking section
  const bookingRef = useRef();

  // Prefill states for QuickBooking
  const [activeDoctor, setActiveDoctor] = useState('');
  const [activeDept, setActiveDept] = useState('');

  // Extract selected department from URL query string
  const selectedDeptName = query.get('dept') || 'All';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [docRes, depRes] = await Promise.all([
          clinicalAPI.getDoctors(),
          schedulingAPI.getDepartments()
        ]);
        if (!mounted) return;
        setDoctors(docRes.data?.data || []);
        setDepartments(depRes.data?.data || []);
      } catch (err) {
        console.error('Load data error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Update URL when clicking department pill
  const handleDepartmentPillClick = (deptName) => {
    if (deptName === 'All') {
      navigate('/specialists');
    } else {
      navigate(`/specialists?dept=${encodeURIComponent(deptName)}`);
    }
  };

  const handleBookDoctor = (doc) => {
    setActiveDoctor(doc.id || doc._id || '');
    // Find department ID that matches doctor's department name
    if (doc.department) {
      const matchDep = departments.find(dept => (dept.departmentName || dept.name) === doc.department);
      if (matchDep) {
        setActiveDept(matchDep._id);
      }
    }
    // Scroll smoothly to QuickBooking widget
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Filter Doctors by category (department) and search query (name)
  const filteredDoctors = doctors.filter(doc => {
    const matchesDept = selectedDeptName === 'All' || doc.department === selectedDeptName;
    const matchesSearch = String(doc.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="app">
      {/* Page Header Banner */}
      <div className="page-banner">
        <h2>Đội Ngũ Chuyên Gia Y Bác Sĩ</h2>
        <p>Phòng khám Đa Khoa Hợp Sơn Tài quy tụ đội ngũ bác sĩ, chuyên gia đầu ngành có trình độ học vị cao, tâm huyết với nghề và giàu kinh nghiệm điều trị thực tế.</p>
      </div>

      <div className="home-grid">
        <div className="main-column">
          
          <div className="card">
            {/* Search and Filters Bar */}
            <div className="search-filter-bar">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Tìm Kiếm Bác Sĩ</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Tìm thấy {filteredDoctors.length} bác sĩ phù hợp
                </span>
              </div>
              
              <div className="search-input-wrap">
                <svg className="search-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Nhập tên bác sĩ hoặc chuyên môn..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Department Pills Filter */}
            <div style={{ marginTop: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Lọc theo chuyên khoa:
              </div>
              <div className="filter-pills">
                <button 
                  className={`filter-pill ${selectedDeptName === 'All' ? 'active' : ''}`}
                  onClick={() => handleDepartmentPillClick('All')}
                >
                  Tất cả khoa
                </button>
                {departments.map((dept) => {
                  const name = dept.departmentName || dept.name;
                  return (
                    <button 
                      key={dept._id}
                      className={`filter-pill ${selectedDeptName === name ? 'active' : ''}`}
                      onClick={() => handleDepartmentPillClick(name)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doctors Grid */}
            <div className="doctor-grid">
              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  ⏳ Đang tải thông tin bác sĩ...
                </div>
              ) : filteredDoctors.length ? (
                filteredDoctors.map((doc) => (
                  <DoctorCard 
                    key={doc.id || doc._id} 
                    {...doc} 
                    onBook={() => handleBookDoctor(doc)} 
                  />
                ))
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>
                  📭 Không tìm thấy bác sĩ nào phù hợp với bộ lọc hiện tại.
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* QuickBooking sidebar */}
        <aside className="aside-column">
          <div ref={bookingRef}>
            <QuickBooking 
              doctors={doctors} 
              departments={departments} 
              initialDoctorId={activeDoctor}
              initialDepartmentId={activeDept}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
