import { useEffect, useRef, useState } from 'react';
import HeroSection    from '../components/HeroSection';
import Services       from '../components/Services';
import ServiceGallery from '../components/ServiceGallery';

// ── Reusable fade-in wrapper (inline – no need for a separate file) ──────────
function FadeInSection({ children, delay = 0 }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : 'translateY(28px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ to }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let n = 0;
    const inc = Math.ceil(to / 50);
    const t = setInterval(() => {
      n = Math.min(n + inc, to);
      setCount(n);
      if (n >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <h3 className="stat-count">{count.toLocaleString()}+</h3>;
}

const stats = [
  { count: 10000, label: 'Meals Served' },
  { count: 500,   label: 'Families Helped' },
  { count: 50,    label: 'Orphanage Visits' },
  { count: 25,    label: 'Social Events' },
];

function Home() {
  const [customAmount, setCustomAmount] = useState('');

  const handleRazorpay = () => {
    const amt = parseInt(customAmount, 10);
    if (!amt || amt < 1) {
      alert('Please enter a valid amount (minimum ₹1)');
      return;
    }
    // BUG FIX: key was hardcoded string 'RAZORPAY_KEY_ID'.
    // Now read from environment variable (safe for client-side – publishable key only).
    const options = {
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      amt * 100,   // paise
      currency:    'INR',
      name:        'Ini_Yoruvithiseivom Trust',
      description: 'Donation',
      handler: (r) => alert('Thank you! Payment ID: ' + r.razorpay_payment_id),
      prefill: { name: 'Donor', email: 'donor@example.com', contact: '9999999999' },
      theme:   { color: '#00c8ff' },
    };
    // BUG FIX: Razorpay is loaded async; guard against it not being ready yet
    if (!window.Razorpay) {
      alert('Payment gateway is loading – please try again in a moment.');
      return;
    }
    new window.Razorpay(options).open();
  };

  // BUG FIX: replace placeholder UPI ID with your real one
  const upiId  = 'yourupiid@upi';
  const upiUrl = `upi://pay?pa=${upiId}&pn=Ini_Trust&cu=INR`;

  return (
    <div className="home-bg">
      <div className="home-content">
        <HeroSection />

        <section className="section-mission">
          <h2 className="section-heading">Our Mission</h2>
          <p className="section-text">
            At Ini_yoruvithiseivom, we believe in restoring dignity, providing care, and spreading kindness.
            Our mission is to feed the hungry, support the homeless and orphans, and bring hope to neglected communities.
          </p>
        </section>

        <Services />
        <ServiceGallery />

        <section className="section-stats">
          <h2 className="section-heading">Our Impact</h2>
          <div className="stats-grid">
            {stats.map((item, i) => (
              <FadeInSection key={i} delay={i * 0.15}>
                <div className="stat-box">
                  <AnimatedCounter to={item.count} />
                  <p className="stat-label">{item.label}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </section>

        <section id="donate-section" className="section-donate">
          <h2 className="section-heading">Support Our Cause</h2>
          <p className="section-text">
            Every rupee you contribute helps us serve meals, support orphans, and care for those in need.
          </p>
          <input
            type="number"
            placeholder="Enter amount (₹)"
            value={customAmount}
            min="1"
            onChange={(e) => setCustomAmount(e.target.value)}
            className="donate-input"
          />
          <button className="donate-btn-primary" onClick={handleRazorpay}>
            Donate Now
          </button>

          <p style={{ marginTop: '1.5em', fontStyle: 'italic', color: '#aaa' }}>
            Prefer UPI? Scan the QR below:
          </p>
          {/* BUG FIX: /upi-qr.png must exist in /public – placeholder reminder added */}
          <img src="/upi-qr.png" alt="UPI QR code" className="upi-qr" />

          <div className="upi-buttons">
            <button className="upi-btn" onClick={() => window.open(upiUrl, '_blank')}>
              Pay via Google Pay
            </button>
            <button className="upi-btn" onClick={() => window.open(upiUrl, '_blank')}>
              Pay via Paytm
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
