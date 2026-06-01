import { useEffect, useState } from 'react';

// FIX: Image paths corrected to match actual files in /public/
const services = [
  {
    title: 'Food Distribution',
    desc: 'We provide hot, nutritious meals to the homeless and people living on the roadside every week.',
    details: 'Every week, our volunteers cook and distribute fresh meals across various zones. The initiative is backed by donors and grocery sponsors.',
    img: '/gallery/food.jpg',
  },
  {
    title: 'Orphanage Support',
    desc: 'We regularly visit orphanages and supply essentials, clothing, food, and education materials.',
    details: 'Our team partners with local orphanages to understand their needs and deliver clothes, school supplies, hygiene kits, and food regularly.',
    img: '/gallery/orphanage.jpg',
  },
  {
    title: 'Medical Camps',
    desc: 'Our free medical camps serve slum communities, providing checkups, treatments, and health awareness.',
    details: 'In collaboration with doctors, we conduct medical screenings, free medicines, and health seminars focused on hygiene and prevention.',
    img: '/gallery/health.jpg',
  },
  {
    title: 'Volunteer Events',
    desc: 'Volunteers conduct street cleaning, awareness drives, and donation campaigns for the needy.',
    details: 'These events include waste cleanups, blood donation drives, climate awareness rallies, and donation drives for clothes/books.',
    img: '/gallery/clean.jpg',
  },
];

function ServicesPage() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="services-page">
      <div className="services-page-inner">
        <h2 style={{ textAlign: 'center', color: '#ffc107', marginBottom: '1.5em', fontSize: 'clamp(1.5rem,4vw,2rem)' }}>Our Work</h2>

        <div className="services-stats">
          <div className="services-stat-card">5,000+ Meals Served</div>
          <div className="services-stat-card">120 Orphanages Helped</div>
          <div className="services-stat-card">300 Medical Checkups</div>
        </div>

        <div className="services-cards-grid">
          {services.map((s, i) => (
            <div key={i} className="service-card">
              <img
                src={s.img}
                alt={s.title}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 style={{ color: '#0d6efd', fontSize: '1.2em', marginBottom: '0.5em', textAlign: 'center' }}>{s.title}</h3>
              <p style={{ fontSize: '0.9em', lineHeight: 1.5, textAlign: 'center', color: '#ccc', marginBottom: '1em', flexGrow: 1 }}>{s.desc}</p>
              <button
                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '0.5em 1.2em', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
                onClick={() => setSelected(s)}
              >
                Read More
              </button>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <img src={selected.img} alt={selected.title} className="modal-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <h2 style={{ color: '#ffc107', marginBottom: '0.5em' }}>{selected.title}</h2>
            <p style={{ fontSize: '1em', lineHeight: 1.6, color: '#ddd' }}>{selected.details}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ServicesPage;
