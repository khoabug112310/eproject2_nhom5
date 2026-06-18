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
    title: 'Grand Opening of Hopsontai Clinic',
    excerpt: 'We are delighted to announce the opening of our clinic with a highly qualified team and modern medical equipment.',
    date: new Date('2026-05-01'),
    thumbnailURL: '',
    author: 'Clinical Management Board',
    category: 'Announcement',
    content: `
      <p>After months of careful preparation in both facilities and staffing, Hopsontai General Clinic has officially begun operations. With a mission to harmoniously combine <strong>Vietnamese Traditional Medicine</strong> and <strong>Modern Medicine</strong>, we are proud to bring high-quality healthcare services to the community.</p>
      <p>The clinic is equipped with advanced color Doppler echocardiography machines, digital ECG devices, automated blood biochemistry analyzers, and a diverse traditional-medicine pharmacy that meets rigorous quality standards.</p>
      <p>In particular, our medical team consists of experienced specialists who previously worked at major hospitals nationwide, committed to delivering a <strong>Friendly, Dedicated, and Effective</strong> experience in every case.</p>
      <p>To mark the grand opening, the clinic is offering a 20% discount on general health check-up packages and a free family health-tracking booklet for all patients visiting during the first month.</p>
    `
  },
  'huong-dan-phong-chong-cam-cum': {
    title: 'How to Prevent the Flu in Summer',
    excerpt: 'Simple measures to protect yourself and your family against the surge in respiratory illnesses during summer.',
    date: new Date('2026-05-15'),
    thumbnailURL: '',
    author: 'Dr. Pham Thi Linh',
    category: 'Medical Knowledge',
    content: `
      <p>The flu is a common acute respiratory infection. Many people mistakenly believe the flu only appears in winter and spring; however, the hot, humid weather of summer combined with overly cold air-conditioning creates a favorable environment for flu viruses and respiratory bacteria to thrive.</p>
      <p>To protect your own health and that of your family members (especially children and the elderly with weaker immune systems), keep the following preventive measures in mind:</p>
      <ul>
        <li><strong>Wash your hands frequently:</strong> Use soap or hand sanitizer before eating and after returning home from outside.</li>
        <li><strong>Clean your air conditioner:</strong> Clean the AC filter regularly to avoid dust and mold buildup. Keep the difference between indoor and outdoor temperature under 7°C.</li>
        <li><strong>Get enough vitamin C and water:</strong> Drink 1.5–2 liters of water per day. Increase your intake of vegetables and fresh fruit rich in vitamin C (oranges, pomelos, guavas) to boost immunity.</li>
        <li><strong>Get an annual flu shot:</strong> This is the most proactive and effective preventive measure recommended by the World Health Organization (WHO).</li>
      </ul>
      <p>If symptoms such as sudden high fever, persistent dry cough, or muscle and joint aches appear, the patient should visit the nearest medical facility for timely examination and diagnosis, and avoid self-medicating with antibiotics at home.</p>
    `
  },
  'khuyen-mai-kham-tong-quat': {
    title: 'General Health Check-up Promotion',
    excerpt: 'A special offer on general check-up packages during our opening month. In-depth screening from just 600,000 VND.',
    date: new Date('2026-05-08'),
    thumbnailURL: '',
    author: 'Customer Care Department',
    category: 'Promotion',
    content: `
      <p>Proactively getting a health check-up every six months is the golden key to early detection of dangerous conditions (cardiovascular disease, diabetes, high cholesterol, even cancer) before clear symptoms appear.</p>
      <p>To thank our customers for their support of Hopsontai General Clinic, we are launching a special promotion:</p>
      <blockquote>
        Get an immediate 20% discount on periodic general health check-up packages and early cancer screening packages, daily from 1:00 PM to 5:00 PM.
      </blockquote>
      <p>The program runs from May 1, 2026 through May 31, 2026 for both customers booking online via the website and those registering directly at the reception desk.</p>
      <p>A streamlined, end-to-end examination process together with a caring nursing team will provide the most gentle and comfortable medical experience for you.</p>
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
    'phong-ngua-benh-tim-mach-mua-nong': 'Medical Knowledge',
    'cham-soc-rang-mieng-tre-em': 'Medical Knowledge',
    'dinh-duong-cho-tre-bieng-an': 'Medical Knowledge',
    'tam-quan-trong-kham-suc-khoe-dinh-ky': 'Promotion',
    'dong-tay-y-ket-hop-tri-dau-xuong-khop': 'Announcement',
    'viem-da-tiep-xuc-ngay-he': 'Medical Knowledge'
  };
  return mapping[slug] || 'News';
};

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
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
    const matchesCategory = activeCategory === 'All' || category.toLowerCase() === activeCategory.toLowerCase();
    
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
          }}>Medical news</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Medical News &amp; Knowledge
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Stay up to date with the latest news from Hopsontai Clinic, along with helpful prevention and health-care guides from our medical experts.
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
                  Back to news list
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
                    Published: {new Date(activeArticle.publishedAt || activeArticle.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '14px', height: '14px', color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Author: {activeArticle.author || 'Medical Expert'}
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
                    <p>The full content of this article is being updated by the clinical management board. Please check back later.</p>
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
                Health Consultation
              </h4>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: '0 0 16px 0' }}>
                Our team of specialist doctors is always ready to support and provide health consultations online and on-site.
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
                Quick Booking
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
                Related news
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
                            📅 {new Date(art.date).toLocaleDateString('en-US')}
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
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', color: '#1e293b' }}>Article List</h3>

                <div className="post-list">
                  {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                      ⏳ Loading articles...
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
                      📭 No articles have been published yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="aside-column">
              {/* Why read card */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', marginTop: 0, color: '#1e293b' }}>
                  Why read this?
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
                  The medical articles and announcements on this website are curated, written, and reviewed by the professional editorial board of Hopsontai General Clinic, ensuring accurate and reliable medical knowledge that helps you and your family take proactive care of your health every day.
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
                  Health Consultation
                </h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', margin: '0 0 16px 0' }}>
                  Our team of specialist doctors is always ready to support and provide health consultations online and on-site.
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
                  Book Appointment Now
                </button>
              </div>

              {/* Emergency Hotline card */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px', marginTop: 0, color: '#1e293b' }}>
                  📞 Hotline &amp; 24/7 Support
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#e0f2fe', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary, #3b82f6)' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consultation hotline</div>
                      <div style={{ fontSize: '15px', color: '#0f766e', fontWeight: '800' }}>091-444-4444</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#f0fdf4', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>⏰</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Working hours</div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>07:00 – 20:00 (Mon – Sun)</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', background: '#faf5ff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>📍</span>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: '600' }}>123 Nguyen Trai, District 5, HCMC</div>
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
