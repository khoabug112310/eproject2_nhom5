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
  const query = useQuery();
  const navigate = useNavigate();
  
  // Ref to scroll to booking section
  const bookingRef = useRef();

  // Prefill states for QuickBooking
  const [activeDoctor, setActiveDoctor] = useState('');
  const [activeDept, setActiveDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    // Find the department ID that matches the doctor's department name
    const deptObj = departments.find(d => (d.departmentName || d.name) === doc.department);
    const deptId = deptObj ? deptObj._id : '';

    // Open the Quick Booking modal popup with prefilled doctor info
    window.dispatchEvent(new CustomEvent('open-booking-modal', {
      detail: {
        doctorId: doc.id || doc._id || '',
        departmentId: deptId
      }
    }));
  };

  const removeDiacritics = (str) => {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Filter Doctors by category (department) AND search query
  const filteredDoctors = doctors.filter(doc => {
    // 1. Filter by Department Pill
    const matchDept = selectedDeptName === 'All' || doc.department === selectedDeptName;
    if (!matchDept) return false;

    // 2. Filter by Search Query
    if (!searchQuery.trim()) return true;
    const queryStr = removeDiacritics(searchQuery);
    const normalizedName = removeDiacritics(doc.fullName);
    return normalizedName.includes(queryStr);
  });

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. HERO BANNER */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'linear-gradient(135deg, var(--color-primary-dark, #0f766e) 0%, var(--color-secondary-dark, #0e7490) 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
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
          }}>Our team</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Our Team of Medical Specialists
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Hopsontai General Clinic brings together a team of leading doctors and specialists with advanced degrees, deep dedication to their profession, and extensive clinical treatment experience.
          </p>
        </div>
      </section>

      {/* 2. BODY CONTENT SECTION */}
      <section style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          width: '100%'
        }}>
          
          {/* Main Doctors Column */}
          <div>
            {/* Filter and Search Card */}
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
              marginBottom: '30px'
            }}>
              {/* Search input for doctors */}
              <div style={{
                position: 'relative',
                width: '100%',
                marginBottom: '20px'
              }}>
                <input 
                  type="text" 
                  placeholder="Search doctors by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: '#1e293b',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary, #0d9488)';
                    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <svg 
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '13px',
                    width: '18px',
                    height: '18px',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Department Filter Pills */}
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase', 
                  color: '#64748b', 
                  marginBottom: '10px', 
                  letterSpacing: '0.5px' 
                }}>
                  Filter by department:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleDepartmentPillClick('All')}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '50px',
                      border: '1px solid',
                      borderColor: selectedDeptName === 'All' ? 'var(--color-primary, #0d9488)' : '#e2e8f0',
                      backgroundColor: selectedDeptName === 'All' ? 'var(--color-primary-light, #f0fdfa)' : 'white',
                      color: selectedDeptName === 'All' ? 'var(--color-primary, #0d9488)' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                  >
                    All departments
                  </button>
                  {departments.map((dept) => {
                    const name = dept.departmentName || dept.name;
                    const isActive = selectedDeptName === name;
                    return (
                      <button 
                        key={dept._id}
                        onClick={() => handleDepartmentPillClick(name)}
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '50px',
                          border: '1px solid',
                          borderColor: isActive ? 'var(--color-primary, #0d9488)' : '#e2e8f0',
                          backgroundColor: isActive ? 'var(--color-primary-light, #f0fdfa)' : 'white',
                          color: isActive ? 'var(--color-primary, #0d9488)' : '#475569',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Doctors Grid Container wrapped in a card frame wrapper */}
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '40px 32px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
              marginBottom: '30px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                {loading ? (
                  <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1', color: '#64748b', fontWeight: '600' }}>
                    ⏳ Loading doctors...
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
                  <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1', color: '#64748b' }}>
                    📭 No doctors match the current filters.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
