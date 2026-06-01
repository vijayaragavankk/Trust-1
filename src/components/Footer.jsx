import { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';

function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-copy">© 2025 Ini_yoruvithiseivom Trust. All rights reserved.</p>

        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <span style={{ color: '#555', margin: '0 0.3em' }}>|</span>
          <a href="/terms">Terms of Service</a>
        </div>

        <div className="footer-socials">
          <a href="https://www.facebook.com/helpinghandstrust" target="_blank" rel="noreferrer" aria-label="Facebook"
             style={{ '--hover-color': '#1877f2' }}>
            <FaFacebookF />
          </a>
          <a href="https://www.instagram.com/helpinghandstrust" target="_blank" rel="noreferrer" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/@helpinghandstrust" target="_blank" rel="noreferrer" aria-label="YouTube">
            <FaYoutube />
          </a>
        </div>
      </div>

      {showScrollTop && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Top
        </button>
      )}
    </footer>
  );
}

export default Footer;
