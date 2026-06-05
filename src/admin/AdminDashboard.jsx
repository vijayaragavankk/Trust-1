// src/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  onSnapshot, orderBy, query, doc, updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   TAB 1 – Gallery Upload
───────────────────────────────────────────────────────────── */
function GalleryTab() {
  const [file, setFile]               = useState(null);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading]     = useState(false);
  const [message, setMessage]         = useState('');

  const handleUpload = async () => {
    if (!file || !title || !description) { setMessage('⚠️ All fields are required.'); return; }
    setUploading(true); setMessage('');
    try {
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const imgRef   = ref(storage, `gallery/${safeName}`);
      await uploadBytes(imgRef, file);
      const imageUrl = await getDownloadURL(imgRef);
      await addDoc(collection(db, 'gallery'), { title, description, imageUrl, createdAt: serverTimestamp() });
      setMessage('✅ Uploaded successfully!');
      setFile(null); setTitle(''); setDescription('');
      document.getElementById('admin-file-input').value = '';
    } catch (err) {
      setMessage('❌ Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.formWrap}>
      <h3 style={s.tabTitle}>Upload Gallery Image</h3>
      {message && <p style={{ marginBottom: '1em', color: message.startsWith('✅') ? '#4ade80' : '#f87171' }}>{message}</p>}
      <input  type="text"  placeholder="Image Title"       value={title}       onChange={(e) => setTitle(e.target.value)}       style={s.input} />
      <textarea            placeholder="Image Description" value={description} onChange={(e) => setDescription(e.target.value)} style={s.textarea} />
      <input  id="admin-file-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])}                   style={s.input} />
      <button onClick={handleUpload} style={s.primaryBtn} disabled={uploading}>
        {uploading ? 'Uploading…' : 'Upload Image'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 2 – Contacts
───────────────────────────────────────────────────────────── */
function ContactsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contacts'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const markRead = (id) => updateDoc(doc(db, 'contacts', id), { status: 'read' });

  if (loading) return <p style={s.muted}>Loading…</p>;
  if (!rows.length) return <p style={s.muted}>No contact submissions yet.</p>;

  return (
    <div>
      <h3 style={s.tabTitle}>Contacts <span style={s.badge}>{rows.length}</span></h3>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr style={s.thead}>
            {['Name','Email','Subject','Message','Date','Status'].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ ...s.tr, opacity: c.status === 'read' ? 0.5 : 1 }}>
                <td style={s.td}>{c.name}</td>
                <td style={s.td}><a href={`mailto:${c.email}`} style={s.link}>{c.email}</a></td>
                <td style={s.td}>{c.subject || '—'}</td>
                <td style={{ ...s.td, maxWidth: 220 }}>{c.message}</td>
                <td style={s.td}>{c.submittedAt?.toDate?.()?.toLocaleDateString() || '—'}</td>
                <td style={s.td}>
                  {c.status === 'read'
                    ? <span style={s.tagRead}>Read</span>
                    : <button style={s.smallBtn} onClick={() => markRead(c.id)}>Mark read</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 3 – Donations
───────────────────────────────────────────────────────────── */
function DonationsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'donations'), orderBy('donatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <p style={s.muted}>Loading…</p>;
  if (!rows.length) return <p style={s.muted}>No donations recorded yet.</p>;

  const total = rows.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div>
      <h3 style={s.tabTitle}>Donations <span style={s.badge}>{rows.length}</span></h3>
      <div style={s.totalRow}>
        <span style={s.muted}>Total collected</span>
        <strong style={{ color: '#4ade80', fontSize: '1.3rem' }}>₹{total.toLocaleString('en-IN')}</strong>
      </div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr style={s.thead}>
            {['Name','Amount','Method','Payment ID','Date'].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} style={s.tr}>
                <td style={s.td}>{d.name || 'Anonymous'}</td>
                <td style={{ ...s.td, color: '#4ade80', fontWeight: 700 }}>₹{(d.amount || 0).toLocaleString('en-IN')}</td>
                <td style={s.td}>{d.method || '—'}</td>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>{d.paymentId}</td>
                <td style={s.td}>{d.donatedAt?.toDate?.()?.toLocaleDateString() || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TAB 4 – Volunteers
───────────────────────────────────────────────────────────── */
function VolunteersTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'volunteers'), orderBy('registeredAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const setStatus = (id, status) => updateDoc(doc(db, 'volunteers', id), { status });

  if (loading) return <p style={s.muted}>Loading…</p>;
  if (!rows.length) return <p style={s.muted}>No volunteer registrations yet.</p>;

  return (
    <div>
      <h3 style={s.tabTitle}>Volunteers <span style={s.badge}>{rows.length}</span></h3>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr style={s.thead}>
            {['Name','Email','Phone','City','Availability','Skills','Date','Status'].map((h) => <th key={h} style={s.th}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} style={s.tr}>
                <td style={s.td}>{v.name}</td>
                <td style={s.td}><a href={`mailto:${v.email}`} style={s.link}>{v.email}</a></td>
                <td style={s.td}>{v.phone || '—'}</td>
                <td style={s.td}>{v.city  || '—'}</td>
                <td style={s.td}>{v.availability || '—'}</td>
                <td style={{ ...s.td, maxWidth: 200 }}>{(v.skills || []).join(', ') || '—'}</td>
                <td style={s.td}>{v.registeredAt?.toDate?.()?.toLocaleDateString() || '—'}</td>
                <td style={s.td}>
                  <select
                    value={v.status || 'new'}
                    onChange={(e) => setStatus(v.id, e.target.value)}
                    style={{ background: '#1e1e1e', color: '#ccc', border: '1px solid #333', borderRadius: 6, padding: '2px 6px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Dashboard Shell
───────────────────────────────────────────────────────────── */
const TABS = ['Gallery', 'Contacts', 'Donations', 'Volunteers'];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Gallery');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.heading}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
      </div>

      <div style={s.tabBar}>
        {TABS.map((t) => (
          <button
            key={t}
            style={{ ...s.tabBtn, ...(activeTab === t ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {activeTab === 'Gallery'    && <GalleryTab />}
        {activeTab === 'Contacts'   && <ContactsTab />}
        {activeTab === 'Donations'  && <DonationsTab />}
        {activeTab === 'Volunteers' && <VolunteersTab />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const s = {
  page:      { padding: '2em 1.5em', maxWidth: '980px', margin: '5em auto 2em', color: '#f0f0f0' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em' },
  heading:   { color: '#00c8ff', fontSize: '1.5rem', fontWeight: 700 },
  logoutBtn: { background: '#dc3545', color: '#fff', border: 'none', padding: '0.5em 1.2em', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  tabBar:    { display: 'flex', gap: '0.4em', borderBottom: '1px solid #2a2a2a', marginBottom: '1.5em', flexWrap: 'wrap' },
  tabBtn:    { background: 'none', border: 'none', color: '#888', padding: '0.6em 1.2em', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '2px solid transparent', transition: 'color .2s, border-color .2s' },
  tabActive: { color: '#00c8ff', borderBottomColor: '#00c8ff' },
  tabContent:{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '1.5em' },
  tabTitle:  { fontSize: '1rem', fontWeight: 600, marginBottom: '1.2em', color: '#e0e0e0' },
  badge:     { background: '#00c8ff22', color: '#00c8ff', borderRadius: 20, padding: '1px 8px', fontSize: '0.78rem', marginLeft: 8 },
  formWrap:  { display: 'flex', flexDirection: 'column', gap: '0.85em', maxWidth: 500 },
  input:     { padding: '0.75em 1em', border: '1px solid #333', borderRadius: 8, background: '#1e1e1e', color: '#fff', fontSize: '0.95rem' },
  textarea:  { padding: '0.75em 1em', border: '1px solid #333', borderRadius: 8, background: '#1e1e1e', color: '#fff', fontSize: '0.95rem', resize: 'vertical', minHeight: 80 },
  primaryBtn:{ background: '#00c8ff', color: '#000', border: 'none', padding: '0.8em', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' },
  muted:     { color: '#888', fontSize: '0.9rem', padding: '1em 0' },
  tableWrap: { overflowX: 'auto' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  thead:     { borderBottom: '1px solid #2a2a2a' },
  th:        { textAlign: 'left', padding: '0.6em 0.75em', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' },
  tr:        { borderBottom: '1px solid #1a1a1a' },
  td:        { padding: '0.65em 0.75em', color: '#ccc', verticalAlign: 'top', lineHeight: 1.5 },
  link:      { color: '#00c8ff', textDecoration: 'none' },
  tagRead:   { background: '#1a2a1a', color: '#4ade80', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem' },
  smallBtn:  { background: '#1e2a3a', color: '#60a5fa', border: '1px solid #2a3a5a', padding: '2px 8px', borderRadius: 12, cursor: 'pointer', fontSize: '0.78rem' },
  totalRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d2a1a', border: '1px solid #166534', borderRadius: 8, padding: '0.75em 1em', marginBottom: '1.2em' },
};

export default AdminDashboard;
