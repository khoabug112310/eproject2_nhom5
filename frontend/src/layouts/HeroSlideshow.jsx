import React, { useEffect, useState } from 'react';

export default function HeroSlideshow({ images = [], interval = 5000 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const id = setInterval(() => {
      setIndex(i => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images, interval]);

  const style = {
    width: '100%',
    height: '360px',
    backgroundImage: `url(${images[index]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'background-image 0.6s ease-in-out',
    marginBottom: 18,
  };

  return <div className="hero-full" style={style} role="img" aria-label="Hero image" />;
}
