// Home Page
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { schedulingAPI, clinicalAPI, cmsAPI } from '../../services/api';
import QuickBooking from '../../components/QuickBooking';
import Hero from '../../components/Hero';
import DepartmentCard from '../../components/cards/DepartmentCard';
import DoctorCard from '../../components/cards/DoctorCard';
import PostCard from '../../components/cards/PostCard';
import postPlaceholder1 from '../../images/hero1.jpg';
import postPlaceholder2 from '../../images/hero2.jpg';
import postPlaceholder3 from '../../images/hero3.jpg';

const POST_PLACEHOLDERS = [postPlaceholder1, postPlaceholder2, postPlaceholder3];

const [/* placeholder */] = [];


export default function Home() {
  const navigate = useNavigate();
  const bookingRef = useRef();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States to pass down and prefill the QuickBooking widget
  const [activeDoctor, setActiveDoctor] = useState('');
  const [activeDept, setActiveDept] = useState('');

  function scrollToBooking() {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const handleBookDoctor = (doc) => {
    setActiveDoctor(doc.id || doc._id || '');
    // Find department ID that matches the doctor's department name
    if (doc.department) {
      const matchDep = departments.find(dept => (dept.departmentName || dept.name) === doc.department);
      if (matchDep) {
        setActiveDept(matchDep._id);
      }
    }
    scrollToBooking();
  };

  const handleSelectDepartment = (depId) => {
    setActiveDept(depId);
    setActiveDoctor(''); // reset doctor selection to default
    scrollToBooking();
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [depRes, docRes, postRes] = await Promise.all([
          schedulingAPI.getDepartments(),
          clinicalAPI.getDoctors(),
          cmsAPI.getPosts()
        ]);
        setDepartments(depRes.data?.data || []);
        setDoctors(docRes.data?.data || []);
        setPosts(postRes.data?.data || []);
      } catch (err) {
        console.error('Home fetch error', err);
        setError('Unable to load data from the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {/* Trust Stats Bar */}
        <Hero />

        <div className="home-content">

          {/* Doctors Grid Section - Redesigned to be highly professional and visually stunning */}
          <section style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--color-secondary, #00a89d)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                backgroundColor: 'var(--color-secondary-light, #e6fffa)',
                padding: '5px 14px',
                borderRadius: '50px',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(0, 168, 157, 0.05)'
              }}>Our Experts</span>

              <h2 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#1e293b',
                margin: '12px 0 8px 0',
                letterSpacing: '-0.5px'
              }}>Our Featured Medical Team</h2>

              <p style={{
                fontSize: '15px',
                color: '#64748b',
                maxWidth: '620px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                A team of Associate Professors, Doctors of Medicine, and distinguished physicians with advanced degrees and years of hands-on clinical experience in examination and treatment.
              </p>
            </div>
            
            <div className="home-doctors-grid">
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>
                  Loading doctors...
                </div>
              ) : doctors.length ? (
                [...doctors]
                  .sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))
                  .slice(0, 4)
                  .map((d, i) => (
                    <DoctorCard
                      key={i}
                      {...d}
                      onBook={() => handleBookDoctor(d)}
                    />
                  ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', width: '100%', gridColumn: '1/-1' }}>
                  No doctor information available
                </div>
              )}
            </div>
            
            {!loading && doctors.length > 4 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
                <button
                  onClick={() => navigate('/specialists')}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'var(--color-primary, #2563eb)',
                    backgroundColor: 'var(--color-primary-light, #eff6ff)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary, #2563eb)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-light, #eff6ff)';
                    e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  View all doctors
                </button>
              </div>
            )}
          </section>

          {/* Why Choose Us — feature band */}
          <section className="home-features" style={{ marginBottom: 0 }}>
            <div className="home-section-head">
              <span className="home-eyebrow">Why choose us</span>
              <h2>Healthcare built around you</h2>
              <p>From your first booking to follow-up care, every step is designed to be simple, transparent, and reassuring.</p>
            </div>
            <div className="home-feature-grid">
              {[
                { icon: '🩺', title: 'Expert Physicians', desc: 'Board-certified specialists across every major medical field.' },
                { icon: '⚡', title: 'Fast Booking', desc: 'Reserve an appointment online in under a minute, 24/7.' },
                { icon: '🔬', title: 'Modern Equipment', desc: 'Accurate diagnostics powered by advanced medical technology.' },
                { icon: '💊', title: 'In-house Pharmacy', desc: 'Fill your prescription on-site right after your consultation.' },
                { icon: '🧾', title: 'Transparent Pricing', desc: 'Clear consultation and treatment fees with itemized receipts.' },
                { icon: '🤝', title: 'Dedicated Care', desc: 'Friendly staff who guide you through every stage of your visit.' },
              ].map((f, i) => (
                <div key={i} className="home-feature-card">
                  <div className="home-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
 
          {/* How it works — steps */}
          <section className="home-steps" style={{ marginBottom: 0 }}>
            <div className="home-section-head">
              <span className="home-eyebrow">How it works</span>
              <h2>Booking made simple</h2>
              <p>Four easy steps from request to recovery.</p>
            </div>
            <div className="home-step-grid">
              {[
                { n: '01', title: 'Book online', desc: 'Pick a department, doctor, date and time — or use Quick Booking.' },
                { n: '02', title: 'Get confirmed', desc: 'Our care team verifies your details and confirms your visit.' },
                { n: '03', title: 'Visit the clinic', desc: 'Meet your doctor, get examined and receive your prescription.' },
                { n: '04', title: 'Pay & collect', desc: 'Settle fees at the cashier and pick up your medication.' },
              ].map((s, i) => (
                <div key={i} className="home-step-card">
                  <span className="home-step-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
 
          {/* QuickBooking Inline Card Section */}
          <div className="card" ref={bookingRef} id="booking-section" style={{ maxWidth: '800px', width: '100%', alignSelf: 'center', padding: '24px 32px', marginBottom: 0 }}>
            <QuickBooking
              doctors={doctors}
              departments={departments}
              initialDoctorId={activeDoctor}
              initialDepartmentId={activeDept}
              isInline={true}
            />
          </div>
 
          {/* News & Latest Posts Section - Enclosed in a beautiful matching container card */}
          <section style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
            marginBottom: 0
          }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                color: 'var(--color-secondary, #0ea5e9)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                backgroundColor: 'var(--color-secondary-light, #f0f9ff)',
                padding: '5px 14px',
                borderRadius: '50px',
                display: 'inline-block',
                boxShadow: '0 2px 4px rgba(14, 165, 233, 0.05)'
              }}>Health & Updates</span>

              <h2 style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#1e293b',
                margin: '12px 0 8px 0',
                letterSpacing: '-0.5px'
              }}>Latest Medical News</h2>

              <p style={{
                fontSize: '15px',
                color: '#64748b',
                maxWidth: '620px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                Stay updated with the latest medical insights, clinic news, and health tips from our expert medical specialists.
              </p>
            </div>

            <div className="post-list">
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1', color: 'var(--color-text-muted)' }}>Loading medical news...</div>
              ) : posts.length ? (
                [...posts]
                  .sort((a, b) => new Date(b.publishedAt || b.createdAt || b.date || 0) - new Date(a.publishedAt || a.createdAt || a.date || 0))
                  .slice(0, 4)
                  .map((p, i) => (
                    <PostCard
                      key={i}
                      title={p.title}
                      excerpt={p.excerpt}
                      date={p.publishedAt || p.date}
                      thumbnail={p.thumbnail || p.thumbnailURL || p.imageUrl || p.image || POST_PLACEHOLDERS[i % POST_PLACEHOLDERS.length]}
                      onRead={() => navigate(`/news?slug=${p.slug || p._id}`)}
                    />
                  ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1/-1' }}>No news updates yet</div>
              )}
            </div>

            {!loading && posts.length > 4 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
                <button
                  onClick={() => navigate('/news')}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'var(--color-primary, #2563eb)',
                    backgroundColor: 'var(--color-primary-light, #eff6ff)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary, #2563eb)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-light, #eff6ff)';
                    e.currentTarget.style.color = 'var(--color-primary, #2563eb)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  View all news
                </button>
              </div>
            )}
          </section>

        </div>

        {error && (
          <div style={{
            color: 'hsl(0, 84%, 40%)',
            backgroundColor: 'hsl(0, 100%, 97%)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            padding: '12px',
            borderRadius: 'var(--radius-input)',
            marginTop: '24px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
    </div>
  );
}
