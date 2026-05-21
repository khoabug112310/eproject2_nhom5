import React from 'react';

export default function Hero({onPrimaryClick}){
  return (
    <section className="hero card">
      <div className="hero-content">
        <h1>Chăm sóc sức khỏe tận tâm — đặt lịch nhanh, tiện lợi</h1>
        <p>Đội ngũ bác sĩ chuyên môn cao, trang thiết bị hiện đại. Đặt lịch khám trong vài bước đơn giản.</p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={onPrimaryClick}>Đặt lịch ngay</button>
          <button className="btn-ghost">Xem khoa</button>
        </div>
      </div>
      <div className="hero-visual" style={{width:320, height:180, background:'#eef6ff', borderRadius:8}}>
        {/* placeholder for illustration */}
      </div>
    </section>
  );
}
