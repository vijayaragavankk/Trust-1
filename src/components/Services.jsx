import { useEffect, useRef, useState } from 'react';

const gradients = [
  'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #f6d365, #fda085)',
  'linear-gradient(135deg, #84fab0, #8fd3f4)',
  'linear-gradient(135deg, #cfd9df, #e2ebf0)',
];

const services = [
  { icon: '🥣', title: 'Food Distribution',       description: 'Hot meals delivered weekly to roadside and homeless individuals.',         details: 'We serve over 500 meals per week, partnering with local suppliers. Volunteers distribute food every Sunday across 3 zones.',             learnMore: '/services/food' },
  { icon: '🏠', title: 'Orphanage Support',        description: 'Support for orphanage homes through essentials and education.',            details: 'We visit 2 orphanages monthly, providing clothes, hygiene kits, and fun activities. Partnerships with donors help sustain this effort.', learnMore: '/services/orphanage' },
  { icon: '💊', title: 'Medical Camps',            description: 'Free health camps in remote and underserved areas.',                       details: 'Quarterly camps with doctors, nurses, and medicines. Areas chosen based on need. Includes free checkups and awareness talks.',            learnMore: '/services/medical' },
  { icon: '📚', title: 'Educational Support',      description: 'Books and tuition for underprivileged children.',                         details: 'Over 200 children benefit annually. Evening classes, scholarships, and digital learning resources are provided.',                     learnMore: '/services/education' },
  { icon: '🤝', title: 'Volunteering & Campaigns', description: 'Awareness drives and opportunities to serve the community.',              details: 'Blood donations, street cleaning, plantation drives, and more. Volunteer onboarding every month.',                                      learnMore: '/services/volunteer' },
];

function Services() {
  const sectionRef = useRef();
  const [visible, setVisible]         = useState(false);
  const [hoveredIndex, setHovered]    = useState(null);
  const [selectedService, setSelected] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <section className="services-section" ref={sectionRef}>
        <h2 className="services-heading">What We Do</h2>
        <ul className="services-list">
          {services.map((s, i) => (
            <li
              key={i}
              className="service-bubble"
              style={{
                background: gradients[i % gradients.length],
                opacity: visible ? 1 : 0,
                transform: visible
                  ? hoveredIndex === i ? 'scale(1.1)' : 'translateY(0)'
                  : 'translateY(40px)',
                transition: `all 0.4s ease ${i * 0.1}s`,
              }}
              onClick={() => setSelected(s)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span style={{ fontSize: '2em', marginBottom: '0.4em' }}>{s.icon}</span>
              <h3 style={{ fontSize: '0.95em', color: '#fff', marginBottom: '0.3em' }}>{s.title}</h3>
              <p style={{ fontSize: '0.78em', color: '#f7f7f7', lineHeight: 1.4 }}>{s.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em', marginBottom: '1em' }}>
              <span style={{ fontSize: '2em' }}>{selectedService.icon}</span>
              <h2 style={{ color: '#ffc107', margin: 0, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{selectedService.title}</h2>
            </div>
            <p style={{ fontSize: '1em', lineHeight: 1.6, color: '#eee', marginBottom: '1.5em' }}>{selectedService.details}</p>
            <a href={selectedService.learnMore} style={{ display: 'inline-block', background: '#ffc107', color: '#000', padding: '0.6em 1.2em', borderRadius: '6px', fontWeight: 700 }}>
              Learn More →
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default Services;
