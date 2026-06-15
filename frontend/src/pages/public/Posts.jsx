import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cmsAPI } from '../../services/api';
import PostCard from '../../components/cards/PostCard';
import postPlaceholder1 from '../../images/hero1.jpg';
import postPlaceholder2 from '../../images/hero2.jpg';
import postPlaceholder3 from '../../images/hero3.jpg';

const POST_PLACEHOLDERS = [postPlaceholder1, postPlaceholder2, postPlaceholder3];

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
      <p>If xuất hiện các dấu hiệu như sốt cao đột ngột, ho khan kéo dài, đau mỏi cơ xương khớp, người bệnh cần đến ngay cơ sở y tế gần nhất để được thăm khám và chẩn đoán kịp thời, tránh tự ý mua thuốc kháng sinh tại nhà.</p>
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

const getPostCategory = (post) => {
  if (post.category) return post.category;
  const slug = post.slug || '';
  if (MOCK_ARTICLE_DETAILS[slug]?.category) {
    return MOCK_ARTICLE_DETAILS[slug].category;
  }
  const mapping = {
    'phong-ngua-benh-tim-mach-mua-nong': 'Kiến thức y khoa',
    'cham-soc-rang-mieng-tre-em': 'Kiến thức y khoa',
    'dinh-duong-cho-tre-bieng-an': 'Kiến thức y khoa',
    'tam-quan-trong-kham-suc-khoe-dinh-ky': 'Ưu đãi',
    'dong-tay-y-ket-hop-tri-dau-xuong-khop': 'Thông báo',
    'viem-da-tiep-xuc-ngay-he': 'Kiến thức y khoa'
  };
  return mapping[slug] || 'Tin tức';
};

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  
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

  // Filter posts based on search query and category
  const filteredPosts = displayPostsList.filter(p => {
    const titleMatch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const excerptMatch = p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesSearch = titleMatch || excerptMatch;
    
    const category = getPostCategory(p);
    const matchesCategory = activeCategory === 'Tất cả' || category.toLowerCase() === activeCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

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
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* 1. HERO BANNER */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'linear-gradient(135deg, var(--color-primary-dark, #1e3a8a) 0%, var(--color-secondary-dark, #0f766e) 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background overlay circles */}
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }} className="fade-in">
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '2px', 
            background: 'rgba(255,255,255,0.18)', 
            padding: '6px 16px', 
            borderRadius: '50px',
            display: 'inline-block',
            marginBottom: '20px'
          }}>Tin tức y khoa</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Tin Tức &amp; Kiến Thức Y Khoa
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Cập nhật những tin tức hoạt động mới nhất của phòng khám Hợp Sơn Tài cùng các bài viết hướng dẫn phòng ngừa, chăm sóc sức khỏe bổ ích từ chuyên gia y tế.
          </p>
        </div>
      </section>

      {/* 2. BODY CONTENT SECTION */}
      <section style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {activeArticle ? (
        <div className="home-grid">
          <div className="main-column">
            <article className="post-detail-container" style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
              overflow: 'hidden',
              marginBottom: '32px'
            }}>
              <div className="post-detail-cover" style={{ height: '320px', position: 'relative', overflow: 'hidden' }}>
                {activeArticle.thumbnailURL || activeArticle.thumbnail || activeArticle.imageUrl || activeArticle.image ? (
                  <img 
                    src={activeArticle.thumbnailURL || activeArticle.thumbnail || activeArticle.imageUrl || activeArticle.image} 
                    alt={activeArticle.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="post-detail-cover-fallback" style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--color-primary-light, #eff6ff), var(--color-secondary-light, #f0fdfa))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px'
                  }}>📰</div>
                )}
              </div>
              
              <div className="post-detail-body" style={{ padding: '32px' }}>
                <button 
                  className="post-detail-back-btn" 
                  onClick={handleBackToList}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--color-primary, #3b82f6)',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    padding: 0,
                    transition: 'transform 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Quay lại danh sách tin tức
                </button>
                
                <h1 className="post-detail-title" style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#1e293b',
                  lineHeight: '1.3',
                  margin: '0 0 16px 0'
                }}>{activeArticle.title}</h1>
                
                <div className="post-detail-meta" style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '12px',
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '16px',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                  fontWeight: '600'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '14px', height: '14px', color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Đăng ngày: {new Date(activeArticle.publishedAt || activeArticle.date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '14px', height: '14px', color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Tác giả: {activeArticle.author || 'Chuyên gia y khoa'}
                  </span>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    color: 'var(--color-primary, #3b82f6)',
                    backgroundColor: 'var(--color-primary-light, #eff6ff)',
                    padding: '2px 8px',
                    borderRadius: '50px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    <svg style={{ width: '12px', height: '12px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {getPostCategory(activeArticle)}
                  </span>
                </div>
                
                {activeArticle.content ? (
                  <div 
                    className="post-detail-content" 
                    style={{ fontSize: '15px', color: '#334155', lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: activeArticle.content }}
                  />
                ) : (
                  <div className="post-detail-content" style={{ fontSize: '15px', color: '#334155', lineHeight: '1.8' }}>
                    <p>{activeArticle.excerpt}</p>
                    <p>Nội dung chi tiết của bài viết đang được cập nhật bởi ban quản trị lâm sàng. Vui lòng quay lại sau.</p>
                  </div>
                )}
              </div>
            </article>
          </div>
          
          <aside className="aside-column">
            {/* Booking CTA card */}
            <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ 
                fontSize: '15px', 
                fontWeight: '800', 
                color: '#1e293b', 
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '12px', 
                marginBottom: '16px',
                marginTop: 0
              }}>
                Tư vấn sức khỏe
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: '0 0 16px 0' }}>
                Đội ngũ bác sĩ chuyên khoa của chúng tôi luôn sẵn sàng hỗ trợ, tư vấn sức khỏe trực tuyến và tại chỗ.
              </p>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
                  e.currentTarget.style.filter = 'brightness(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                Đặt lịch khám nhanh
              </button>
            </div>

            {/* Related articles card */}
            <div className="card" style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ 
                fontSize: '15px', 
                fontWeight: '800', 
                color: '#1e293b', 
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '12px', 
                marginBottom: '16px',
                marginTop: 0
              }}>
                Tin tức liên quan
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.keys(MOCK_ARTICLE_DETAILS)
                  .filter(slug => slug !== selectedSlug)
                  .slice(0, 3)
                  .map((slug, idx) => {
                    const art = MOCK_ARTICLE_DETAILS[slug];
                    const thumb = art.thumbnailURL || art.thumbnail || art.imageUrl || art.image || POST_PLACEHOLDERS[idx % POST_PLACEHOLDERS.length];
                    return (
                      <div 
                        key={slug} 
                        onClick={() => handleReadArticle(slug)}
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          cursor: 'pointer',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.querySelector('h5').style.color = 'var(--color-primary, #3b82f6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.querySelector('h5').style.color = '#1e293b';
                        }}
                      >
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          flexShrink: 0
                        }}>
                          <img 
                            src={thumb} 
                            alt={art.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light))'
                          }}>📰</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h5 style={{ 
                            margin: 0, 
                            fontSize: '13px', 
                            fontWeight: '700', 
                            color: '#1e293b', 
                            lineHeight: '1.4',
                            transition: 'color 0.2s ease'
                          }}>
                            {art.title}
                          </h5>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            📅 {new Date(art.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="home-grid">
            <div className="main-column">
              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: '#1e293b' }}>Danh Sách Bài Viết</h3>
                
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
                        thumbnail={p.thumbnailURL || p.thumbnail || p.imageUrl || p.image || POST_PLACEHOLDERS[index % POST_PLACEHOLDERS.length]}
                        onRead={() => handleReadArticle(p.slug || p._id)} 
                      />
                    ))
                  ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                      📭 Chưa có bài viết nào được xuất bản.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="aside-column">
              {/* Why read card */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', marginTop: 0, color: '#1e293b' }}>
                  Tại sao nên đọc?
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
                  Các bài viết y khoa và thông báo trên website được tuyển chọn, biên soạn và kiểm duyệt bởi ban biên tập chuyên môn của Phòng Khám Đa Khoa Hợp Sơn Tài, đảm bảo đem đến những kiến thức y khoa chính xác, đáng tin cậy giúp bạn và gia đình chủ động chăm sóc sức khỏe mỗi ngày.
                </p>
              </div>

              {/* Booking CTA card */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ 
                  fontSize: '15px', 
                  fontWeight: '800', 
                  color: '#1e293b', 
                  borderBottom: '1px solid #f1f5f9', 
                  paddingBottom: '12px', 
                  marginBottom: '16px',
                  marginTop: 0
                }}>
                  Tư vấn sức khỏe
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: '0 0 16px 0' }}>
                  Đội ngũ bác sĩ chuyên khoa của chúng tôi luôn sẵn sàng hỗ trợ, tư vấn sức khỏe trực tuyến và tại chỗ.
                </p>
                
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-dark, #1d4ed8) 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
                    e.currentTarget.style.filter = 'brightness(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  Đặt Lịch Khám Ngay
                </button>
              </div>

              {/* Emergency Hotline card */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', marginTop: 0, color: '#1e293b' }}>
                  📞 Hotline & Hỗ Trợ 24/7
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#e0f2fe', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary, #3b82f6)' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng đài tư vấn</div>
                      <div style={{ fontSize: '15px', color: '#0f766e', fontWeight: '800' }}>091-444-4444</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#f0fdf4', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>⏰</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giờ hoạt động</div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>07:00 – 20:00 (T2 – CN)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#faf5ff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>📍</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Địa chỉ</div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>123 Nguyễn Trãi, Q.5, TP.HCM</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
      )}
      </section>
    </div>
  );
}
