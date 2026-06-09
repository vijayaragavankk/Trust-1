import { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo / branding */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🔐</span>
          <span style={styles.logoText}>Admin Portal</span>
        </div>

        <h2 style={styles.heading}>Sign In</h2>
        <p style={styles.subheading}>Enter your credentials to access the dashboard</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span> {error}
          </div>
        )}

        <form style={styles.form} onSubmit={handleLogin}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              autoComplete="username"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)',
    padding: '1em',
  },
  card: {
    background: '#111827',
    border: '1px solid #1e3a5f',
    borderRadius: '16px',
    padding: '2.5em 2em',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0, 100, 200, 0.2)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5em',
    marginBottom: '1.5em',
  },
  logoIcon: {
    fontSize: '1.6rem',
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#60a5fa',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f1f5f9',
    textAlign: 'center',
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '0.3em',
  },
  subheading: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: '0.9rem',
    marginBottom: '1.8em',
  },
  errorBox: {
    background: 'rgba(220, 53, 69, 0.15)',
    border: '1px solid rgba(220, 53, 69, 0.4)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '0.75em 1em',
    fontSize: '0.875rem',
    marginBottom: '1.2em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
  },
  errorIcon: {
    fontSize: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2em',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4em',
  },
  label: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  input: {
    padding: '0.8em 1em',
    border: '1px solid #1e3a5f',
    borderRadius: '8px',
    background: '#0d1b2a',
    color: '#f1f5f9',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.9em',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '0.5em',
    transition: 'background 0.2s',
    letterSpacing: '0.02em',
  },
};

export default AdminLogin;
