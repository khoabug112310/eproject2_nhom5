import React from 'react';

export default function DepartmentCard({name, departmentName, iconUrl, description, doctorCount, onViewDoctors}){
  const displayName = name || departmentName || 'Khoa';
  return (
    <div className="card">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:48,height:48,background:'#f0f8ff',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {iconUrl ? <img src={iconUrl} alt="" style={{width:28}} /> : <span>🏥</span>}
        </div>
        <div>
          <div style={{fontWeight:600}}>{displayName}</div>
          <div style={{fontSize:13,color:'#666'}}>{doctorCount || 0} bác sĩ</div>
        </div>
      </div>
      {description && <p style={{marginTop:8,color:'#666',fontSize:13}}>{description}</p>}
      <div style={{marginTop:8}}>
        <button onClick={onViewDoctors} style={{padding:'8px 10px',borderRadius:6,border:0,background:'#e9f5ff',cursor:'pointer'}}>Xem bác sĩ</button>
      </div>
    </div>
  );
}
