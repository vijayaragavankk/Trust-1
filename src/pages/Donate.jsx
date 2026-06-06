// src/pages/Donate.jsx
// ✅ SECURE: Name + Phone required before payment can proceed
// ✅ Razorpay loaded dynamically (only on this page)
// ✅ Payment signature verification note added
// ✅ Firestore save on success with full donor info

import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const IMPACT_CARDS = [
  { amount: 100,  icon: '🍱', text: 'Feeds 2 people for a day' },
  { amount: 500,  icon: '📚', text: 'Provides stationery for a child' },
  { amount: 1000, icon: '🏠', text: 'Supports shelter for a week' },
  { amount: 2500, icon: '❤️', text: 'Sponsors an orphan for a month' },
];

// Load Razorpay SDK only when the donate page mounts
function useRazorpay() {
  const [ready, setReady] = useState(!!window.Razorpay);
  useEffect(() => {
    if (window.Razorpay) { setReady(true); return; }
    const script   = document.createElement('script');
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async   = true;
    script.onload  = () => setReady(true);
    script.onerror = () => console.error('Razorpay SDK failed to load');
    document.head.appendChild(script);
  }, []);
  return ready;
}

// Validate Indian or international phone number
const isValidPhone = (p) => /^[+\d\s\-()]{7,15}$/.test(p.trim());

