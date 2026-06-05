import { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function Contact() {
  const [form,      setForm]      = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'contacts'), {
        name:        form.name,
        email:       form.email,
        phone:       form.phone    || '',
        subject:     form.subject  || '',
        message:     form.message,
        submittedAt: serverTimestamp(),
        status:      'new',          // admin can update to 'read' / 'replied'
      });
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setError('Failed to send message. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">

      {/* Page header */}
      <div className="contact-hero">
        <h1 className="contact-hero-title">Get in Touch</h1>
        <p className="contact-hero-sub">
          Have a question, want to volunteer, or just want to say hello? We'd love to hear from you.
        </p>
      </div>

      <div className="contact-layout">

        {/* Form card */}
        <div className="contact-form-card">
          <h2 className="contact-card-title">Send us a Message</h2>

          {submitted && (
            <div className="contact-toast contact-toast--success">
              ✅ Thank you for reaching out! We'll get back to you within 24 hours.
            </div>
          )}
          {error && (
            <div className="contact-toast contact-toast--error">
              ⚠️ {error}
            </div>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-row">
              <div className="contact-field-wrap">
                <label className="contact-label">Full Name *</label>
                <input
                  className="contact-input"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="contact-field-wrap">
                <label className="contact-label">Email Address *</label>
                <input
                  className="contact-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="contact-row">
              <div className="contact-field-wrap">
                <label className="contact-label">Phone Number</label>
                <input
                  className="contact-input"
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="contact-field-wrap">
                <label className="contact-label">Subject</label>
                <select
                  className="contact-input contact-select"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="">Select a subject</option>
                  <option value="Donation Query">Donation Query</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Media">Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="contact-field-wrap" style={{ width: '100%' }}>
              <label className="contact-label">Message *</label>
              <textarea
                className="contact-input contact-textarea"
                name="message"
                placeholder="Tell us how we can help…"
                value={form.message}
                onChange={handleChange}
                rows="5"
                required
              />
            </div>

            <button className="contact-submit" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Message →'}
            </button>
          </form>
        </div>

        {/* Info sidebar */}
        <div className="contact-info-card">
          <h2 className="contact-card-title">Contact Info</h2>

          <div className="contact-info-item">
            <span className="contact-info-icon">📧</span>
            <div>
              <p className="contact-info-label">Email</p>
              <a href="mailto:contact@ourtrust.org" className="contact-info-value">
                contact@ourtrust.org
              </a>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon">📞</span>
            <div>
              <p className="contact-info-label">Phone</p>
              <a href="tel:+919876543210" className="contact-info-value">
                +91 98765 43210
              </a>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon">📍</span>
            <div>
              <p className="contact-info-label">Address</p>
              <p className="contact-info-value">
                123 Service Street,<br />Chennai, Tamil Nadu, India
              </p>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="contact-info-icon">🕐</span>
            <div>
              <p className="contact-info-label">Office Hours</p>
              <p className="contact-info-value">Mon – Sat: 9 AM – 6 PM</p>
            </div>
          </div>

          <div className="contact-socials-block">
            <p className="contact-info-label" style={{ marginBottom: '0.75em' }}>Follow Us</p>
            <div className="contact-social-links">
              <a href="https://facebook.com"  target="_blank" rel="noreferrer" className="contact-social-btn">
                Facebook
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="contact-social-btn">
                Instagram
              </a>
              <a href="https://twitter.com"   target="_blank" rel="noreferrer" className="contact-social-btn">
                Twitter
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;
