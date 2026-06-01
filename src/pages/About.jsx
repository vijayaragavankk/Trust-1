import { useEffect, useRef, useState } from 'react';

function FadeIn({ children, delay = 0 }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : 'translateY(30px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const volunteers = [
  { name: 'Anjali',  role: 'Volunteer',         img: '/volunteer1.jpg' },
  { name: 'Raj',     role: 'Event Organizer',   img: '/volunteer2.jpg' },
  { name: 'Meena',   role: 'Medical Assistant', img: '/volunteer3.jpg' },
  { name: 'Karthik', role: 'Logistics',         img: '/volunteer4.jpg' },
];

const timeline = [
  { year: 2018, event: 'Trust was founded with a small team of volunteers' },
  { year: 2019, event: 'Served 2,000+ meals, visited 10 orphanages' },
  { year: 2020, event: 'Launched medical aid & COVID relief program' },
  { year: 2021, event: 'Started educational sponsorship for 50+ children' },
  { year: 2022, event: 'Expanded to 3 cities across Tamil Nadu' },
  { year: 2023, event: 'Crossed 10,000+ meals and 500+ families helped' },
];

const sections = [
  { title: 'Who We Are',  body: 'Ini_yoruvithiseivom Trust is a non-profit established to uplift underprivileged communities. We are a family of volunteers, medics, educators, and changemakers.' },
  { title: 'Our Mission', body: 'To ensure that no one goes hungry, homeless, or unheard. We provide food, shelter, healthcare, and education to those in need.' },
  { title: 'Our Vision',  body: 'A world where every human has access to dignity, opportunity, and support — regardless of their background or circumstances.' },
];

const testimonials = [
  { name: 'Sita',   quote: 'This trust helped me get back on my feet after losing everything during the pandemic.' },
  { name: 'Vikram', quote: 'Volunteering here changed my perspective on life and service.' },
];

// BUG FIX: Replace 'YOUR_VIDEO_ID' with your actual YouTube video ID before deploying
const YOUTUBE_VIDEO_ID = 'YOUR_VIDEO_ID';

function About() {
  return (
    <div className="about-bg">
      <div className="about-overlay">
        <div className="about-page">
          <FadeIn><h2 className="about-heading">About Us</h2></FadeIn>

          {sections.map((s, i) => (
            <FadeIn key={i} delay={0.1 * (i + 1)}>
              <section className="about-section">
                <h3 className="about-subheading">{s.title}</h3>
                <p>{s.body}</p>
              </section>
            </FadeIn>
          ))}

          <FadeIn delay={0.4}>
            <section className="about-section">
              <h3 className="about-subheading">Core Values</h3>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.8em' }}>
                <li style={{ marginBottom: '0.6em' }}>❤️ <strong>Compassion</strong> – Serving with love and empathy</li>
                <li style={{ marginBottom: '0.6em' }}>🛡️ <strong>Integrity</strong> – Acting honestly and ethically</li>
                <li style={{ marginBottom: '0.6em' }}>💡 <strong>Empowerment</strong> – Enabling self-reliance and confidence</li>
                <li style={{ marginBottom: '0.6em' }}>🌍 <strong>Inclusivity</strong> – Embracing diversity and equality</li>
              </ul>
            </section>
          </FadeIn>

          <FadeIn delay={0.5}>
            <section className="about-section">
              <h3 className="about-subheading">Meet Our Volunteers</h3>
              <div className="volunteer-grid">
                {volunteers.map((v, i) => (
                  <div key={i} className="volunteer-card">
                    <img
                      src={v.img}
                      alt={v.name}
                      // BUG FIX: added fallback so broken images don't render broken icon
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="volunteer-card-info">
                      <h4>{v.name}</h4>
                      <p style={{ color: '#aaa', fontSize: '0.9em' }}>{v.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.6}>
            <section className="about-section">
              <h3 className="about-subheading">Our Journey</h3>
              <ul className="timeline-list">
                {timeline.map((item, i) => (
                  <li key={i} className="timeline-item">
                    <span className="timeline-year">{item.year}</span>
                    <span>{item.event}</span>
                  </li>
                ))}
              </ul>
            </section>
          </FadeIn>

          <FadeIn delay={0.8}>
            <section className="about-section">
              <h3 className="about-subheading">What People Say</h3>
              <div className="testimonials-grid">
                {testimonials.map((t, i) => (
                  <div key={i} className="testimonial-card">
                    <p style={{ fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                    <p style={{ fontWeight: 700, marginTop: '0.5em' }}>– {t.name}</p>
                  </div>
                ))}
              </div>
            </section>
          </FadeIn>

          {/* BUG FIX: Only render the video embed if a real video ID is set */}
          {YOUTUBE_VIDEO_ID !== 'YOUR_VIDEO_ID' && (
            <FadeIn delay={1.0}>
              <section className="about-section">
                <h3 className="about-subheading">Watch Our Story</h3>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
                    frameBorder="0"
                    allowFullScreen
                    title="Ini_yoruvithiseivom Story"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 8 }}
                  />
                </div>
              </section>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}

export default About;
