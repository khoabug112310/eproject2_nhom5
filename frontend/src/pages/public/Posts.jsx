import React from 'react';

const mockPosts = [
  { title: 'Khám dịch vụ mới', slug: 'khám-dich-vu-moi' },
  { title: 'Lưu ý trước khi khám', slug: 'luu-y-truoc-khi-kham' },
];

export default function Posts() {
  return (
    <div className="posts-page">
      <h2>Tin tức</h2>
      <ul>
        {mockPosts.map(p => (
          <li key={p.slug}><a href={`/news/${p.slug}`}>{p.title}</a></li>
        ))}
      </ul>
    </div>
  );
}