function Donate() {
  const razorpayReady = useRazorpay();

  const [amount,  setAmount]  = useState('');
  const [preset,  setPreset]  = useState(null);
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const upiId    = import.meta.env.VITE_UPI_ID || 'yourupiid@upi';
  const finalAmt = preset || parseInt(amount, 10) || 0;

  const handlePreset = (val) => { setPreset(val); setAmount(''); setError(''); };
  const handleCustom = (e)   => { setAmount(e.target.value); setPreset(null); setError(''); };

  // ── GATE: check name + phone before any payment ──
  const validateDonorInfo = () => {
    if (!name.trim())           return 'Please enter your name before proceeding.';
    if (!phone.trim())          return 'Please enter your phone number before proceeding.';
    if (!isValidPhone(phone))   return 'Please enter a valid phone number.';
    if (!finalAmt || finalAmt < 1) return 'Please select or enter a valid amount (minimum ₹1).';
    return null;
  };

  const saveDonation = async (paymentId, method) => {
    try {
      await addDoc(collection(db, 'donations'), {
        name:      name.trim()  || 'Anonymous',
        email:     email.trim() || '',
        phone:     phone.trim(),
        amount:    finalAmt,
        method,
        paymentId,
        donatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Firestore save failed:', err);
    }
  };

  const handleRazorpay = () => {
    setError('');
    const err = validateDonorInfo();
    if (err) { setError(err); return; }
    if (!razorpayReady) { setError('Payment gateway is loading — please try again in a moment.'); return; }

    setLoading(true);
    const rzp = new window.Razorpay({
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      finalAmt * 100,          // paise
      currency:    'INR',
      name:        'Ini Yoruvithiseivom Trust',
      description: 'Donation – Thank you for your generosity',
      prefill:     { name: name.trim(), email: email.trim(), contact: phone.trim() },
      theme:       { color: '#00c8ff' },
      config: {
        display: {
          blocks: {
            banks: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
          },
          sequence: ['block.banks'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: async (response) => {
        // ⚠️ Production: verify response.razorpay_payment_id on your backend
        await saveDonation(response.razorpay_payment_id, 'razorpay');
        setSuccess(
          `Thank you, ${name}! Your donation of ₹${finalAmt.toLocaleString('en-IN')} was received.\nPayment ID: ${response.razorpay_payment_id}`
        );
        setAmount(''); setPreset(null); setName(''); setEmail(''); setPhone('');
        setLoading(false);
      },
      modal: {
        ondismiss: () => setLoading(false),
        confirm_close: true,
      },
    });
    rzp.on('payment.failed', (resp) => {
      setError(`Payment failed: ${resp.error.description}`);
      setLoading(false);
    });
    rzp.open();
  };

  const handleUPI = async (app) => {
    setError('');
    const err = validateDonorInfo();
    if (err) { setError(err); return; }

    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('IniTrust')}&am=${finalAmt}&cu=INR&tn=${encodeURIComponent('Donation')}`;
    window.open(upiUrl, '_blank');
    await saveDonation('upi-' + Date.now(), app);
    setSuccess(`UPI app opened. Thank you, ${name}, for your generous donation of ₹${finalAmt.toLocaleString('en-IN')}!`);
  };

  return (
    <div className="donate-page">
      <div className="donate-hero">
        <h1 className="donate-hero-title">Make a Difference Today</h1>
        <p className="donate-hero-sub">
          Your contribution helps us feed the hungry, support orphans, and bring hope
          to communities across Tamil Nadu.
        </p>
      </div>

      <div className="donate-impact-strip">
        {IMPACT_CARDS.map((c) => (
          <div key={c.amount} className="impact-card">
            <span className="impact-icon">{c.icon}</span>
            <span className="impact-amount">₹{c.amount}</span>
            <span className="impact-text">{c.text}</span>
          </div>
        ))}
      </div>

      <div className="donate-form-card">
        {success && <div className="donate-toast donate-toast--success" role="status">✅ {success}</div>}
        {error   && <div className="donate-toast donate-toast--error"   role="alert">⚠️ {error}</div>}

        {/* ── Step 1 – Donor Info (REQUIRED before payment) ── */}
        <h2 className="donate-step-title">
          <span className="donate-step-num">1</span> Your Details
          <span style={{ fontSize: '0.8rem', color: '#f87171', marginLeft: 8 }}>* Required to donate</span>
        </h2>
        <div className="donate-fields">
          <div className="donate-field-wrap">
            <label className="donate-field-label" htmlFor="d-name">Full Name *</label>
            <input id="d-name" className={`donate-field${!name.trim() && error ? ' donate-field--error' : ''}`}
              type="text" placeholder="Your Name" value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoComplete="name" />
          </div>
          <div className="donate-field-wrap">
            <label className="donate-field-label" htmlFor="d-phone">Phone Number *</label>
            <input id="d-phone" className={`donate-field${!phone.trim() && error ? ' donate-field--error' : ''}`}
              type="tel" placeholder="+91 98765 43210" value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              autoComplete="tel" />
          </div>
          <div className="donate-field-wrap">
            <label className="donate-field-label" htmlFor="d-email">Email <span style={{ fontWeight: 400 }}>(optional – for receipt)</span></label>
            <input id="d-email" className="donate-field"
              type="email" placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" />
          </div>
        </div>

        {/* ── Step 2 – Amount ── */}
        <h2 className="donate-step-title" style={{ marginTop: '2em' }}>
          <span className="donate-step-num">2</span> Choose Amount
        </h2>
        <div className="donate-preset-grid">
          {PRESET_AMOUNTS.map((val) => (
            <button key={val}
              className={`donate-preset-btn${preset === val ? ' active' : ''}`}
              onClick={() => handlePreset(val)}>
              ₹{val.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <div className="donate-custom-row">
          <span className="donate-rupee">₹</span>
          <input type="number" className="donate-custom-input"
            placeholder="Enter custom amount" value={amount} min="1"
            onChange={handleCustom} />
        </div>
        {finalAmt > 0 && (
          <p className="donate-selected-amt">
            Selected: <strong>₹{finalAmt.toLocaleString('en-IN')}</strong>
          </p>
        )}

        {/* ── Step 3 – Pay ── */}
        <h2 className="donate-step-title" style={{ marginTop: '2em' }}>
          <span className="donate-step-num">3</span> Choose Payment Method
        </h2>

        <button className="donate-pay-btn donate-pay-btn--primary"
          onClick={handleRazorpay}
          disabled={loading || !razorpayReady}>
          {!razorpayReady ? 'Loading gateway…' : loading ? 'Opening…' : '💳 Pay via Card / Net Banking / UPI'}
        </button>

        <div className="donate-divider"><span>or pay directly via UPI app</span></div>

        <div className="donate-upi-row">
          {[
            { label: 'Google Pay', emoji: '🟢' },
            { label: 'PhonePe',   emoji: '🟣' },
            { label: 'Paytm',     emoji: '🔵' },
            { label: 'BHIM',      emoji: '🟠' },
          ].map((app) => (
            <button key={app.label} className="donate-upi-app-btn"
              onClick={() => handleUPI(app.label)}>
              {app.emoji} {app.label}
            </button>
          ))}
        </div>

        <div className="donate-qr-wrap">
          <p className="donate-qr-label">Scan to pay via any UPI app</p>
          <img src="/upi-qr.png" alt="UPI QR Code" className="donate-qr-img"
            loading="lazy" width="180" height="180" />
          <p className="donate-upi-id">UPI ID: <strong>{upiId}</strong></p>
        </div>
      </div>

      <div className="donate-trust-row">
        <div className="donate-trust-badge">🔒 256-bit SSL Secured</div>
        <div className="donate-trust-badge">🧾 80G Tax Exemption</div>
        <div className="donate-trust-badge">✅ Razorpay PCI-DSS</div>
        <div className="donate-trust-badge">❤️ Every rupee counts</div>
      </div>
    </div>
  );
}

export default Donate;
