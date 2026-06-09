// src/components/ServiceGallery.jsx
// ✅ Now reads images from Firestore (uploaded via Cloudinary in admin)
// ✅ Category filter tabs
// ✅ Lightbox with keyboard nav
// ✅ Graceful fallback if no images uploaded yet

import { useEffect, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const CATEGORIES = ['All', 'Food Distribution', 'Health Camp', 'Education', 'Orphanage', 'Events', 'Community', 'Other'];

// Cloudinary auto-optimise URL
const optimise = (url, w = 440, h = 280) =>
  url ? url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,f_auto,q_auto/`) : url;

function GalleryCard({ item, index, visible, onClick }) {
  const [hover,    setHover]    = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="gallery-card-wrap"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.title}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {imgError ? (
        <div className="gallery-card-placeholder">📷 {item.title}</div>
      ) : (
        <img
          src={optimise(item.imageUrl)}
          alt={item.title}
          loading="lazy"
          width="440"
          height="280"
          onError={() => setImgError(true)}
          style={{ transform: hover ? 'scale(1.08)' : 'scale(1)' }}
          className="gallery-card-img"
        />
      )}
      <div className={`gallery-card-label${hover ? ' visible' : ''}`}>{item.title}</div>
    </div>
  );
}

function ServiceGallery() {
  const sectionRef  = useRef();
  const [images,    setImages]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [visible,   setVisible]  = useState(false);
  const [filterCat, setFilter]   = useState('All');
  const [lightbox,  setLightbox] = useState({ show: false, index: 0 });
  const [lbLoading, setLbLoad]   = useState(false);

  // Load from Firestore
  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setImages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Reveal on scroll
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

  // Keyboard nav for lightbox
  useEffect(() => {
    const onKey = (e) => {
      if (!lightbox.show) return;
      if (e.key === 'Escape')     setLightbox({ show: false, index: 0 });
      if (e.key === 'ArrowRight') setLightbox((p) => ({ ...p, index: (p.index + 1) % filtered.length }));
      if (e.key === 'ArrowLeft')  setLightbox((p) => ({ ...p, index: (p.index - 1 + filtered.length) % filtered.length }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.show]);

  const filtered = filterCat === 'All'
    ? images
    : images.filter((img) => img.category === filterCat);

  // Only show category tabs that have images
  const activeCats = ['All', ...new Set(images.map((i) => i.category).filter(Boolean))];

  const open  = (i) => { setLightbox({ show: true, index: i }); setLbLoad(true); };
  const close = ()  => setLightbox({ show: false, index: 0 });
  const next  = ()  => setLightbox((p) => ({ ...p, index: (p.index + 1) % filtered.length }));
  const prev  = ()  => setLightbox((p) => ({ ...p, index: (p.index - 1 + filtered.length) % filtered.length }));

  return (
    <section className="gallery-section" ref={sectionRef}>
      <div className="gallery-inner">
        <h2 className="gallery-heading">Moments from Our Service</h2>

        {/* Category filter */}
        {activeCats.length > 1 && (
          <div className="gallery-filter-bar">
            {activeCats.map((cat) => (
              <button
                key={cat}
                className={`gallery-filter-btn${filterCat === cat ? ' active' : ''}`}
                onClick={() => setFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="gallery-loading">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="gallery-skeleton" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', padding: '3em 0' }}>
            No images in this category yet.
          </p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="gallery-grid">
            {filtered.map((img, i) => (
              <GalleryCard
                key={img.id}
                item={img}
                index={i}
                visible={visible}
                onClick={() => open(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox.show && filtered[lightbox.index] && (
        <div
          className="modal-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {lbLoading && <div className="lightbox-spinner" />}
            <img
              src={optimise(filtered[lightbox.index].imageUrl, 1200, 800)}
              alt={filtered[lightbox.index].title}
              onLoad={() => setLbLoad(false)}
              style={{ display: lbLoading ? 'none' : 'block' }}
              className="lightbox-img"
            />
            <p className="lightbox-caption">
              {filtered[lightbox.index].title}
              {filtered[lightbox.index].description && (
                <span style={{ color: '#aaa', fontSize: '0.85em', marginLeft: 8 }}>
                  — {filtered[lightbox.index].description}
                </span>
              )}
            </p>
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
