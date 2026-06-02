import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cmsAPI } from '../../services/api';
import PostCard from '../../components/cards/PostCard';

// Comprehensive mock posts for fallback and rich reading details
const MOCK_ARTICLE_DETAILS = {
  'khai-truong-phong-kham-hop-son-tai': {
    title: 'Khai trương Phòng khám Hợp Sơn Tài',
    excerpt: 'Chúng tôi hân hạnh thông báo khai trương phòng khám với đội ngũ chuyên môn cao và trang thiết bị y tế hiện đại.',
    date: new Date('2026-05-01'),
    thumbnailURL: '',
    author: 'Ban Quản Trị Lâm Sàng',
    category: 'Thông báo',
    content: `
      <p>Sau nhiều tháng chuẩn bị kỹ lưỡng về cả cơ sở vật chất lẫn nhân sự, Phòng Khám Đa Khoa Hợp Sơn Tài chính thức đi vào hoạt động. Với sứ mệnh kết hợp hài hòa giữa <strong>Y Học Cổ Truyền Việt Nam</strong> và <strong>Y Học Hiện Đại</strong>, chúng tôi tự hào đem đến dịch vụ chăm sóc sức khỏe chất lượng cao cho cộng đồng.</p>
      <p>Phòng khám được đầu tư đồng bộ với các máy siêu âm tim màu doppler nâng cao, thiết bị đo điện tâm đồ kỹ thuật số, hệ thống phân tích sinh hóa máu tự động và kho thuốc Đông y đa dạng, đạt tiêu chuẩn chất lượng khắt khe.</p>
      <p>Đặc biệt, đội ngũ y bác sĩ của chúng tôi là các chuyên gia giàu kinh nghiệm từng công tác tại các bệnh viện lớn toàn quốc, cam kết mang đến sự <strong>Thân Thiện - Tận Tâm - Hiệu Quả</strong> trong từng ca điều trị.</p>
      <p>Nhân dịp khai trương, phòng khám áp dụng chương trình ưu đãi giảm 20% các gói khám sức khỏe tổng quát và tặng sổ tay theo dõi sức khỏe gia đình miễn phí cho tất cả khách hàng đến thăm khám trong tháng đầu tiên.</p>
    `
  },
  'huong-dan-phong-chong-cam-cum': {
    title: 'Hướng dẫn phòng chống cảm cúm mùa hè',
    excerpt: 'Những biện pháp đơn giản để bảo vệ bản thân và gia đình trước các dịch bệnh hô hấp gia tăng đột biến trong mùa hè.',
    date: new Date('2026-05-15'),
    thumbnailURL: '',
    author: 'BS. Phạm Thị Linh',
    category: 'Kiến thức y khoa',
    content: `
      <p>Cảm cúm là bệnh truyền nhiễm đường hô hấp cấp tính phổ biến. Nhiều người lầm tưởng cúm chỉ xuất hiện vào mùa đông xuân, tuy nhiên, thời tiết nắng nóng oi bức của mùa hè kết hợp với việc sử dụng điều hòa nhiệt độ quá thấp lại là môi trường thuận lợi để virus cúm và vi khuẩn đường hô hấp sinh sôi mạnh mẽ.</p>
      <p>Để bảo vệ sức khỏe bản thân và các thành viên trong gia đình (đặc biệt là trẻ em và người cao tuổi có hệ miễn dịch yếu), hãy lưu ý các biện pháp phòng ngừa sau:</p>
      <ul>
        <li><strong>Rửa tay thường xuyên:</strong> Sử dụng xà phòng hoặc dung dịch sát khuẩn tay trước khi ăn và sau khi đi từ ngoài đường về.</li>
        <li><strong>Vệ sinh máy lạnh:</strong> Vệ sinh màng lọc điều hòa định kỳ để tránh tích tụ bụi bẩn và nấm mốc. Không để chênh lệch nhiệt độ trong phòng và ngoài trời vượt quá 7 độ C.</li>
        <li><strong>Bổ sung vitamin C và nước:</strong> Uống đủ từ 1.5 - 2 lít nước mỗi ngày. Tăng cường rau xanh, trái cây tươi giàu vitamin C (cam, bưởi, ổi) để nâng cao sức đề kháng.</li>
        <li><strong>Tiêm phòng cúm hàng năm:</strong> Đây là biện pháp phòng bệnh chủ động và hiệu quả nhất đã được Tổ chức Y tế Thế giới (WHO) khuyến nghị.</li>
      </ul>
      <p>Nếu xuất hiện các dấu hiệu như sốt cao đột ngột, ho khan kéo dài, đau mỏi cơ xương khớp, người bệnh cần đến ngay cơ sở y tế gần nhất để được thăm khám và chẩn đoán kịp thời, tránh tự ý mua thuốc kháng sinh tại nhà.</p>
    `
  },
  'khuyen-mai-kham-tong-quat': {
    title: 'Khuyến mãi khám sức khỏe tổng quát',
    excerpt: 'Ưu đãi gói khám tổng quát trong tháng đầu khai trương. Tầm soát bệnh lý chuyên sâu chỉ từ 600.000đ.',
    date: new Date('2026-05-08'),
    thumbnailURL: '',
    author: 'Phòng CSKH',
    category: 'Ưu đãi',
    content: `
      <p>Chủ động kiểm tra sức khỏe định kỳ 6 tháng một lần là chìa khóa vàng giúp phát hiện sớm các mầm mống bệnh lý nguy hiểm (tim mạch, tiểu đường, mỡ máu, thậm chí là ung thư) ngay từ khi chưa xuất hiện triệu chứng rõ rệt.</p>
      <p>Để tri ân sự ủng hộ của quý khách hàng đối với Phòng Khám Đa Khoa Hợp Sơn Tài, chúng tôi triển khai chương trình ưu đãi đặc biệt:</p>
      <blockquote>
        Giảm ngay 20% chi phí đăng ký các gói khám sức khỏe tổng quát định kỳ và gói tầm soát ung thư sớm trong khung giờ từ 13h - 17h hàng ngày.
      </blockquote>
      <p>Chương trình được áp dụng từ ngày 01/05/2026 đến hết ngày 31/05/2026 cho cả khách hàng đăng ký trực tuyến qua website và khách hàng đăng ký trực tiếp tại quầy đón tiếp.</p>
      <p>Quy trình thăm khám khép kín, nhanh gọn cùng đội ngũ điều dưỡng hỗ trợ tận tình sẽ mang lại trải nghiệm y tế nhẹ nhàng, thoải mái nhất cho quý khách.</p>
    `
  }
};

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract slug search query
  const query = new URLSearchParams(location.search);
  const selectedSlug = query.get('slug');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await cmsAPI.getPosts();
        if (!mounted) return;
        setPosts(res.data?.data || []);
      } catch (err) {
        console.error('Load posts error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Use dynamic list if available, else fallback to mock list keys
  const displayPostsList = posts.length ? posts : Object.keys(MOCK_ARTICLE_DETAILS).map(slug => ({
    slug,
    title: MOCK_ARTICLE_DETAILS[slug].title,
    excerpt: MOCK_ARTICLE_DETAILS[slug].excerpt,
    publishedAt: MOCK_ARTICLE_DETAILS[slug].date,
    thumbnailURL: MOCK_ARTICLE_DETAILS[slug].thumbnailURL
  }));

  const handleReadArticle = (slug) => {
    navigate(`/news?slug=${slug}`);
  };

  const handleBackToList = () => {
    navigate('/news');
  };

  // Find active article details
  const activeArticle = selectedSlug ? (
    MOCK_ARTICLE_DETAILS[selectedSlug] || 
    posts.find(p => p.slug === selectedSlug || p._id === selectedSlug)
  ) : null;

  return (
    <div className="app">
      {/* Detail article view */}
      {activeArticle ? (
        <div className="home-grid">
          <div className="main-column">
            <article className="post-detail-container">
              <div className="post-detail-cover">
                {activeArticle.thumbnailURL || activeArticle.thumbnail ? (
                  <img src={activeArticle.thumbnailURL || activeArticle.thumbnail} alt={activeArticle.title} />
                ) : (
                  <div className="post-detail-cover-fallback">📰</div>
                )}
              </div>
              
              <div className="post-detail-body">
                <button className="post-detail-back-btn" onClick={handleBackToList}>
                  ← Quay lại danh sách tin tức
                </button>
                
                <h1 className="post-detail-title">{activeArticle.title}</h1>
                
                <div className="post-detail-meta">
                  <span>📅 Đăng ngày: {new Date(activeArticle.publishedAt || activeArticle.date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>✍️ Tác giả: {activeArticle.author || 'Chuyên gia y khoa'}</span>
                  <span>🏷️ Chuyên mục: {activeArticle.category || 'Tin tức'}</span>
                </div>
                
                {activeArticle.content ? (
                  <div 
                    className="post-detail-content" 
                    dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                  />
                ) : (
                  <div className="post-detail-content">
                    <p>{activeArticle.excerpt}</p>
                    <p>Nội dung chi tiết của bài viết đang được cập nhật bởi ban quản trị lâm sàng. Vui lòng quay lại sau.</p>
                  </div>
                )}
              </div>
            </article>
          </div>
          
          <aside className="aside-column">
            <div className="card">
              <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                Tin tức liên quan
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(MOCK_ARTICLE_DETAILS)
                  .filter(slug => slug !== selectedSlug)
                  .slice(0, 3)
                  .map(slug => (
                    <li key={slug}>
                      <button 
                        onClick={() => handleReadArticle(slug)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: 'var(--color-primary)',
                          lineHeight: '1.4'
                        }}
                      >
                        {MOCK_ARTICLE_DETAILS[slug].title}
                      </button>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        📅 {new Date(MOCK_ARTICLE_DETAILS[slug].date).toLocaleDateString('vi-VN')}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        /* Listing Grid view */
        <div>
          <div className="page-banner">
            <h2>Tin Tức & Kiến Thức Y Khoa</h2>
            <p>Cập nhật những tin tức hoạt động mới nhất của phòng khám Hợp Sơn Tài cùng các bài viết hướng dẫn phòng ngừa, chăm sóc sức khỏe bổ ích từ chuyên gia y tế.</p>
          </div>

          <div className="home-grid">
            <div className="main-column">
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Tất Cả Bài Viết</h3>
                
                <div className="post-list">
                  {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                      ⏳ Đang tải bài viết...
                    </div>
                  ) : displayPostsList.length ? (
                    displayPostsList.map((p, index) => (
                      <PostCard 
                        key={index} 
                        title={p.title}
                        excerpt={p.excerpt}
                        date={p.publishedAt || p.date}
                        thumbnail={p.thumbnailURL || p.thumbnail}
                        onRead={() => handleReadArticle(p.slug || p._id)} 
                      />
                    ))
                  ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      📭 Chưa có tin tức nào được xuất bản.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="aside-column">
              <div className="card">
                <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>
                  Tại sao nên đọc?
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-body)', lineHeight: '1.6' }}>
                  Các bài viết trên website được biên soạn và kiểm duyệt bởi ban biên tập y khoa phòng khám đa khoa Hợp Sơn Tài, đảm bảo cung cấp thông tin chính xác, khách quan và đáng tin cậy.
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
