import React, { useEffect, useState } from 'react';
import QuickBooking from '../../components/QuickBooking';
import { schedulingAPI } from '../../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="departments-page">
      <h2>Chuyên khoa</h2>
      <p>Danh sách các chuyên khoa của phòng khám.</p>

      <div className="dept-list">
        {loading ? <div>Đang tải...</div> : (departments.length ? departments.map(d => (
          <div key={d._id} className="dept-card">
            <h4>{d.departmentName}</h4>
            <p>{d.description || `Mô tả ngắn về ${d.departmentName}.`}</p>
            <div style={{fontSize:13,color:'#666'}}>{d.doctorCount || 0} bác sĩ</div>
            <a href={`/specialists?dept=${encodeURIComponent(d.departmentName)}`}>Xem chuyên gia</a>
          </div>
        )) : <div>Không có khoa</div>)}
      </div>

      <aside>
        <QuickBooking departments={departments} />
      </aside>
    </div>
  );
}
