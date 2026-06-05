// src/pages/Donate.jsx
// Razorpay SDK is loaded DYNAMICALLY here — not in index.html.
// This means the 45KB script only downloads when someone visits /donate.
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

// Dynamically inject Razorpay — only on the donate page
function useRazorpay() {
  const [ready, setReady] = useState(!!window.Razorpay);
  useEffect(() => {
    if (window.Razorpay) { setReady(true); return; }
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async    = true;
    script.onload   = () => setReady(true);
    script.onerror  = () => console.error('Razorpay failed to load');
    document.head.appendChild(script);
    return () => {
      // Only remove if we added it (window.Razorpay check guards re-renders)
      if (!window.Razorpay) document.head.removeChild(script);
    };
  }, []);
  return ready;
}

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

  const upiId   = import.meta.env.VITE_UPI_ID || 'yourupiid@upi';
  const finalAmt = preset || parseInt(amount, 10) || 0;

  const handlePreset = (val) => { setPreset(val); setAmount(''); };
  const handleCustom = (e)   => { setAmount(e.target.value); setPreset(null); };

  const saveDonation = async (paymentId, method) => {
    try {
      await addDoc(collection(db, 'donations'), {
        name:      name  || 'Anonymous',
        email:     email || '',
        phone:     phone || '',
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
    if (!finalAmt || finalAmt < 1) { setError('Please select or enter a valid amount (minimum ₹1).'); return; }
    if (!razorpayReady)             { setError('Payment gateway is loading — please try again in a moment.'); return; }
    setLoading(true);
    new window.Razorpay({
      key:         import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:      finalAmt * 100,
      currency:    'INR',
      name:        'Ini_Yoruvithiseivom Trust',
      description: 'Donation',
      prefill:     { name, email, contact: phone },
      theme:       { color: '#00c8ff' },
      handler: async (response) => {
        await saveDonation(response.razorpay_payment_id, 'razorpay');
        setSuccess(`Thank you${name ? ', ' + name : ''}! Your donation of ₹${finalAmt} was received. Payment ID: ${response.razorpay_payment_id}`);
        setAmount(''); setPreset(null); setName(''); setEmail(''); setPhone('');
        setLoading(false);
      },
      modal: { ondismiss: () => setLoading(false) },
    }).open();
  };

  const handleUPI = async (app) => {
    setError('');
    if (!finalAmt || finalAmt < 1) { setError('Please select or enter a valid amount before paying via UPI.'); return; }
    const upiUrl = `upi://pay?pa=${upiId}&pn=IniTrust&am=${finalAmt}&cu=INR&tn=Donation`;
    window.open(upiUrl, '_blank');
    await saveDonation('upi-' + Date.now(), app);
    setSuccess(`UPI app opened. Thank you for your generous donation of ₹${finalAmt}!`);
  };

  return (
    <div className="donate-page">
      <div className="donate-hero">
        <h1 className="donate-hero-title">Make a Difference Today</h1>
        <p className="donate-hero-sub">
          Your contribution helps us feed the hungry, support orphans, and bring hope to communities across Tamil Nadu.
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
        {success && <div className="donate-toast donate-toast--success">✅ {success}</div>}
        {error   && <div className="donate-toast donate-toast--error">⚠️ {error}</div>}

        {/* Step 1 – Amount */}
        <h2 className="donate-step-title">
          <span className="donate-step-num">1</span> Choose Amount
        </h2>
        <div className="donate-preset-grid">
          {PRESET_AMOUNTS.map((val) => (
            <button
              key={val}
              className={`donate-preset-btn${preset === val ? ' active' : ''}`}
              onClick={() => handlePreset(val)}
            >
              ₹{val.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <div className="donate-custom-row">
          <span className="donate-rupee">₹</span>
          <input
            type="number"
            className="donate-custom-input"
            placeholder="Enter custom amount"
            value={amount}
            min="1"
            onChange={handleCustom}
          />
        </div>
        {finalAmt > 0 && (
          <p className="donate-selected-amt">Selected: <strong>₹{finalAmt.toLocaleString('en-IN')}</strong></p>
        )}

        {/* Step 2 – Donor info */}
        <h2 className="donate-step-title" style={{ marginTop: '2em' }}>
          <span className="donate-step-num">2</span> Your Details
          <span className="donate-optional"> (optional)</span>
        </h2>
        <div className="donate-fields">
          <input className="donate-field" type="text"  placeholder="Your Name"      value={name}  onChange={(e) => setName(e.target.value)}  />
          <input className="donate-field" type="email" placeholder="Email Address"  value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="donate-field" type="tel"   placeholder="Phone Number"   value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {/* Step 3 – Pay */}
        <h2 className="donate-step-title" style={{ marginTop: '2em' }}>
          <span className="donate-step-num">3</span> Choose Payment Method
        </h2>
        <button
          className="donate-pay-btn donate-pay-btn--primary"
          onClick={handleRazorpay}
          disabled={loading || !razorpayReady}
        >
          {!razorpayReady ? 'Loading gateway…' : loading ? 'Opening…' : '💳 Pay via Card / Net Banking / UPI'}
        </button>

        <div className="donate-divider"><span>or pay directly via UPI</span></div>

        <div className="donate-upi-row">
          {[
            { label: 'Google Pay', emoji: '🟢' },
            { label: 'PhonePe',   emoji: '🟣' },
            { label: 'Paytm',     emoji: '🔵' },
            { label: 'BHIM',      emoji: '🟠' },
          ].map((app) => (
            <button key={app.label} className="donate-upi-app-btn" onClick={() => handleUPI(app.label)}>
              {app.emoji} {app.label}
            </button>
          ))}
        </div>

        <div className="donate-qr-wrap">
          <p className="donate-qr-label">Scan to pay via any UPI app</p>
          <img src="/upi-qr.png" alt="UPI QR Code" className="donate-qr-img" loading="lazy" width="180" height="180" />
          <p className="donate-upi-id">UPI ID: <strong>{upiId}</strong></p>
        </div>
      </div>

      <div className="donate-trust-row">
        <div className="donate-trust-badge">🔒 100% Secure Payments</div>
        <div className="donate-trust-badge">🧾 80G Tax Exemption</div>
        <div className="donate-trust-badge">❤️ Every rupee counts</div>
      </div>
    </div>
  );
}

export default Donate;
