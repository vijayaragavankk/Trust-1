import { useState } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [file,        setFile]        = useState(null);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [message,     setMessage]     = useState('');
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file || !title || !description) {
      setMessage('⚠️ All fields are required.');
      return;
    }
    setUploading(true);
    setMessage('');
    try {
      // BUG FIX: original used file.name directly which can collide.
      // Use a timestamp-prefixed path to avoid overwrites.
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const imageRef = ref(storage, `gallery/${safeName}`);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      // BUG FIX: added createdAt timestamp so Firestore can order gallery items
      await addDoc(collection(db, 'gallery'), {
        title,
        description,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      setMessage('✅ Uploaded successfully!');
      setFile(null);
      setTitle('');
      setDescription('');
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (err) {
      setMessage('❌ Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    // BUG FIX: was navigating to '/admin' which didn't match any route
    navigate('/admin/login');
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Admin Dashboard</h2>
      <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>

      {message && <p style={{ marginBottom: '1em', color: message.startsWith('✅') ? '#28a745' : '#dc3545' }}>{message}</p>}

      <div style={styles.form}>
        <input
          type="text"
          placeholder="Image Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="Image Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
        />
        <button onClick={handleUpload} style={styles.uploadBtn} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page:      { padding: '2em', maxWidth: '600px', margin: 'auto', textAlign: 'center' },
  heading:   { color: '#0d6efd', marginBottom: '1em' },
  logoutBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.5em 1em', borderRadius: '5px', marginBottom: '2em', cursor: 'pointer' },
  form:      { display: 'flex', flexDirection: 'column', gap: '1em' },
  input:     { padding: '0.8em', border: '1px solid #555', borderRadius: '5px', background: '#1a1a1a', color: '#fff' },
  textarea:  { padding: '0.8em', border: '1px solid #555', borderRadius: '5px', background: '#1a1a1a', color: '#fff', resize: 'vertical', minHeight: '80px' },
  uploadBtn: { backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.8em', borderRadius: '5px', cursor: 'pointer' },
};

export default AdminDashboard;
