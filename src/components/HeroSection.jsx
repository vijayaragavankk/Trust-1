import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HeroSection() {
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <section className="hero-wrapper">
        <video
          autoPlay muted loop playsInline
          controls={false}
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="hero-video"
        >
          {/* FIX: poverty1.mp4 must be in /public/ folder */}
          <source src="/poverty1.mp4" type="video/mp4" />
          {/* Fallback to smaller file if poverty1.mp4 is missing */}
          <source src="/poverty.mp4" type="video/mp4" />
        </video>

        <div className={`hero-content${isVisible ? '' : ' hidden'}`}>
          <h1 className="hero-title">Ini_yoruvithiseivom</h1>
          <p className="hero-tagline">Together We Serve. Together We Rise.</p>
          <h2 className="hero-subheading">Daily Feeding Program</h2>
          <p className="hero-para">
            We serve daily meals to people in need across India. Join us in creating a hunger-free and hopeful tomorrow.
          </p>
          {/* FIX: use Link not <a href> for internal navigation */}
          <Link to="/donate" className="hero-cta">Donate Now</Link>
        </div>
      </section>

      <section className="hero-blog">
        <h2>Understanding Poverty in India</h2>
        <p>
          Poverty remains one of the most significant social issues in India. Millions struggle each day without access
          to nutritious food, clean water, and safe shelter. Our mission is to bring hope and relief to those affected
          by these harsh realities. Through our feeding programs, educational support, and community initiatives, we aim
          to build a stronger, more compassionate society. Together, we can make a difference in the lives of many.
        </p>
      </section>
    </>
  );
}

export default HeroSection;
