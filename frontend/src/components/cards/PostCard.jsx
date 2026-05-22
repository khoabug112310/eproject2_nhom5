import React from 'react';

export default function PostCard({ title, excerpt, date, thumbnail, onRead }) {
  const displayDate = date ? new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Mới cập nhật';

  return (
    <div className="post-card fade-in">
      <div className="post-thumb-wrap">
        {thumbnail ? (
          <img src={thumbnail} alt={title} onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            📰
          </div>
        )}
      </div>
      <div className="post-card-content">
        <div>
          <h4>{title}</h4>
          <p className="post-card-excerpt">{excerpt}</p>
        </div>
        <div className="post-card-footer">
          <span className="post-date">📅 {displayDate}</span>
          <button className="post-read-btn" onClick={onRead}>
            Đọc bài
          </button>
        </div>
      </div>
    </div>
  );
}
