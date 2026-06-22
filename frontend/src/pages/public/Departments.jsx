import React, { useEffect, useState, useRef } from 'react';
import DepartmentCard from '../../components/cards/DepartmentCard';
import { schedulingAPI } from '../../services/api';

const filterTabs = [
  { id: 'all', name: 'All Specialties' },
  { id: 'internal', name: 'Internal Medicine & Cardiology' },
  { id: 'external', name: 'Surgery & Dermatology' },
  { id: 'maternity', name: 'Obstetrics & Pediatrics' },
  { id: 'specialty', name: 'Traditional & Sub-specialties' }
];

// Helper function to remove Vietnamese diacritics for search matching
const removeDiacritics = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const sectionRef = useRef(null);

  // Scroll to section when page changes so that the user sees the full content from the start
  useEffect(() => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Reset page to 1 when filters or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

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

  // Filter departments by tab AND search query
  const getFilteredDepts = () => {
    const normalizedQuery = removeDiacritics(searchQuery);
    return departments.filter(d => {
      const name = String(d.departmentName || '');
      const desc = String(d.description || '');
      
      const normalizedName = removeDiacritics(name);
      const normalizedDesc = removeDiacritics(desc);
      
      // 1. Check Search Query (diacritics-insensitive match)
      const matchesSearch = normalizedName.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);

      if (!matchesSearch) return false;

      // 2. Check Tab Filter
      const lowerName = name.toLowerCase();
      if (activeTab === 'all') return true;
      if (activeTab === 'internal') {
        return lowerName.includes('medicine') || lowerName.includes('cardiology') || lowerName.includes('nội') || lowerName.includes('tim') || lowerName.includes('mạch');
      }
      if (activeTab === 'external') {
        return lowerName.includes('surgery') || lowerName.includes('dermatology') || lowerName.includes('ngoại') || lowerName.includes('da');
      }
      if (activeTab === 'maternity') {
        return lowerName.includes('obstetric') || lowerName.includes('gynecology') || lowerName.includes('pediatric') || lowerName.includes('sản') || lowerName.includes('phụ') || lowerName.includes('nhi');
      }
      if (activeTab === 'specialty') {
        return lowerName.includes('traditional') || lowerName.includes('dental') || lowerName.includes('stomatology') || lowerName.includes('odonto') || lowerName.includes('ent') || lowerName.includes('otorhinolaryngology') || lowerName.includes('eye') || lowerName.includes('ophthalmology') || lowerName.includes('cổ truyền') || lowerName.includes('đông y') || lowerName.includes('tai') || lowerName.includes('họng') || lowerName.includes('răng') || lowerName.includes('nha') || lowerName.includes('mắt');
      }
      return true;
    });
  };

  const filteredDepts = getFilteredDepts();

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
          }}>Clinical specialties</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            A Comprehensive Range of Specialties
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Hopsontai brings together a diverse range of clinical specialties, combining the essence of traditional medicine with the most modern equipment to provide comprehensive, optimal care for you and your family.
          </p>
        </div>
      </section>

      {/* 2. MAIN GRID & FILTERS CONTAINER */}
      <section ref={sectionRef} style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Search and Tabs Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Header section with counts and search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Department List</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                {filteredDepts.length} departments match your filters
              </p>
            </div>

            {/* Search Input */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '360px'
            }}>
              <input 
                type="text" 
                placeholder="Quick search departments..."
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
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
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
          </div>

          {/* Quick Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '12px'
          }}>
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '50px',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isActive ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                    color: isActive ? 'var(--color-primary, #3b82f6)' : '#64748b',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%'
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1', color: '#64748b', fontWeight: '600' }}>
              ⏳ Loading departments...
            </div>
          ) : filteredDepts.length ? (
            filteredDepts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((d) => (
              <DepartmentCard 
                key={d._id} 
                {...d} 
                onViewDoctors={() => {
                  window.location.href = `/specialists?dept=${encodeURIComponent(d.departmentName)}`;
                }} 
              />
            ))
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1', color: '#64748b' }}>
              📭 No departments match the current filters.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredDepts.length > ITEMS_PER_PAGE && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '40px',
            flexWrap: 'wrap'
          }}>
            {/* Prev Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.ceil(filteredDepts.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((pageNum) => {
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: isActive ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #e2e8f0',
                    backgroundColor: isActive ? 'var(--color-primary, #3b82f6)' : 'white',
                    color: isActive ? 'white' : '#1e293b',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                      e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#1e293b';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredDepts.length / ITEMS_PER_PAGE)))}
              disabled={currentPage === Math.ceil(filteredDepts.length / ITEMS_PER_PAGE)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: currentPage === Math.ceil(filteredDepts.length / ITEMS_PER_PAGE) ? '#cbd5e1' : '#64748b',
                cursor: currentPage === Math.ceil(filteredDepts.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== Math.ceil(filteredDepts.length / ITEMS_PER_PAGE)) {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.color = 'var(--color-primary, #3b82f6)';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== Math.ceil(filteredDepts.length / ITEMS_PER_PAGE)) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* 3. CORPORATE ADVANTAGES SECTION */}
      <section style={{
        padding: '80px 20px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>
              Our Commitment to Service Quality
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Every department at Hopsontai operates to the most rigorous standards
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {/* Box 1 */}
            <div style={{
              background: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔬</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>State-of-the-art equipment</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#64748b', margin: 0 }}>
                Our ultrasound, digital X-ray, and laboratory systems are imported directly from the US and Germany, delivering fast diagnostic results with the highest accuracy.
              </p>
            </div>

            {/* Box 2 */}
            <div style={{
              background: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>👩‍⚕️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>Team of specialists</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#64748b', margin: 0 }}>
                A team of Associate Professors, Doctors of Medicine, and Level I and II specialists from leading national hospitals, always ready to advise with empathy and medical ethics.
              </p>
            </div>

            {/* Box 3 */}
            <div style={{
              background: 'white',
              padding: '32px 24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🤝</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 10px 0' }}>Streamlined process</h3>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#64748b', margin: 0 }}>
                Booking online in advance means patients no longer waste hours waiting in line. Administrative procedures are handled quickly, with flexible payment options.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}