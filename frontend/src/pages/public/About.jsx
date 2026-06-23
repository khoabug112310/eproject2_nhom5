import React from 'react';

const historyData = [
  {
    year: "Today",
    title: "Comprehensive digital transformation",
    content: "Moving toward a modern, smart healthcare model. We integrate electronic medical records, maximize the user experience, and continuously advance the expertise of our medical team."
  },
  {
    year: "2024",
    title: "Raising the bar for medical quality",
    content: "Officially launched our VIP health check-up packages, partnered with leading national specialists, and completed our online consultation and booking system."
  },
  {
    year: "2022",
    title: "Milestone of 10,000+ patients",
    content: "Reached the milestone of caring for more than 10,000 trusting patients. Expanded our facilities and scaled up our outpatient services."
  },
  {
    year: "2020",
    title: "Investment in high-tech equipment",
    content: "Upgraded all diagnostic imaging equipment (4D ultrasound, painless gastrointestinal endoscopy) and officially added the Obstetrics & Gynecology and Dermatology departments."
  },
  {
    year: "2018",
    title: "Foundation & the start of our mission",
    content: "Hopsontai General Clinic was founded with the goal of delivering high-quality, friendly, and affordable medical services to the community."
  },
];

const valuesData = [
  {
    title: "Mission",
    desc: "To provide comprehensive, professional healthcare solutions at the most reasonable cost for every family."
  },
  {
    title: "Vision",
    desc: "To become a leading modern, digital general clinic delivering care at international standards."
  },
  {
    title: "Core Values",
    desc: "Medical ethics as our foundation, with patient safety and satisfaction as the highest measure of our value."
  }
];

export default function About() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. HERO BANNER */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: 'linear-gradient(135deg, var(--color-primary-dark, #0f766e) 0%, var(--color-secondary-dark, #0e7490) 100%)',
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
          }}>About us</span>
          <h1 style={{ fontSize: '40px', fontWeight: '700', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Hopsontai General Clinic
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', maxWidth: '650px', margin: '0 auto' }}>
            Where talent, medical ethics, and modern technology come together to bring complete peace of mind to your health.
          </p>
        </div>
      </section>

      {/* 2. OVERVIEW & VALUES */}
      <section style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Intro Text */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ 
              color: 'var(--color-text, #1e293b)', 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: '20px',
              borderLeft: '5px solid var(--color-primary, #0d9488)',
              paddingLeft: '16px'
            }}>
              Committed to Dedicated, Compassionate Medicine
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--color-text-muted, #64748b)', margin: '0 0 20px 0' }}>
              Founded on the desire to build a friendly clinic model with streamlined procedures and deep, high-quality expertise, <strong>Hopsontai</strong> continuously improves its service process. We understand that every visit is not just about diagnosing illness, but also about sharing, listening, and walking alongside our patients.
            </p>
            <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Our doctors are specialists with years of experience, always devoted to learning and advancing their expertise to provide optimal treatment plans that save patients as much cost as possible.
            </p>
          </div>

          {/* Cards Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {valuesData.map((val, idx) => (
              <div 
                key={idx} 
                style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: 'var(--radius-card, 16px)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1))';
                  e.currentTarget.style.borderColor = 'var(--color-primary, #0d9488)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))';
                  e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--color-text, #1e293b)' }}>{val.title}</h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-muted, #64748b)' }}>{val.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. TIMELINE & MILESTONES */}
      <div style={{ padding: '80px 20px', backgroundColor: 'var(--color-bg-alt, #f8fafc)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text, #1e293b)', margin: '0 0 12px 0' }}>
              Our Journey of Growth &amp; Development
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Looking back at the solid milestones in the growth of Hopsontai General Clinic
            </p>
          </div>

          <div style={{ position: 'relative', paddingLeft: '40px' }}>
            {/* Main Vertical Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--color-primary, #0d9488), var(--color-secondary, #0891b2))'
            }} />

            {historyData.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  position: 'relative', 
                  marginBottom: '40px',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                {/* Timeline Bullet */}
                <div style={{
                  position: 'absolute',
                  left: '-37px',
                  top: '6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: '3px solid var(--color-primary, #0d9488)',
                  boxShadow: '0 0 0 4px rgba(13, 148, 136, 0.1)',
                  zIndex: 2,
                  boxSizing: 'border-box'
                }} />

                {/* Timeline Content Card */}
                <div style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'white',
                    backgroundColor: 'var(--color-primary, #0d9488)',
                    padding: '4px 10px',
                    borderRadius: '50px',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}>{item.year}</span>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: 'var(--color-text, #1e293b)' 
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    lineHeight: '1.7', 
                    color: 'var(--color-text-muted, #64748b)' 
                  }}>
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      
    </div>
  );
}
