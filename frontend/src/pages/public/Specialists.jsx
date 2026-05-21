import React, { useEffect, useState } from 'react';
import QuickBooking from '../../components/QuickBooking';
import { clinicalAPI } from '../../services/api';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Specialists() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = useQuery();
  const dept = query.get('dept');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await clinicalAPI.getDoctors();
        if (!mounted) return;
        let items = res.data?.data || [];
        if (dept) items = items.filter(d => d.department === dept);
        setDoctors(items);
      } catch (err) {
        console.error('Load doctors error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [dept]);

  return (
    <div className="specialists-page">
      <h2>Chuyên gia</h2>
      <p>Danh sách bác sĩ chuyên gia theo chuyên khoa.</p>

      <div className="doctor-list">
        {loading ? <div>Đang tải...</div> : (doctors.length ? doctors.map(d => (
          <div key={d.id} className="doctor-card">
            <h4>{d.fullName}</h4>
            <p>Chuyên khoa: {d.specialization}</p>
            <a href={`/specialist/${encodeURIComponent(d.fullName)}`}>Xem chi tiết / Đặt lịch</a>
          </div>
        )) : <div>Không có bác sĩ</div>)}
      </div>

      <aside>
        <QuickBooking doctors={doctors} />
      </aside>
    </div>
  );
}
