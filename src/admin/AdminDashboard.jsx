// src/admin/AdminDashboard.jsx
// ✅ Tabs: Gallery | Contacts | Donations | Volunteers | Site Settings
// ✅ CSV export on every data tab
// ✅ Volunteer status management
// ✅ Delete entries
// ✅ Site Settings tab — edit trust name, tagline, UPI ID, contact email without touching code

import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  onSnapshot, orderBy, query,
  doc, updateDoc, deleteDoc, getDoc, setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────── helpers ── */
const fmt = (ts) => ts?.toDate?.()?.toLocaleDateString('en-IN') ?? '—';

function downloadCSV(rows, headers, filename) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click(); URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────── Gallery ── */
function GalleryTab() {
  const [items,       setItems]       = useState([]);
  const [file,        setFile]        = useState(null);
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [msg,         setMsg]         = useState('');

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  const handleUpload = async () => {
    if (!file || !title.trim() || !description.trim()) { setMsg('⚠️ All fields are required.'); return; }
    setUploading(true); setMsg('');
    try {
      const safeName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const imgRef   = ref(storage, `gallery/${safeName}`);
      await uploadBytes(imgRef, file);
      const imageUrl = await getDownloadURL(imgRef);
      await addDoc(collection(db, 'gallery'), { title: title.trim(), description: description.trim(), imageUrl, storagePath: `gallery/${safeName}`, createdAt: serverTimestamp() });
      setMsg('✅ Uploaded successfully!');
      setFile(null); setTitle(''); setDescription('');
      document.getElementById('admin-file-input').value = '';
    } catch (e) {
      setMsg('❌ Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'gallery', item.id));
      if (item.storagePath) await deleteObject(ref(storage, item.storagePath)).catch(() => {});
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  return (
    <div>
      <h3 style={s.tabTitle}>Gallery Management</h3>

      {/* Upload form */}
      <div style={s.formWrap}>
        <h4 style={{ color: '#ccc', marginBottom: '0.5em' }}>Upload New Image</h4>
        {msg && <p style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</p>}
        <input style={s.input} type="text" placeholder="Image Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea style={s.textarea} placeholder="Image Description *" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input id="admin-file-input" style={s.input} type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        <button style={s.primaryBtn} onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading…' : '⬆ Upload Image'}
        </button>
      </div>

      {/* Gallery grid */}
      {items.length > 0 && (
        <div style={{ marginTop: '2em' }}>
          <h4 style={{ color: '#ccc', marginBottom: '0.8em' }}>Uploaded Images ({items.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1em' }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: '#1e1e1e', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} loading="lazy" />
                <div style={{ padding: '0.6em' }}>
                  <p style={{ color: '#e0e0e0', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>{item.title}</p>
                  <p style={{ color: '#888', fontSize: '0.75rem', margin: '2px 0 8px' }}>{item.description}</p>
                  <button style={s.dangerSmallBtn} onClick={() => handleDelete(item)}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── Contacts ── */
function ContactsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contacts'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, []);

  const markRead   = (id) => updateDoc(doc(db, 'contacts', id), { status: 'read' });
  const handleDel  = async (id) => { if (confirm('Delete this contact?')) await deleteDoc(doc(db, 'contacts', id)); };
  const exportCSV  = () => downloadCSV(
    rows.map((r) => ({ Name: r.name, Email: r.email, Subject: r.subject, Message: r.message, Date: fmt(r.submittedAt), Status: r.status })),
    ['Name', 'Email', 'Subject', 'Message', 'Date', 'Status'],
    'contacts.csv'
  );

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
        <h3 style={s.tabTitle}>Contacts <span style={s.badge}>{rows.length}</span></h3>
        {rows.length > 0 && <button style={s.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>}
      </div>
      {!rows.length ? <p style={s.muted}>No contact submissions yet.</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Name','Email','Subject','Message','Date','Status',''].map((h) => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ ...s.tr, opacity: c.status === 'read' ? 0.55 : 1 }}>
                  <td style={s.td}>{c.name}</td>
                  <td style={s.td}><a href={`mailto:${c.email}`} style={s.link}>{c.email}</a></td>
                  <td style={s.td}>{c.subject || '—'}</td>
                  <td style={{ ...s.td, maxWidth: 220 }}>{c.message}</td>
                  <td style={s.td}>{fmt(c.submittedAt)}</td>
                  <td style={s.td}>
                    {c.status === 'read'
                      ? <span style={s.tagRead}>Read</span>
                      : <button style={s.smallBtn} onClick={() => markRead(c.id)}>Mark read</button>}
                  </td>
                  <td style={s.td}>
                    <button style={s.dangerSmallBtn} onClick={() => handleDel(c.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── Donations ── */
function DonationsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'donations'), orderBy('donatedAt', 'desc'));
    return onSnapshot(q, (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, []);

  const total     = rows.reduce((s, d) => s + (d.amount || 0), 0);
  const exportCSV = () => downloadCSV(
    rows.map((r) => ({ Name: r.name, Phone: r.phone, Email: r.email, Amount: r.amount, Method: r.method, PaymentID: r.paymentId, Date: fmt(r.donatedAt) })),
    ['Name', 'Phone', 'Email', 'Amount', 'Method', 'PaymentID', 'Date'],
    'donations.csv'
  );

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
        <h3 style={s.tabTitle}>Donations <span style={s.badge}>{rows.length}</span></h3>
        {rows.length > 0 && <button style={s.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>}
      </div>
      {rows.length > 0 && (
        <div style={s.totalRow}>
          <span style={s.muted}>Total collected</span>
          <strong style={{ color: '#4ade80', fontSize: '1.3rem' }}>₹{total.toLocaleString('en-IN')}</strong>
        </div>
      )}
      {!rows.length ? <p style={s.muted}>No donations recorded yet.</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Name','Phone','Amount','Method','Payment ID','Date'].map((h) => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} style={s.tr}>
                  <td style={s.td}>{d.name || 'Anonymous'}</td>
                  <td style={s.td}>{d.phone || '—'}</td>
                  <td style={{ ...s.td, color: '#4ade80', fontWeight: 700 }}>₹{(d.amount || 0).toLocaleString('en-IN')}</td>
                  <td style={s.td}>{d.method || '—'}</td>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.73rem', color: '#888' }}>{d.paymentId}</td>
                  <td style={s.td}>{fmt(d.donatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── Volunteers ── */
function VolunteersTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    const q = query(collection(db, 'volunteers'), orderBy('registeredAt', 'desc'));
    return onSnapshot(q, (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, []);

  const setStatus = (id, status) => updateDoc(doc(db, 'volunteers', id), { status });
  const handleDel = async (id) => { if (confirm('Delete this volunteer record?')) await deleteDoc(doc(db, 'volunteers', id)); };

  const filtered  = rows.filter((v) =>
    !search || [v.name, v.email, v.phone, v.city, v.availability].some((f) =>
      (f || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const exportCSV = () => downloadCSV(
    rows.map((v) => ({ Name: v.name, Email: v.email, Phone: v.phone, City: v.city, Availability: v.availability, Skills: (v.skills || []).join(' | '), Status: v.status, Date: fmt(v.registeredAt) })),
    ['Name', 'Email', 'Phone', 'City', 'Availability', 'Skills', 'Status', 'Date'],
    'volunteers.csv'
  );

  const statusColors = { new: '#60a5fa', contacted: '#facc15', active: '#4ade80', inactive: '#888' };

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em', flexWrap: 'wrap', gap: '0.5em' }}>
        <h3 style={s.tabTitle}>Volunteers <span style={s.badge}>{rows.length}</span></h3>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <input style={{ ...s.input, width: 200 }} placeholder="Search name / email…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {rows.length > 0 && <button style={s.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>

      {!filtered.length ? <p style={s.muted}>{rows.length ? 'No results match your search.' : 'No volunteer registrations yet.'}</p> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr style={s.thead}>
              {['Name','Email','Phone','City','Availability','Skills','Date','Status',''].map((h) => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} style={s.tr}>
                  <td style={s.td}>{v.name}</td>
                  <td style={s.td}><a href={`mailto:${v.email}`} style={s.link}>{v.email}</a></td>
                  <td style={s.td}><a href={`tel:${v.phone}`} style={s.link}>{v.phone || '—'}</a></td>
                  <td style={s.td}>{v.city || '—'}</td>
                  <td style={s.td}>{v.availability || '—'}</td>
                  <td style={{ ...s.td, maxWidth: 200, fontSize: '0.78rem' }}>{(v.skills || []).join(', ') || '—'}</td>
                  <td style={s.td}>{fmt(v.registeredAt)}</td>
                  <td style={s.td}>
                    <select value={v.status || 'new'} onChange={(e) => setStatus(v.id, e.target.value)}
                      style={{ background: '#1e1e1e', color: statusColors[v.status] || '#ccc', border: '1px solid #333', borderRadius: 6, padding: '3px 6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                      <option value="new">🔵 New</option>
                      <option value="contacted">🟡 Contacted</option>
                      <option value="active">🟢 Active</option>
                      <option value="inactive">⚫ Inactive</option>
                    </select>
                  </td>
                  <td style={s.td}>
                    <button style={s.dangerSmallBtn} onClick={() => handleDel(v.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── Site Settings ── */
function SettingsTab() {
  const docRef = doc(db, 'settings', 'site');
  const [cfg, setCfg] = useState({
    trustName: '', tagline: '', upiId: '', contactEmail: '',
    contactPhone: '', address: '', donationNote: '', volunteerNote: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    getDoc(docRef).then((snap) => {
      if (snap.exists()) setCfg((c) => ({ ...c, ...snap.data() }));
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await setDoc(docRef, cfg, { merge: true });
      setMsg('✅ Settings saved!');
    } catch (e) {
      setMsg('❌ Save failed: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const Field = ({ label, field, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: '1em' }}>
      <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>{label}</label>
      <input style={s.input} type={type} placeholder={placeholder}
        value={cfg[field] || ''} onChange={(e) => setCfg((c) => ({ ...c, [field]: e.target.value }))} />
    </div>
  );

  if (loading) return <p style={s.muted}>Loading settings…</p>;

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={s.tabTitle}>Site Settings</h3>
      <p style={{ ...s.muted, marginBottom: '1.5em' }}>
        Edit these values here — no code changes needed. Your pages can read from Firestore
        using the <code style={{ color: '#00c8ff' }}>settings/site</code> document.
      </p>

      {msg && <p style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '1em' }}>{msg}</p>}

      <Field label="Trust / Organisation Name"  field="trustName"      placeholder="Ini Yoruvithiseivom Trust" />
      <Field label="Tagline / Mission Statement" field="tagline"        placeholder="Serving humanity with compassion" />
      <Field label="UPI ID (shown on donate page)" field="upiId"        placeholder="yourupiid@upi" />
      <Field label="Contact Email"               field="contactEmail"   placeholder="info@yourtrust.org" type="email" />
      <Field label="Contact Phone"               field="contactPhone"   placeholder="+91 98765 43210" type="tel" />
      <Field label="Address"                     field="address"        placeholder="123 Street, City, State" />

      <div style={{ marginBottom: '1em' }}>
        <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>Donation Page Note</label>
        <textarea style={{ ...s.input, ...s.textarea }} placeholder="e.g. All donations are 80G eligible…"
          value={cfg.donationNote || ''} onChange={(e) => setCfg((c) => ({ ...c, donationNote: e.target.value }))} />
      </div>
      <div style={{ marginBottom: '1.5em' }}>
        <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: 4 }}>Volunteer Page Note</label>
        <textarea style={{ ...s.input, ...s.textarea }} placeholder="e.g. We will contact you within 2–3 days…"
          value={cfg.volunteerNote || ''} onChange={(e) => setCfg((c) => ({ ...c, volunteerNote: e.target.value }))} />
      </div>

      <button style={s.primaryBtn} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : '💾 Save Settings'}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────── Dashboard shell ── */
const TABS = [
  { id: 'Gallery',    label: '🖼 Gallery' },
  { id: 'Contacts',   label: '📬 Contacts' },
  { id: 'Donations',  label: '💰 Donations' },
  { id: 'Volunteers', label: '🤝 Volunteers' },
  { id: 'Settings',   label: '⚙️ Settings' },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Gallery');
  const navigate = useNavigate();

  const handleLogout = async () => { await signOut(auth); navigate('/admin/login'); };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.heading}>Admin Dashboard</h2>
        <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
      </div>

      <div style={s.tabBar}>
        {TABS.map((t) => (
          <button key={t.id}
            style={{ ...s.tabBtn, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.tabContent}>
        {activeTab === 'Gallery'    && <GalleryTab />}
        {activeTab === 'Contacts'   && <ContactsTab />}
        {activeTab === 'Donations'  && <DonationsTab />}
        {activeTab === 'Volunteers' && <VolunteersTab />}
        {activeTab === 'Settings'   && <SettingsTab />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── Styles ── */
const s = {
  page:          { padding: '2em 1.5em', maxWidth: '1040px', margin: '5em auto 2em', color: '#f0f0f0' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em' },
  heading:       { color: '#00c8ff', fontSize: '1.5rem', fontWeight: 700 },
  logoutBtn:     { background: '#dc3545', color: '#fff', border: 'none', padding: '0.5em 1.2em', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  tabBar:        { display: 'flex', gap: '0.4em', borderBottom: '1px solid #2a2a2a', marginBottom: '1.5em', flexWrap: 'wrap' },
  tabBtn:        { background: 'none', border: 'none', color: '#888', padding: '0.6em 1.2em', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '2px solid transparent', transition: 'color .2s, border-color .2s' },
  tabActive:     { color: '#00c8ff', borderBottomColor: '#00c8ff' },
  tabContent:    { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: '1.5em' },
  tabTitle:      { fontSize: '1rem', fontWeight: 600, marginBottom: '1.2em', color: '#e0e0e0', margin: 0 },
  badge:         { background: '#00c8ff22', color: '#00c8ff', borderRadius: 20, padding: '1px 8px', fontSize: '0.78rem', marginLeft: 8 },
  formWrap:      { display: 'flex', flexDirection: 'column', gap: '0.85em', maxWidth: 500 },
  input:         { padding: '0.75em 1em', border: '1px solid #333', borderRadius: 8, background: '#1e1e1e', color: '#fff', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  textarea:      { padding: '0.75em 1em', border: '1px solid #333', borderRadius: 8, background: '#1e1e1e', color: '#fff', fontSize: '0.95rem', resize: 'vertical', minHeight: 80, width: '100%', boxSizing: 'border-box' },
  primaryBtn:    { background: '#00c8ff', color: '#000', border: 'none', padding: '0.8em 1.5em', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' },
  exportBtn:     { background: '#1a2a1a', color: '#4ade80', border: '1px solid #166534', padding: '0.45em 1em', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  muted:         { color: '#888', fontSize: '0.9rem', padding: '1em 0', margin: 0 },
  tableWrap:     { overflowX: 'auto' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' },
  thead:         { borderBottom: '1px solid #2a2a2a' },
  th:            { textAlign: 'left', padding: '0.6em 0.75em', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' },
  tr:            { borderBottom: '1px solid #1a1a1a' },
  td:            { padding: '0.65em 0.75em', color: '#ccc', verticalAlign: 'top', lineHeight: 1.5 },
  link:          { color: '#00c8ff', textDecoration: 'none' },
  tagRead:       { background: '#1a2a1a', color: '#4ade80', padding: '2px 8px', borderRadius: 12, fontSize: '0.78rem' },
  smallBtn:      { background: '#1e2a3a', color: '#60a5fa', border: '1px solid #2a3a5a', padding: '2px 8px', borderRadius: 12, cursor: 'pointer', fontSize: '0.78rem' },
  dangerSmallBtn:{ background: '#2a1a1a', color: '#f87171', border: '1px solid #5a2a2a', padding: '2px 8px', borderRadius: 12, cursor: 'pointer', fontSize: '0.78rem' },
  totalRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d2a1a', border: '1px solid #166534', borderRadius: 8, padding: '0.75em 1em', marginBottom: '1.2em' },
};

export default AdminDashboard;
