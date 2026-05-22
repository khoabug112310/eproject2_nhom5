import React, { useEffect, useState } from 'react';
import QuickBooking from '../../components/QuickBooking';
import DepartmentCard from '../../components/cards/DepartmentCard';
import { schedulingAPI } from '../../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter departments based on search query
  const filteredDepts = departments.filter(d => 
    String(d.departmentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      {/* Page Header Banner */}
      <div className="page-banner">
        <h2>Chuyên Khoa Lâm Sàng</h2>
        <p>Phòng Khám Hợp Sơn Tài quy tụ các chuyên khoa lâm sàng đa dạng, kết hợp tinh hoa Y Học Cổ Truyền và trang thiết bị hiện đại để chăm sóc sức khỏe toàn diện cho gia đình bạn.</p>
      </div>

      <div className="home-grid">
        <div className="main-column">
          
          {/* Search and Title Bar */}
          <div className="card">
            <div className="search-filter-bar">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Danh Sách Chuyên Khoa</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Tìm thấy {filteredDepts.length} chuyên khoa phù hợp
                </span>
              </div>
              
              <div className="search-input-wrap">
                <svg className="search-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm chuyên khoa..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Department Grid */}
            <div className="department-grid" style={{ marginTop: '16px' }}>
              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  ⏳ Đang tải danh sách chuyên khoa...
                </div>
              ) : filteredDepts.length ? (
                filteredDepts.map((d) => (
                  <DepartmentCard 
                    key={d._id} 
                    {...d} 
                    onViewDoctors={() => {
                      window.location.href = `/specialists?dept=${encodeURIComponent(d.departmentName)}`;
                    }} 
                  />
                ))
              ) : (
                <div style={{ padding: '48px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>
                  📭 Không tìm thấy chuyên khoa nào phù hợp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* QuickBooking Aside Sidebar */}
        <aside className="aside-column">
          <QuickBooking departments={departments} />
        </aside>
      </div>
    </div>
  );
}
