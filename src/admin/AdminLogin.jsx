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
      // BUG FIX: was alert() – replaced with inline error message (better UX)
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Admin Login</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form style={styles.form} onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
          autoComplete="current-password"
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page:    { padding: '2em', maxWidth: '400px', margin: 'auto', textAlign: 'center' },
  heading: { color: '#0d6efd', marginBottom: '1em' },
  error:   { color: '#dc3545', marginBottom: '1em', fontSize: '0.9em' },
  form:    { display: 'flex', flexDirection: 'column', gap: '1em' },
  input:   { padding: '0.8em', border: '1px solid #555', borderRadius: '5px', background: '#1a1a1a', color: '#fff' },
  button:  { backgroundColor: '#0d6efd', color: 'white', padding: '0.8em', borderRadius: '5px', border: 'none', cursor: 'pointer' },
};

export default AdminLogin;
