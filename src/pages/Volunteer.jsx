// src/pages/Volunteer.jsx
// New page. Saves submissions to Firestore 'volunteers' collection.
// Admin can view them in AdminDashboard (Volunteers tab).
import { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SKILLS = [
  'Food Distribution', 'Medical / Health', 'Education / Tutoring',
  'Logistics & Transport', 'Photography / Media', 'Event Management',
  'Fundraising', 'IT / Web', 'Other',
];

const AVAILABILITY = ['Weekdays', 'Weekends', 'Both', 'Flexible'];

function Volunteer() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    availability: '', skills: [], message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.availability) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'volunteers'), {
        ...form,
        status:      'new',           // admin can mark as 'contacted' / 'active'
        registeredAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="volunteer-page">
        <div className="volunteer-success">
          <span className="volunteer-success-icon">🎉</span>
          <h2>Thank you, {form.name}!</h2>
          <p>
            Your volunteer registration has been received. Our team will contact you
            at <strong>{form.email}</strong> within 2–3 business days.
          </p>
          <button
            className="volunteer-reset-btn"
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', email: '', phone: '', city: '', availability: '', skills: [], message: '' });
            }}
          >
            Register Another Volunteer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="volunteer-page">

      {/* Hero */}
      <div className="volunteer-hero">
        <h1 className="volunteer-hero-title">Volunteer With Us</h1>
        <p className="volunteer-hero-sub">
          Join our family of changemakers. Whether you have an hour or a weekend,
          your time can transform lives.
        </p>
      </div>

      {/* Why volunteer strip */}
      <div className="volunteer-why-strip">
        {[
          { icon: '🥣', title: 'Feed the hungry',    desc: 'Help distribute meals every week' },
          { icon: '📚', title: 'Educate children',   desc: 'Tutor and mentor underprivileged kids' },
          { icon: '🏥', title: 'Run health camps',   desc: 'Support free medical checkups' },
          { icon: '📸', title: 'Document our work',  desc: 'Photo, video & social media' },
        ].map((w) => (
          <div key={w.title} className="volunteer-why-card">
            <span className="volunteer-why-icon">{w.icon}</span>
            <strong>{w.title}</strong>
            <p>{w.desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <form className="volunteer-form-card" onSubmit={handleSubmit} noValidate>
        <h2 className="volunteer-form-title">Sign Up to Volunteer</h2>

        {error && <div className="volunteer-toast volunteer-toast--error">⚠️ {error}</div>}

        {/* Row 1 */}
        <div className="volunteer-row">
          <div className="volunteer-field-wrap">
            <label className="volunteer-label">Full Name *</label>
            <input
              className="volunteer-input"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div className="volunteer-field-wrap">
            <label className="volunteer-label">Email Address *</label>
            <input
              className="volunteer-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="volunteer-row">
          <div className="volunteer-field-wrap">
            <label className="volunteer-label">Phone Number *</label>
            <input
              className="volunteer-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </div>
          <div className="volunteer-field-wrap">
            <label className="volunteer-label">City / District</label>
            <input
              className="volunteer-input"
              type="text"
              placeholder="e.g. Chennai"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </div>
        </div>

        {/* Availability */}
        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label">Availability *</label>
          <div className="volunteer-pill-group">
            {AVAILABILITY.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`volunteer-pill${form.availability === opt ? ' active' : ''}`}
                onClick={() => set('availability', opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Skills (multi-select) */}
        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label">Areas of Interest <span style={{ fontWeight: 400 }}>(select all that apply)</span></label>
          <div className="volunteer-pill-group">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                className={`volunteer-pill${form.skills.includes(skill) ? ' active' : ''}`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label">Anything else you'd like to share?</label>
          <textarea
            className="volunteer-input volunteer-textarea"
            placeholder="Tell us about your experience, motivation, or anything else…"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            rows="4"
          />
        </div>

        <button className="volunteer-submit" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Register as Volunteer →'}
        </button>
      </form>
    </div>
  );
}

export default Volunteer;
