import { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function Contact() {
  const [form,      setForm]      = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // BUG FIX: original form submit did nothing – now saves to Firestore 'contacts' collection
      await addDoc(collection(db, 'contacts'), {
        ...form,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <h2 className="contact-heading">Contact Us</h2>
      <p style={{ color: '#bbb', marginBottom: '0.5em' }}>We would love to hear from you.</p>

      {submitted && <div className="contact-toast">Thank you for contacting us! We&apos;ll be in touch soon.</div>}
      {error     && <div style={{ color: '#dc3545', marginBottom: '1em' }}>{error}</div>}

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          className="contact-input"
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="contact-input"
          type="email"
          name="email"
          placeholder="Your Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <textarea
          className="contact-textarea"
          name="message"
          placeholder="Your Message"
          value={form.message}
          onChange={handleChange}
          rows="5"
          required
        />
        <button className="contact-submit" type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Message'}
        </button>
      </form>

      <div className="contact-info">
        <p><strong>Email:</strong> contact@ourtrust.org</p>
        <p><strong>Phone:</strong> +91 98765 43210</p>
        <p><strong>Address:</strong> 123 Service Street, Chennai, India</p>
        <div className="contact-socials">
          <a href="https://facebook.com"  target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://twitter.com"   target="_blank" rel="noreferrer">Twitter</a>
        </div>
      </div>
    </div>
  );
}

export default Contact;
