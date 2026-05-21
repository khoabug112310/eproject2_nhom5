import React from 'react';

export default function DoctorCard({avatar, fullName, specialization, rating, nextSlot, onBook}){
  return (
    <div className="card" style={{minWidth:220}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{width:56,height:56,borderRadius:8,background:'#f3f7ff'}}>
          {avatar ? <img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} /> : null}
        </div>
        <div>
          <div style={{fontWeight:600}}>{fullName}</div>
          <div style={{fontSize:13,color:'#666'}}>{specialization}</div>
          <div style={{fontSize:12,color:'#999'}}>{nextSlot ? `Next: ${nextSlot}` : 'No slots'}</div>
        </div>
      </div>
      <div style={{marginTop:8,display:'flex',justifyContent:'flex-end'}}>
        <button onClick={onBook} style={{padding:'8px 10px',borderRadius:6,background:'var(--color-primary)',color:'#fff',border:0}}>Đặt lịch</button>
      </div>
    </div>
  );
}
