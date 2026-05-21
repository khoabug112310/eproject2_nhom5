import React from 'react';

export default function PostCard({title, excerpt, date, thumbnail, onRead}){
  return (
    <div className="card">
      {thumbnail && <img src={thumbnail} alt="" style={{width:'100%',height:120,objectFit:'cover',borderRadius:6}} />}
      <h4 style={{margin:'8px 0 4px'}}>{title}</h4>
      <div style={{fontSize:13,color:'#666'}}>{excerpt}</div>
      <div style={{marginTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <small style={{color:'#999'}}>{date}</small>
        <button onClick={onRead} style={{padding:'6px 8px',borderRadius:6,border:0,background:'#f0f4ff'}}>Xem</button>
      </div>
    </div>
  );
}
