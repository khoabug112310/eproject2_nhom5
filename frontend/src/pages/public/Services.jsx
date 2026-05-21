import React from 'react';
import QuickBooking from '../../components/QuickBooking';

export default function Services() {
  const vip = {
    departmentName: 'Phòng khám VIP',
  };

  return (
    <div className="services-page">
      <h2>Dịch vụ đặc biệt</h2>
      <p>Phòng VIP - phục vụ nhanh và chu đáo, cơ sở vật chất đầy đủ.</p>

      <div className="vip-card">
        <h3>Gói VIP</h3>
        <ul>
          <li>Ưu tiên khám</li>
          <li>Phòng riêng</li>
          <li>Thời gian khám kéo dài hơn</li>
        </ul>
      </div>

      <aside>
        <QuickBooking departments={[vip]} />
      </aside>
    </div>
  );
}
