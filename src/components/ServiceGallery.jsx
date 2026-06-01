import { useEffect, useState } from 'react';

// FIX: these images must be in /public/gallery/ (copy from src/public/gallery/)
const images = [
  { src: '/gallery/clean.jpg',     alt: 'Community cleanup' },
  { src: '/gallery/food.jpg',      alt: 'Food distribution' },
  { src: '/gallery/health.jpg',    alt: 'Health camp' },
  { src: '/gallery/help.jpg',      alt: 'Roadside help' },
  { src: '/gallery/orphan.jpg',    alt: 'Orphanage visit' },
  { src: '/gallery/orphanage.jpg', alt: 'Orphanage support' },
];

function GalleryCard({ src, alt, onClick }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '190px', overflow: 'hidden', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.3)', background: '#1a1a1a' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {imgError ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.85em' }}>
          📷 {alt}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hover ? 'scale(1.1)' : 'scale(1)' }}
        />
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.5em', fontSize: '0.9em', textAlign: 'center', transition: 'opacity 0.3s', opacity: hover ? 1 : 0 }}>
        {alt}
      </div>
    </div>
  );
}

function ServiceGallery() {
  const [visible,  setVisible]  = useState(false);
  const [lightbox, setLightbox] = useState({ show: false, index: 0 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (!lightbox.show) return;
      if (e.key === 'Escape')     setLightbox({ show: false, index: 0 });
      if (e.key === 'ArrowRight') setLightbox(p => ({ ...p, index: (p.index + 1) % images.length }));
      if (e.key === 'ArrowLeft')  setLightbox(p => ({ ...p, index: (p.index - 1 + images.length) % images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const open  = (i) => { setLightbox({ show: true, index: i }); setLoading(true); };
  const close = ()  =>   setLightbox({ show: false, index: 0 });
  const next  = ()  =>   setLightbox(p => ({ ...p, index: (p.index + 1) % images.length }));
  const prev  = ()  =>   setLightbox(p => ({ ...p, index: (p.index - 1 + images.length) % images.length }));

  return (
    <section className="gallery-section">
      <div className="gallery-inner">
        <h2 className="gallery-heading">Moments from Our Service Gallery</h2>
        <div className="gallery-grid">
          {images.map((img, i) => (
            <div
              key={i}
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `all 0.6s ease ${i * 0.15}s` }}
            >
              <GalleryCard src={img.src} alt={img.alt} onClick={() => open(i)} />
            </div>
          ))}
        </div>
      </div>

      {lightbox.show && (
        <div className="modal-overlay" onClick={close}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '85vh', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            {loading && <div style={{ width: 50, height: 50, border: '6px solid #fff', borderTop: '6px solid #0d6efd', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />}
            <img
              src={images[lightbox.index].src}
              alt={images[lightbox.index].alt}
              onLoad={() => setLoading(false)}
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 10, display: loading ? 'none' : 'block', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
            />
            <p style={{ color: '#fff', marginTop: '0.5em' }}>{images[lightbox.index].alt}</p>
            <button onClick={close} style={{ position: 'absolute', top: -10, right: -10, background: '#fff', color: '#333', border: 'none', borderRadius: '50%', width: 30, height: 30, fontSize: '1.4em', cursor: 'pointer', lineHeight: 1 }}>×</button>
            <button onClick={prev} style={{ position: 'absolute', top: '45%', left: -40, fontSize: '2.2em', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', top: '45%', right: -40, fontSize: '2.2em', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>›</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ServiceGallery;
