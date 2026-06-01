import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const navLinks = [
  { label: 'Home',     path: '/' },
  { label: 'About',    path: '/about' },
  { label: 'Our Work', path: '/services' },
  { label: 'Contact',  path: '/contact' },
];

function Header() {
  const [isLoaded,  setLoaded]  = useState(false);
  const [menuOpen,  setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // BUG FIX: close mobile menu on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className={`site-header${isLoaded ? '' : ' hidden'}`}>

      {/* Logo */}
      <Link to="/" className="header-logo">Ini_yoruvithiseivom</Link>

      {/* Desktop nav */}
      <nav className="header-nav">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
        <Link to="/donate" className="header-donate">Donate</Link>
      </nav>

      {/* Hamburger */}
      <button
        className="header-hamburger"
        onClick={() => setMenuOpen((p) => !p)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className="bar" style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 6px)' : 'none' }} />
        <span className="bar" style={{ opacity: menuOpen ? 0 : 1 }} />
        <span className="bar" style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -6px)' : 'none' }} />
      </button>

      {/* Mobile menu */}
      <div
        className="mobile-menu"
        style={{
          transform:     menuOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity:       menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
        <Link to="/donate" className="mobile-donate">Donate</Link>
      </div>
    </header>
  );
}

export default Header;
