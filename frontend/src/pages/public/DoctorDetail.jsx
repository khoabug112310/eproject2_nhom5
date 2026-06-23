import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { profilesAPI, reviewAPI } from '../../services/api';

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Reviews & ratings state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await reviewAPI.getDoctorReviews(id);
      if (res.data?.success && res.data?.data) {
        const list = res.data.data;
        setReviews(list);
        if (list.length > 0) {
          const sum = list.reduce((acc, r) => acc + r.rating, 0);
          setAverageRating((sum / list.length).toFixed(1));
        } else {
          setAverageRating(5.0);
        }
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (id) {
      loadReviews();
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await profilesAPI.getDoctor(id);
        if (!mounted) return;
        if (res.data?.success && res.data?.data) {
          setDoctor(res.data.data);
        } else {
          setError('Doctor profile not found.');
        }
      } catch (err) {
        console.error('Fetch doctor detail error:', err);
        if (mounted) {
          setError(err.response?.data?.message || 'Error loading doctor profile.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleBook = () => {
    if (!doctor) return;
    const deptId = doctor.departmentId?._id || doctor.departmentId || '';
    window.dispatchEvent(
      new CustomEvent('open-booking-modal', {
        detail: {
          doctorId: doctor._id || doctor.id || '',
          departmentId: deptId,
        },
      })
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    if (!commentInput.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá.');
      setSubmittingReview(false);
      return;
    }

    try {
      const res = await reviewAPI.submitReview({
        doctorId: id,
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      if (res.data?.success) {
        setReviewSuccess('Đăng đánh giá thành công!');
        setCommentInput('');
        setRatingInput(5);
        loadReviews();
      } else {
        setReviewError(res.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
      }
    } catch (err) {
      console.error(err);
      setReviewError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'BS';
    const clean = String(name)
      .replace(/(PGS\.TS\.BS\.|PGS\.TS\.|TS\.BS\.|ThS\.BS\.|BS\.CKII\.|BS\.CKI\.|BS\.)/g, '')
      .trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Contact for details';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', color: '#64748b' }}>
        <span className="btn-spinner" style={{ width: '40px', height: '40px', borderWidth: '3.5px', borderTopColor: 'var(--color-primary, #2563eb)' }}></span>
        <p style={{ fontWeight: '600', fontSize: '15px', letterSpacing: '0.5px' }}>Loading specialist profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '50px 30px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '56px', display: 'block', marginBottom: '20px' }}>⚠️</span>
        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Profile Not Found</h3>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>{error || "We couldn't retrieve the details for this doctor. It might have been updated or removed."}</p>
        <button 
          onClick={() => navigate('/specialists')}
          style={{
            padding: '12px 24px',
            fontSize: '14.5px',
            fontWeight: '700',
            borderRadius: '12px',
            background: 'var(--color-primary, #2563eb)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.05)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'none';
          }}
        >
          Back to Specialists
        </button>
      </div>
    );
  }

  const initials = getInitials(doctor.fullName);
  const avatar = doctor.avatarURL;
  const deptName = doctor.departmentId?.departmentName || doctor.department || 'General Clinic';

  const premiumStyles = `
    .doctor-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 16px 80px 16px;
      box-sizing: border-box;
    }
    
    /* Breadcrumbs styling */
    .premium-breadcrumbs {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .breadcrumbs-list {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      color: #64748b;
    }
    .breadcrumbs-link {
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .breadcrumbs-link:hover {
      color: var(--color-primary, #2563eb);
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      color: #334155;
      font-weight: 700;
      font-size: 13.5px;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }
    .back-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      transform: translateX(-2px);
    }

    /* Layout structure */
    .doctor-premium-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .doctor-premium-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .sticky-sidebar {
        position: relative !important;
        top: 0 !important;
      }
    }

    /* Sidebar styling */
    .sticky-sidebar {
      position: sticky;
      top: 100px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .profile-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
    }
    .profile-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%);
    }
    .avatar-wrapper {
      position: relative;
      width: 100%;
      height: 340px;
      border-radius: 20px;
      overflow: hidden;
      background-color: #f1f5f9;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.04);
      border: 1px solid #f1f5f9;
      transition: transform 0.3s ease;
    }
    .avatar-wrapper:hover {
      transform: scale(1.01);
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .avatar-wrapper:hover .avatar-img {
      transform: scale(1.03);
    }
    
    .rating-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fef9c3;
      color: #713f12;
      font-size: 13.5px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 12px;
      margin-bottom: 20px;
      align-self: flex-start;
      border: 1px solid #fef08a;
    }

    /* Details List */
    .sidebar-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 20px;
      border: 1.5px solid #edf2f7;
      margin-bottom: 24px;
    }
    .detail-item {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .detail-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      color: var(--color-primary, #2563eb);
      flex-shrink: 0;
    }
    .detail-text {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      font-size: 12.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .detail-value {
      font-size: 14.5px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Call To Action */
    .primary-book-btn {
      width: 100%;
      padding: 16px 24px;
      font-size: 14.5px;
      font-weight: 800;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%);
      color: white;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
      position: relative;
    }
    .primary-book-btn:hover {
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.35);
      transform: translateY(-2px);
      filter: brightness(1.05);
    }
    .primary-book-btn:active {
      transform: translateY(0);
    }

    /* Right Column styling */
    .content-area {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    .premium-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 28px;
      padding: 36px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
      transition: box-shadow 0.25s ease;
    }
    .premium-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
    }
    
    .card-header-badge {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--color-primary, #2563eb);
      background: #eff6ff;
      padding: 6px 14px;
      border-radius: 10px;
      display: inline-block;
      margin-bottom: 16px;
      border: 1px solid #dbeafe;
    }

    .doctor-name-title {
      font-size: 34px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 12px 0;
      letter-spacing: -0.8px;
      line-height: 1.2;
    }
    .doctor-meta-line {
      font-size: 15.5px;
      color: #64748b;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .meta-separator {
      color: #cbd5e1;
      font-size: 20px;
      line-height: 1;
    }

    .card-section-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: -0.3px;
    }
    .card-section-title-icon {
      font-size: 22px;
    }

    .qualification-highlight {
      font-size: 15px;
      line-height: 1.7;
      padding: 20px 24px;
      background: #eff6ff;
      border-left: 4px solid var(--color-primary, #2563eb);
      border-radius: 12px;
      font-weight: 700;
      color: var(--color-primary-dark, #1e40af);
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.01);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .bio-text {
      font-size: 15.5px;
      line-height: 1.85;
      color: #334155;
      whiteSpace: pre-line;
      font-family: inherit;
    }

    /* Testimonials styles */
    .testimonial-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-top: 10px;
    }
    .testimonial-card {
      background: #f8fafc;
      border: 1px solid #edf2f7;
      border-radius: 20px;
      padding: 22px;
      position: relative;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .author-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--color-secondary-light, #e0f2fe);
      color: var(--color-secondary-dark, #0369a1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14.5px;
      border: 1.5px solid #bae6fd;
    }
    .author-info {
      display: flex;
      flex-direction: column;
    }
    .author-name {
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
    }
    .testimonial-stars {
      display: flex;
      gap: 2px;
      color: #eab308;
      font-size: 12px;
      margin-top: 2px;
    }
    .testimonial-content {
      font-size: 14px;
      line-height: 1.65;
      color: #475569;
      font-style: italic;
    }

    .guarantees-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .guarantee-box {
      border: 1.5px solid #f1f5f9;
      border-radius: 16px;
      padding: 18px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      transition: border-color 0.2s ease;
    }
    .guarantee-box:hover {
      border-color: #e2e8f0;
    }
    .guarantee-icon {
      font-size: 20px;
      padding: 6px;
      background: #f0fdf4;
      color: #15803d;
      border-radius: 10px;
      line-height: 1;
    }
    .guarantee-title {
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .guarantee-desc {
      font-size: 12.5px;
      color: #64748b;
      line-height: 1.5;
    }
  `;

  return (
    <div className="doctor-detail-container fade-in">
      <style>{premiumStyles}</style>

      {/* Breadcrumbs & Navigation */}
      <div className="premium-breadcrumbs">
        <div className="breadcrumbs-list">
          <Link to="/" className="breadcrumbs-link">Home</Link>
          <span>/</span>
          <Link to="/specialists" className="breadcrumbs-link">Specialists</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-primary, #2563eb)', fontWeight: '700' }}>{doctor.fullName}</span>
        </div>
        <button onClick={() => navigate('/specialists')} className="back-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Specialists
        </button>
      </div>

      {/* Main Profile Grid */}
      <div className="doctor-premium-grid">
        
        {/* Left Column: Sidebar / Key Action Card */}
        <div className="sticky-sidebar">
          
          <div className="profile-card">
            
            {/* Rectangular Image Cover */}
            <div className="avatar-wrapper">
              {avatar && !imageError ? (
                <img 
                  src={avatar} 
                  alt={doctor.fullName} 
                  onError={() => setImageError(true)}
                  className="avatar-img"
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--color-primary, #2563eb) 0%, var(--color-secondary, #0ea5e9) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: '800',
                  color: 'white',
                  letterSpacing: '1px'
                }}>
                  {initials}
                </div>
              )}
            </div>


            {/* Quick Stats Panel */}
            <div className="sidebar-details">
              <div className="detail-item">
                <div className="detail-icon-box">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="detail-text">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{doctor.experienceYears || 0} Years Active</span>
                </div>
              </div>
              
              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />
              
              <div className="detail-item">
                <div className="detail-icon-box">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="detail-text">
                  <span className="detail-label">Consultation Fee</span>
                  <span className="detail-value" style={{ color: 'var(--color-primary, #2563eb)' }}>
                    {formatCurrency(doctor.baseFee)}
                  </span>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }} />

              <div className="detail-item">
                <div className="detail-icon-box" style={{ color: '#16a34a' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="detail-text">
                  <span className="detail-label">Status</span>
                  <span className="detail-value" style={{ color: '#16a34a', fontSize: '13.5px' }}>Accepting Patients</span>
                </div>
              </div>
            </div>

            {/* Call To Action Book */}
            <button onClick={handleBook} className="primary-book-btn">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book Appointment Now
            </button>

          </div>


        </div>

        {/* Right Column: Detailed Biography & Info Section */}
        <div className="content-area">
          
          {/* Header Title Section */}
          <div className="premium-card">
            <span className="card-header-badge">
              Specialist Profile
            </span>
            <h1 className="doctor-name-title">
              {doctor.fullName}
            </h1>
            <div className="doctor-meta-line">
              <span style={{ color: '#0f172a' }}>{doctor.specialization}</span>
              <span className="meta-separator">•</span>
              <span style={{ color: 'var(--color-primary, #2563eb)' }}>{deptName}</span>
            </div>
          </div>

          {/* Qualifications block */}
          <div className="premium-card">
            <h3 className="card-section-title">
              <span className="card-section-title-icon">🎓</span> Qualifications & Academic Credentials
            </h3>
            <div className="qualification-highlight">
              <span>🩺</span>
              <span>{doctor.qualifications || 'Specialist Doctor / Leading Clinical Consultant'}</span>
            </div>
          </div>

          {/* Biography block */}
          <div className="premium-card">
            <h3 className="card-section-title">
              <span className="card-section-title-icon">📝</span> Professional Biography
            </h3>
            <div className="bio-text">
              {doctor.bio || 'A highly dedicated specialist with extensive clinical expertise and a compassionate, patient-centered approach to healthcare. Recognized for integrating state-of-the-art diagnostic protocols with custom treatment pathways. Committed to delivering evidence-based clinical treatments while respecting patients\' medical goals.'}
            </div>
          </div>

          {/* Guarantees & Care Standards */}
          <div className="premium-card">
            <h3 className="card-section-title">
              <span className="card-section-title-icon">🛡️</span> Standards of Clinical Excellence
            </h3>
            <div className="guarantees-grid">
              <div className="guarantee-box">
                <div className="guarantee-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>⚡</div>
                <div>
                  <div className="guarantee-title">Modern Diagnostics</div>
                  <div className="guarantee-desc">Using advanced tech to assure highly accurate screening.</div>
                </div>
              </div>
              <div className="guarantee-box">
                <div className="guarantee-icon" style={{ backgroundColor: '#fdf2f8', color: '#db2777' }}>❤️</div>
                <div>
                  <div className="guarantee-title">Empathy & Care</div>
                  <div className="guarantee-desc">Devoted medical ethics prioritizing comfort & privacy.</div>
                </div>
              </div>
              <div className="guarantee-box">
                <div className="guarantee-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>✨</div>
                <div>
                  <div className="guarantee-title">Continuous Training</div>
                  <div className="guarantee-desc">Specialist actively participating in international medical research.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Reviews section (Dynamic) */}
          <div className="premium-card">
            <h3 className="card-section-title">
              <span className="card-section-title-icon">⭐️</span> Patient Experiences ({reviews.length})
            </h3>
            
            <div className="testimonial-grid" style={{ marginBottom: '30px' }}>
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id} className="testimonial-card">
                    <div className="testimonial-author">
                      <div className="author-avatar">{getInitials(rev.patientName)}</div>
                      <div className="author-info">
                        <span className="author-name">{rev.patientName}</span>
                        <div className="testimonial-stars" style={{ color: '#eab308' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="testimonial-content">
                      "{rev.comment}"
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '14.5px', fontStyle: 'italic', textAlign: 'center', margin: '20px 0' }}>
                  Chưa có đánh giá nào cho bác sĩ này. Hãy là người đầu tiên đánh giá!
                </p>
              )}
            </div>

            {/* Write a Review Section */}
            <div style={{ borderTop: '1.5px solid #edf2f7', paddingTop: '30px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                Để lại đánh giá của bạn
              </h4>
              
              {isLoggedIn ? (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviewSuccess && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                      ✓ {reviewSuccess}
                    </div>
                  )}
                  {reviewError && (
                    <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                      ⚠️ {reviewError}
                    </div>
                  )}

                  {/* Stars input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>Chọn số sao:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            padding: '0 2px',
                            color: star <= ratingInput ? '#eab308' : '#cbd5e1',
                            transition: 'transform 0.1s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>Nội dung bình luận:</label>
                    <textarea
                      rows={4}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Hãy chia sẻ trải nghiệm khám bệnh thực tế của bạn với bác sĩ này..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '14px',
                        color: '#0f172a',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary, #2563eb)'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="primary-book-btn"
                    style={{ width: 'auto', padding: '12px 28px', alignSelf: 'flex-start', fontSize: '14px', borderRadius: '12px' }}
                  >
                    {submittingReview ? (
                      <span className="btn-spinner" style={{ width: '12px', height: '12px' }}></span>
                    ) : 'Gửi đánh giá'}
                  </button>
                </form>
              ) : (
                <div style={{
                  padding: '24px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#475569', fontSize: '14.5px', margin: '0 0 16px 0', fontWeight: '600' }}>
                    Bạn cần đăng nhập để gửi bình luận và đánh giá cho bác sĩ này.
                  </p>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--color-primary, #2563eb)',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
