// src/components/HeroSection.jsx
// Razorpay SDK is NO LONGER loaded here or in index.html.
// It is loaded dynamically only when the Donate page mounts — see Donate.jsx.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HeroSection() {
  const [isVisible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* ── Video hero ─────────────────────────────── */}
      <section className="hero-wrapper">
        {/* preload="none" — browser will not download the video until autoplay starts,
            so it doesn't compete with LCP resources on every page. */}
        <video
          autoPlay muted loop playsInline
          controls={false}
          preload="none"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="hero-video"
        >
          <source src="/poverty1.mp4" type="video/mp4" />
          <source src="/poverty.mp4"  type="video/mp4" />
        </video>

        <div className={`hero-content${isVisible ? '' : ' hidden'}`}>
          <p className="hero-pretitle">Ini_yoruvithiseivom Trust</p>
          <h1 className="hero-title">
            Together We Serve.<br />Together We Rise.
          </h1>
          <p className="hero-para">
            We serve daily meals to people in need across Tamil Nadu.
            Join us in creating a hunger-free and hopeful tomorrow.
          </p>
          <div className="hero-cta-row">
            <Link to="/donate"   className="hero-cta hero-cta--primary">Donate Now</Link>
            <Link to="/volunteer" className="hero-cta hero-cta--outline">Volunteer</Link>
          </div>
        </div>
      </section>

      {/* ── Why it matters strip — replaces the old hero-blog blob ── */}
      <section className="hero-why-strip" aria-label="Why it matters">
        <div className="hero-why-item">
          <span className="hero-why-icon" aria-hidden="true">🍽️</span>
          <div>
            <strong>800M+</strong>
            <p>people go hungry globally every day</p>
          </div>
        </div>
        <span className="hero-why-divider" aria-hidden="true" />
        <div className="hero-why-item">
          <span className="hero-why-icon" aria-hidden="true">🇮🇳</span>
          <div>
            <strong>190M</strong>
            <p>undernourished people in India</p>
          </div>
        </div>
        <span className="hero-why-divider" aria-hidden="true" />
        <div className="hero-why-item">
          <span className="hero-why-icon" aria-hidden="true">❤️</span>
          <div>
            <strong>You</strong>
            <p>can change this — one meal at a time</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
