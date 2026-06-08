import React from 'react';

export default function PostCard({ title, excerpt, date, thumbnail, onRead }) {
  const displayDate = date ? new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Mới cập nhật';

  return (
    <div className="post-card fade-in" onClick={onRead} style={{ cursor: 'pointer' }}>
      <div className="post-thumb-wrap">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextSibling;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light))',
          display: thumbnail ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px'
        }}>
          📰
        </div>
      </div>
      <div className="post-card-content">
        <div>
          <h4>{title}</h4>
          <p className="post-card-excerpt">{excerpt}</p>
        </div>
        <div className="post-card-footer">
          <span className="post-date">📅 {displayDate}</span>
          <button className="post-read-btn">
            Đọc bài
          </button>
        </div>
      </div>
    </div>
  );
}
