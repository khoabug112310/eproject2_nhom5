import React, { useEffect, useState } from 'react';

export default function HeroSlideshow({ images = [], interval = 5000, children }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images, interval]);

  return (
    <div 
      className="hero-full" 
      style={{
        width: '100%',
        margin: '0 0 24px 0', // Bottom margin spacing
        height: '350px', // Taller height for visual balance
        position: 'relative',
        borderRadius: '24px', // Rounded corners matching other sections
        overflow: 'hidden',
        background: '#0f172a',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)' // Premium shadow
      }}
    >
      {/* Smooth Crossfade Image Layers */}
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}
        />
      ))}

      {/* Content overlay container (Z-index 2) */}
      <div 
        className="hero-overlay-container" 
        style={{ 
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(15, 23, 42, 0.15) 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '24px 32px', // Compact padding
          zIndex: 2 
        }}
      >
        {children}
      </div>

      {/* Navigation Dot Indicators */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '30px',
          display: 'flex',
          gap: '8px',
          zIndex: 3
        }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? '20px' : '8px',
                height: '8px',
                borderRadius: '999px',
                border: 'none',
                background: i === index ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0,
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
              }}
              title={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
