// src/pages/Home.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FadeIn        from '../components/FadeIn';
import HeroSection   from '../components/HeroSection';
import Services      from '../components/Services';
import ServiceGallery from '../components/ServiceGallery';

// Counter starts ONLY when the stat card scrolls into view
function AnimatedCounter({ to }) {
  const ref     = useRef();
  const [count,   setCount]   = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let n = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      n = Math.min(n + step, to);
      setCount(n);
      if (n >= to) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [started, to]);

  return <h3 className="stat-count" ref={ref}>{count.toLocaleString()}+</h3>;
}

const stats = [
  { count: 10000, label: 'Meals Served',     icon: '🍱' },
  { count: 500,   label: 'Families Helped',  icon: '👨‍👩‍👧' },
  { count: 50,    label: 'Orphanage Visits', icon: '🏠' },
  { count: 25,    label: 'Social Events',    icon: '🤝' },
];

function Home() {
  return (
    <div className="home-bg">
      <div className="home-content">

        <HeroSection />

        <FadeIn>
          <section className="section-mission">
            <h2 className="section-heading">Our Mission</h2>
            <p className="section-text">
              At Ini_yoruvithiseivom, we believe in restoring dignity, providing care, and spreading kindness.
              Our mission is to feed the hungry, support the homeless and orphans, and bring hope to neglected communities.
            </p>
          </section>
        </FadeIn>

        <Services />
        <ServiceGallery />

        {/* Stats — counter fires on scroll */}
        <section className="section-stats">
          <FadeIn><h2 className="section-heading">Our Impact</h2></FadeIn>
          <div className="stats-grid">
            {stats.map((item, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div className="stat-box">
                  <span className="stat-icon">{item.icon}</span>
                  <AnimatedCounter to={item.count} />
                  <p className="stat-label">{item.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Donate CTA — replaced the old inline donate form */}
        <FadeIn delay={0.1}>
          <section className="section-donate-cta">
            <div className="donate-cta-inner">
              <span className="donate-cta-badge">Support Us</span>
              <h2 className="donate-cta-heading">Every Rupee Makes a Difference</h2>
              <p className="donate-cta-sub">
                Your contribution helps us serve meals, support orphans, and care for those in need across Tamil Nadu.
              </p>
              <div className="donate-cta-stats">
                <div className="donate-cta-stat"><strong>₹100</strong><span>feeds 2 people</span></div>
                <div className="donate-cta-stat"><strong>₹500</strong><span>school supplies</span></div>
                <div className="donate-cta-stat"><strong>₹2500</strong><span>sponsors a child</span></div>
              </div>
              <Link to="/donate" className="donate-cta-btn">Donate Now →</Link>
            </div>
          </section>
        </FadeIn>

      </div>
    </div>
  );
}

export default Home;
