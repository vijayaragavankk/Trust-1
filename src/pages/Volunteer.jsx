// src/pages/Volunteer.jsx
// ✅ Fixed: Firestore save, clean validation, no dead code
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

  const toggleSkill = (skill) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));

  const validate = () => {
    if (!form.name.trim())         return 'Full name is required.';
    if (!form.email.trim())        return 'Email address is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.phone.trim())        return 'Phone number is required.';
    if (!/^[+\d\s\-()]{7,15}$/.test(form.phone)) return 'Please enter a valid phone number.';
    if (!form.availability)        return 'Please select your availability.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'volunteers'), {
        name:         form.name.trim(),
        email:        form.email.trim().toLowerCase(),
        phone:        form.phone.trim(),
        city:         form.city.trim(),
        availability: form.availability,
        skills:       form.skills,
        message:      form.message.trim(),
        status:       'new',
        registeredAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Volunteer submit error:', err);
      setError('Submission failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ name: '', email: '', phone: '', city: '', availability: '', skills: [], message: '' });
    setError('');
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
          <button className="volunteer-reset-btn" onClick={resetForm}>
            Register Another Volunteer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="volunteer-page">

      <div className="volunteer-hero">
        <h1 className="volunteer-hero-title">Volunteer With Us</h1>
        <p className="volunteer-hero-sub">
          Join our family of changemakers. Whether you have an hour or a weekend,
          your time can transform lives.
        </p>
      </div>

      <div className="volunteer-why-strip">
        {[
          { icon: '🥣', title: 'Feed the hungry',   desc: 'Help distribute meals every week' },
          { icon: '📚', title: 'Educate children',  desc: 'Tutor and mentor underprivileged kids' },
          { icon: '🏥', title: 'Run health camps',  desc: 'Support free medical checkups' },
          { icon: '📸', title: 'Document our work', desc: 'Photo, video & social media' },
        ].map((w) => (
          <div key={w.title} className="volunteer-why-card">
            <span className="volunteer-why-icon">{w.icon}</span>
            <strong>{w.title}</strong>
            <p>{w.desc}</p>
          </div>
        ))}
      </div>

      <form className="volunteer-form-card" onSubmit={handleSubmit} noValidate>
        <h2 className="volunteer-form-title">Sign Up to Volunteer</h2>

        {error && (
          <div className="volunteer-toast volunteer-toast--error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className="volunteer-row">
          <div className="volunteer-field-wrap">
            <label className="volunteer-label" htmlFor="v-name">Full Name *</label>
            <input id="v-name" className="volunteer-input" type="text"
              placeholder="Your full name" value={form.name}
              onChange={(e) => set('name', e.target.value)} autoComplete="name" />
          </div>
          <div className="volunteer-field-wrap">
            <label className="volunteer-label" htmlFor="v-email">Email Address *</label>
            <input id="v-email" className="volunteer-input" type="email"
              placeholder="you@example.com" value={form.email}
              onChange={(e) => set('email', e.target.value)} autoComplete="email" />
          </div>
        </div>

        <div className="volunteer-row">
          <div className="volunteer-field-wrap">
            <label className="volunteer-label" htmlFor="v-phone">Phone Number *</label>
            <input id="v-phone" className="volunteer-input" type="tel"
              placeholder="+91 98765 43210" value={form.phone}
              onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          </div>
          <div className="volunteer-field-wrap">
            <label className="volunteer-label" htmlFor="v-city">City / District</label>
            <input id="v-city" className="volunteer-input" type="text"
              placeholder="e.g. Chennai" value={form.city}
              onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" />
          </div>
        </div>

        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label">Availability *</label>
          <div className="volunteer-pill-group" role="group">
            {AVAILABILITY.map((opt) => (
              <button key={opt} type="button"
                className={`volunteer-pill${form.availability === opt ? ' active' : ''}`}
                onClick={() => set('availability', opt)} aria-pressed={form.availability === opt}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label">
            Areas of Interest <span style={{ fontWeight: 400 }}>(select all that apply)</span>
          </label>
          <div className="volunteer-pill-group" role="group">
            {SKILLS.map((skill) => (
              <button key={skill} type="button"
                className={`volunteer-pill${form.skills.includes(skill) ? ' active' : ''}`}
                onClick={() => toggleSkill(skill)} aria-pressed={form.skills.includes(skill)}>
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="volunteer-field-wrap" style={{ width: '100%' }}>
          <label className="volunteer-label" htmlFor="v-msg">Anything else you'd like to share?</label>
          <textarea id="v-msg" className="volunteer-input volunteer-textarea"
            placeholder="Tell us about your experience, motivation, or anything else…"
            value={form.message} onChange={(e) => set('message', e.target.value)} rows="4" />
        </div>

        <button className="volunteer-submit" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Register as Volunteer →'}
        </button>
      </form>
    </div>
  );
}

export default Volunteer;
