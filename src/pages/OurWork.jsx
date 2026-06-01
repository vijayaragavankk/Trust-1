import { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

function OurWork() {
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // FIX: was using /images/food.jpg etc — those paths don't exist
  // Changed to actual gallery images in /public/gallery/
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

  return (
    <section style={styles.page}>
      <div style={styles.overlay}>
        <h2 style={styles.heading}>Our Work</h2>
        <div style={styles.grid}>
          {services.map((s, i) => (
            <div
              key={i}
              style={styles.card}
              data-aos="fade-up"
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={s.img}
                alt={s.title}
                style={styles.img}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3 style={styles.subheading}>{s.title}</h3>
              <p style={styles.desc}>{s.desc}</p>
              <button style={styles.button} onClick={() => setSelectedService(s)}>
                Read More
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <div style={styles.modalOverlay} onClick={() => setSelectedService(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelectedService(null)}>×</button>
            <img
              src={selectedService.img}
              alt={selectedService.title}
              style={styles.modalImg}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2>{selectedService.title}</h2>
            <p style={styles.modalText}>{selectedService.details}</p>
          </div>
        </div>
      )}
    </section>
  );
}

const styles = {
  page:         { position: 'relative', backgroundImage: 'url("/bg-home.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', padding: '4em 1em', color: '#f0f0f0', fontFamily: 'Arial, sans-serif' },
  overlay:      { backgroundColor: 'rgba(0,0,0,0.85)', padding: '2em', borderRadius: '12px', maxWidth: '1200px', margin: 'auto' },
  heading:      { textAlign: 'center', color: '#0d6efd', marginBottom: '2em', fontSize: '2em' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2em' },
  card:         { backgroundColor: '#1e1e1e', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', padding: '1.5em', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease' },
  img:          { width: '100%', height: '180px', borderRadius: '10px', objectFit: 'cover', marginBottom: '1em' },
  subheading:   { color: '#0d6efd', fontSize: '1.3em', marginBottom: '0.5em', textAlign: 'center' },
  desc:         { fontSize: '0.95em', lineHeight: '1.5', textAlign: 'center', marginBottom: '1em' },
  button:       { backgroundColor: '#0d6efd', color: '#fff', border: 'none', padding: '0.5em 1em', borderRadius: '5px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:        { backgroundColor: '#1e1e1e', padding: '2em', borderRadius: '10px', maxWidth: '600px', width: '90%', color: '#fff', position: 'relative' },
  closeBtn:     { position: 'absolute', top: '10px', right: '15px', background: 'transparent', border: 'none', fontSize: '1.5em', color: '#fff', cursor: 'pointer' },
  modalImg:     { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1em' },
  modalText:    { fontSize: '1em', lineHeight: '1.6' },
};

export default OurWork;
