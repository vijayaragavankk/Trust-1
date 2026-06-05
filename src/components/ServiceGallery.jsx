// src/components/ServiceGallery.jsx
// Changes vs original:
//  • loading="lazy" + explicit width/height on every <img> (fixes CLS + defers off-screen images)
//  • Gallery reveal uses IntersectionObserver instead of a bare setTimeout
//  • obs.disconnect() after first intersection so the observer doesn't keep firing
import { useEffect, useRef, useState } from 'react';

const images = [
  { src: '/gallery/clean.jpg',     alt: 'Community cleanup'   },
  { src: '/gallery/food.jpg',      alt: 'Food distribution'   },
  { src: '/gallery/health.jpg',    alt: 'Health camp'         },
  { src: '/gallery/help.jpg',      alt: 'Roadside help'       },
  { src: '/gallery/orphan.jpg',    alt: 'Orphanage visit'     },
  { src: '/gallery/orphanage.jpg', alt: 'Orphanage support'   },
];

function GalleryCard({ src, alt, index, visible, onClick }) {
  const [hover,    setHover]    = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="gallery-card-wrap"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.55s ease ${index * 0.1}s, transform 0.55s ease ${index * 0.1}s`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${alt}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {imgError ? (
        <div className="gallery-card-placeholder">📷 {alt}</div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"          /* ← defer off-screen images          */
          width="440"             /* ← prevents layout shift (CLS)       */
          height="280"
          onError={() => setImgError(true)}
          style={{ transform: hover ? 'scale(1.08)' : 'scale(1)' }}
          className="gallery-card-img"
        />
      )}
      <div className={`gallery-card-label${hover ? ' visible' : ''}`}>{alt}</div>
    </div>
  );
}

function ServiceGallery() {
  const sectionRef              = useRef();
  const [sectionVisible, setVisible] = useState(false);
  const [lightbox, setLightbox] = useState({ show: false, index: 0 });
  const [loading,  setLoading]  = useState(true);

  // Reveal cards when the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const onKey = (e) => {
      if (!lightbox.show) return;
      if (e.key === 'Escape')     setLightbox({ show: false, index: 0 });
      if (e.key === 'ArrowRight') setLightbox(p => ({ ...p, index: (p.index + 1) % images.length }));
      if (e.key === 'ArrowLeft')  setLightbox(p => ({ ...p, index: (p.index - 1 + images.length) % images.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.show]);

  const open  = (i) => { setLightbox({ show: true, index: i }); setLoading(true); };
  const close = ()  =>   setLightbox({ show: false, index: 0 });
  const next  = ()  =>   setLightbox(p => ({ ...p, index: (p.index + 1) % images.length, }));
  const prev  = ()  =>   setLightbox(p => ({ ...p, index: (p.index - 1 + images.length) % images.length }));

  return (
    <section className="gallery-section" ref={sectionRef}>
      <div className="gallery-inner">
        <h2 className="gallery-heading">Moments from Our Service</h2>
        <div className="gallery-grid">
          {images.map((img, i) => (
            <GalleryCard
              key={i}
              src={img.src}
              alt={img.alt}
              index={i}
              visible={sectionVisible}
              onClick={() => open(i)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox.show && (
        <div
          className="modal-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {loading && <div className="lightbox-spinner" />}
            <img
              src={images[lightbox.index].src}
              alt={images[lightbox.index].alt}
              onLoad={() => setLoading(false)}
              /* No lazy here — user explicitly opened this image */
              style={{ display: loading ? 'none' : 'block' }}
              className="lightbox-img"
            />
            <p className="lightbox-caption">{images[lightbox.index].alt}</p>
            <button className="lightbox-close" onClick={close} aria-label="Close">×</button>
            <button className="lightbox-prev"  onClick={prev}  aria-label="Previous">‹</button>
            <button className="lightbox-next"  onClick={next}  aria-label="Next">›</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ServiceGallery;
