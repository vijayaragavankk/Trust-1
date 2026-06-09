// src/admin/AdminDashboard.jsx
// 🖼 Gallery tab now uses Cloudinary (unsigned upload preset) + Firestore for metadata
// ✅ Drag-drop upload, replace image, categories, reorder, delete
// ✅ All other tabs unchanged

import { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection, addDoc, serverTimestamp,
  onSnapshot, orderBy, query,
  doc, updateDoc, deleteDoc, getDoc, setDoc, writeBatch,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

/* ─── helpers ───────────────────────────────────────────── */
const fmt = (ts) => ts?.toDate?.()?.toLocaleDateString('en-IN') ?? '—';

function downloadCSV(rows, headers, filename) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

// Cloudinary unsigned upload
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzcyrzsdq';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'trust_gallery';

async function uploadToCloudinary(file, folder = 'trust/gallery') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', folder);
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Cloudinary error ${res.status}`);
  return res.json(); // { secure_url, public_id, width, height, ... }
}

async function deleteFromCloudinary(publicId) {
  // Note: client-side delete requires a signed request or backend proxy.
  // For unsigned preset, deletion must be done via Cloudinary dashboard or a backend endpoint.
  // This is a no-op on the client — we just remove from Firestore.
  console.warn('Cloudinary delete must be done from dashboard or backend. public_id:', publicId);
}

const GALLERY_CATEGORIES = ['All', 'Food Distribution', 'Health Camp', 'Education', 'Orphanage', 'Events', 'Community', 'Other'];

/* ─── Gallery Tab ───────────────────────────────────────── */
function GalleryTab() {
  const [items,       setItems]       = useState([]);
  const [uploading,   setUploading]   = useState(false);
  const [msg,         setMsg]         = useState({ text: '', ok: true });
  const [filterCat,   setFilterCat]   = useState('All');
  const [dragOver,    setDragOver]    = useState(false);
  const [replaceId,   setReplaceId]   = useState(null); // id of item being replaced
  const fileInputRef                  = useRef();

  // Form state
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('Other');
  const [files,       setFiles]       = useState([]); // multi-file

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 3500);
  };

  // Handle file drop or pick
  const handleFiles = (incoming) => {
    setFiles(Array.from(incoming));
    if (incoming.length === 1) setTitle(incoming[0].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // Upload one or multiple new images
  const handleUpload = async () => {
    if (!files.length)        { showMsg('⚠️ Please select at least one image.', false); return; }
    if (!title.trim() && files.length === 1) { showMsg('⚠️ Title is required.', false); return; }
    setUploading(true);
    try {
      const maxOrder = items.length ? Math.max(...items.map((i) => i.order ?? 0)) + 1 : 0;
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i]);
        await addDoc(collection(db, 'gallery'), {
          title:       files.length > 1 ? files[i].name.replace(/\.[^.]+$/, '') : title.trim(),
          description: description.trim(),
          category,
          imageUrl:    result.secure_url,
          publicId:    result.public_id,
          width:       result.width,
          height:      result.height,
          order:       maxOrder + i,
          createdAt:   serverTimestamp(),
        });
      }
      showMsg(`✅ ${files.length} image${files.length > 1 ? 's' : ''} uploaded!`);
      setFiles([]); setTitle(''); setDescription(''); setCategory('Other');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      showMsg('❌ Upload failed: ' + e.message, false);
    } finally {
      setUploading(false);
    }
  };

  // Replace an existing image (keep metadata, swap URL)
  const handleReplace = async (item, newFile) => {
    if (!newFile) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(newFile);
      await updateDoc(doc(db, 'gallery', item.id), {
        imageUrl:  result.secure_url,
        publicId:  result.public_id,
        width:     result.width,
        height:    result.height,
        updatedAt: serverTimestamp(),
      });
      await deleteFromCloudinary(item.publicId);
      showMsg(`✅ "${item.title}" replaced!`);
    } catch (e) {
      showMsg('❌ Replace failed: ' + e.message, false);
    } finally {
      setUploading(false);
      setReplaceId(null);
    }
  };

  // Inline edit title / description / category
  const handleEdit = (id, field, value) =>
    updateDoc(doc(db, 'gallery', id), { [field]: value });

  // Delete
  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, 'gallery', item.id));
    await deleteFromCloudinary(item.publicId);
    showMsg(`🗑 "${item.title}" removed.`);
  };

  // Move up / down (swap order values)
  const move = async (index, dir) => {
    const visible = filtered;
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= visible.length) return;
    const a = visible[index];
    const b = visible[swapIdx];
    const batch = writeBatch(db);
    batch.update(doc(db, 'gallery', a.id), { order: b.order ?? swapIdx });
    batch.update(doc(db, 'gallery', b.id), { order: a.order ?? index });
    await batch.commit();
  };

  const filtered = filterCat === 'All'
    ? items
    : items.filter((i) => i.category === filterCat);

  // Cloudinary optimised URL helper (auto format + quality)
  const thumb = (url, w = 280) => url
    ? url.replace('/upload/', `/upload/w_${w},h_180,c_fill,f_auto,q_auto/`)
    : '';

  return (
    <div>
      <h3 style={{ ...s.tabTitle, marginBottom: '1.2em' }}>🖼 Gallery — Cloudinary</h3>

      {/* Cloudinary setup tip */}
      <div style={s.infoBox}>
        <strong style={{ color: '#facc15' }}>⚙️ One-time setup:</strong>
        <span style={{ color: '#ccc', marginLeft: 8 }}>
          In Cloudinary Dashboard → Settings → Upload → Add Upload Preset named{' '}
          <code style={{ color: '#00c8ff' }}>trust_gallery</code> (mode: Unsigned).
          Then add <code style={{ color: '#00c8ff' }}>VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
          <code style={{ color: '#00c8ff' }}>VITE_CLOUDINARY_UPLOAD_PRESET</code> to Vercel env vars.
        </span>
      </div>

      {msg.text && (
        <div style={{ ...s.toast, ...(msg.ok ? s.toastOk : s.toastErr) }}>{msg.text}</div>
      )}

      {/* ── Upload area ── */}
      <div style={s.uploadSection}>
        <h4 style={{ color: '#ccc', marginBottom: '0.75em' }}>Upload New Images</h4>

        {/* Drop zone */}
        <div
          style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span style={{ fontSize: '2rem' }}>📁</span>
          <p style={{ color: '#aaa', margin: '0.4em 0 0' }}>
            {files.length
              ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
              : 'Drag & drop images here, or click to browse'}
          </p>
          <p style={{ color: '#555', fontSize: '0.78rem', margin: '0.2em 0 0' }}>
            Supports JPG, PNG, WebP, AVIF — multiple files allowed
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Meta fields (only shown when files selected) */}
        {files.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75em', marginTop: '0.85em' }}>
            <div>
              <label style={s.fieldLabel}>
                {files.length === 1 ? 'Image Title *' : 'Category (applies to all)'}
              </label>
              {files.length === 1
                ? <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Food Camp 2025" />
                : null}
            </div>
            <div>
              <label style={s.fieldLabel}>Category</label>
              <select style={{ ...s.input, cursor: 'pointer' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                {GALLERY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {files.length === 1 && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.fieldLabel}>Description (optional)</label>
                <textarea style={{ ...s.input, resize: 'vertical', minHeight: 60 }}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short caption shown in the gallery…" />
              </div>
            )}
          </div>
        )}

        <button style={{ ...s.primaryBtn, marginTop: '0.85em', opacity: uploading ? 0.6 : 1 }}
          onClick={handleUpload} disabled={uploading}>
          {uploading ? '⬆ Uploading…' : `⬆ Upload${files.length > 1 ? ` ${files.length} Images` : ' Image'}`}
        </button>
      </div>

      {/* ── Filter bar ── */}
      {items.length > 0 && (
        <div style={s.filterBar}>
          <span style={{ color: '#888', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {filtered.length} image{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
            {GALLERY_CATEGORIES.map((c) => (
              <button key={c}
                style={{ ...s.filterBtn, ...(filterCat === c ? s.filterBtnActive : {}) }}
                onClick={() => setFilterCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Image grid ── */}
      {filtered.length === 0 && items.length > 0 && (
        <p style={s.muted}>No images in this category.</p>
      )}
      {items.length === 0 && (
        <p style={s.muted}>No images uploaded yet. Upload your first image above.</p>
      )}

      <div style={s.imgGrid}>
        {filtered.map((item, idx) => (
          <div key={item.id} style={s.imgCard}>
            {/* Thumbnail */}
            <div style={{ position: 'relative' }}>
              <img
                src={thumb(item.imageUrl)}
                alt={item.title}
                style={s.imgThumb}
                loading="lazy"
              />
              {/* Replace button overlay */}
              <label style={s.replaceOverlay} title="Replace this image">
                🔄
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => handleReplace(item, e.target.files[0])} />
              </label>
              {/* Category badge */}
              <span style={s.catBadge}>{item.category || 'Other'}</span>
            </div>

            {/* Editable fields */}
            <div style={{ padding: '0.6em 0.7em' }}>
              <input
                style={{ ...s.inlineEdit, fontWeight: 600 }}
                defaultValue={item.title}
                onBlur={(e) => handleEdit(item.id, 'title', e.target.value)}
                placeholder="Title"
              />
              <input
                style={{ ...s.inlineEdit, color: '#888', fontSize: '0.78rem' }}
                defaultValue={item.description}
                onBlur={(e) => handleEdit(item.id, 'description', e.target.value)}
                placeholder="Description (click to edit)"
              />
              <select
                defaultValue={item.category || 'Other'}
                onChange={(e) => handleEdit(item.id, 'category', e.target.value)}
                style={s.inlineSelect}>
                {GALLERY_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div style={s.imgActions}>
              <button style={s.moveBtn} onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
              <button style={s.moveBtn} onClick={() => move(idx, 1)} disabled={idx === filtered.length - 1} title="Move down">↓</button>
              <button style={s.dangerSmallBtn} onClick={() => handleDelete(item)}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Contacts Tab ───────────────────────────────────────── */
function ContactsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'contacts'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); });
  }, []);

  const markRead  = (id) => updateDoc(doc(db, 'contacts', id), { status: 'read' });
  const handleDel = async (id) => { if (confirm('Delete this contact?')) await deleteDoc(doc(db, 'contacts', id)); };
  const exportCSV = () => downloadCSV(
    rows.map((r) => ({ Name: r.name, Email: r.email, Subject: r.subject, Message: r.message, Date: fmt(r.submittedAt), Status: r.status })),
    ['Name', 'Email', 'Subject', 'Message', 'Date', 'Status'], 'contacts.csv'
  );

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={s.tabHeader}>
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
                  <td style={s.td}><button style={s.dangerSmallBtn} onClick={() => handleDel(c.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Donations Tab ──────────────────────────────────────── */
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
    ['Name', 'Phone', 'Email', 'Amount', 'Method', 'PaymentID', 'Date'], 'donations.csv'
  );

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={s.tabHeader}>
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

/* ─── Volunteers Tab ─────────────────────────────────────── */
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
    rows.map((v) => ({ Name: v.name, Email: v.email, Phone: v.phone, City: v.city, Availability: v.availability, Skills: (v.skills||[]).join(' | '), Status: v.status, Date: fmt(v.registeredAt) })),
    ['Name','Email','Phone','City','Availability','Skills','Status','Date'], 'volunteers.csv'
  );
  const statusColors = { new: '#60a5fa', contacted: '#facc15', active: '#4ade80', inactive: '#888' };

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div>
      <div style={{ ...s.tabHeader, flexWrap: 'wrap', gap: '0.5em' }}>
        <h3 style={s.tabTitle}>Volunteers <span style={s.badge}>{rows.length}</span></h3>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <input style={{ ...s.input, width: 200 }} placeholder="Search name / email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {rows.length > 0 && <button style={s.exportBtn} onClick={exportCSV}>⬇ Export CSV</button>}
        </div>
      </div>
      {!filtered.length ? <p style={s.muted}>{rows.length ? 'No results.' : 'No volunteer registrations yet.'}</p> : (
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
                  <td style={s.td}><a href={`tel:${v.phone}`} style={s.link}>{v.phone||'—'}</a></td>
                  <td style={s.td}>{v.city||'—'}</td>
                  <td style={s.td}>{v.availability||'—'}</td>
                  <td style={{ ...s.td, maxWidth:200, fontSize:'0.78rem' }}>{(v.skills||[]).join(', ')||'—'}</td>
                  <td style={s.td}>{fmt(v.registeredAt)}</td>
                  <td style={s.td}>
                    <select value={v.status||'new'} onChange={(e) => setStatus(v.id, e.target.value)}
                      style={{ background:'#1e1e1e', color:statusColors[v.status]||'#ccc', border:'1px solid #333', borderRadius:6, padding:'3px 6px', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}>
                      <option value="new">🔵 New</option>
                      <option value="contacted">🟡 Contacted</option>
                      <option value="active">🟢 Active</option>
                      <option value="inactive">⚫ Inactive</option>
                    </select>
                  </td>
                  <td style={s.td}><button style={s.dangerSmallBtn} onClick={() => handleDel(v.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ───────────────────────────────────────── */
function SettingsTab() {
  const docRef = doc(db, 'settings', 'site');
  const [cfg, setCfg] = useState({ trustName:'', tagline:'', upiId:'', contactEmail:'', contactPhone:'', address:'', donationNote:'', volunteerNote:'' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    getDoc(docRef).then((snap) => { if (snap.exists()) setCfg((c) => ({ ...c, ...snap.data() })); setLoading(false); });
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try { await setDoc(docRef, cfg, { merge: true }); setMsg('✅ Settings saved!'); }
    catch (e) { setMsg('❌ ' + e.message); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  };

  const Field = ({ label, field, type='text', placeholder='' }) => (
    <div style={{ marginBottom:'1em' }}>
      <label style={{ display:'block', color:'#888', fontSize:'0.8rem', marginBottom:4 }}>{label}</label>
      <input style={s.input} type={type} placeholder={placeholder} value={cfg[field]||''} onChange={(e) => setCfg((c) => ({ ...c, [field]:e.target.value }))} />
    </div>
  );

  if (loading) return <p style={s.muted}>Loading…</p>;

  return (
    <div style={{ maxWidth:560 }}>
      <h3 style={s.tabTitle}>Site Settings</h3>
      <p style={{ ...s.muted, marginBottom:'1.5em' }}>Edit these values — no code changes needed.</p>
      {msg && <p style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom:'1em' }}>{msg}</p>}
      <Field label="Trust Name"       field="trustName"      placeholder="Ini Yoruvithiseivom Trust" />
      <Field label="Tagline"          field="tagline"        placeholder="Serving humanity with compassion" />
      <Field label="UPI ID"           field="upiId"          placeholder="yourupiid@upi" />
      <Field label="Contact Email"    field="contactEmail"   placeholder="info@yourtrust.org" type="email" />
      <Field label="Contact Phone"    field="contactPhone"   placeholder="+91 98765 43210" type="tel" />
      <Field label="Address"          field="address"        placeholder="123 Street, City, State" />
      <div style={{ marginBottom:'1em' }}>
        <label style={{ display:'block', color:'#888', fontSize:'0.8rem', marginBottom:4 }}>Donation Page Note</label>
        <textarea style={{ ...s.input, resize:'vertical', minHeight:70 }} value={cfg.donationNote||''} onChange={(e) => setCfg((c) => ({ ...c, donationNote:e.target.value }))} placeholder="e.g. All donations are 80G eligible…" />
      </div>
      <div style={{ marginBottom:'1.5em' }}>
        <label style={{ display:'block', color:'#888', fontSize:'0.8rem', marginBottom:4 }}>Volunteer Page Note</label>
        <textarea style={{ ...s.input, resize:'vertical', minHeight:70 }} value={cfg.volunteerNote||''} onChange={(e) => setCfg((c) => ({ ...c, volunteerNote:e.target.value }))} placeholder="e.g. We will contact you within 2–3 days…" />
      </div>
      <button style={s.primaryBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Settings'}</button>
    </div>
  );
}

/* ─── Dashboard Shell ────────────────────────────────────── */
const TABS = [
  { id:'Gallery',    label:'🖼 Gallery' },
  { id:'Contacts',   label:'📬 Contacts' },
  { id:'Donations',  label:'💰 Donations' },
  { id:'Volunteers', label:'🤝 Volunteers' },
  { id:'Settings',   label:'⚙️ Settings' },
];

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Gallery');
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(auth); navigate('/admin/login'); };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.heading}>Admin Dashboard</h2>
          <p style={{ color:'#555', fontSize:'0.78rem', margin:'2px 0 0' }}>Ini Yoruvithiseivom Trust</p>
        </div>
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

/* ─── Styles ─────────────────────────────────────────────── */
const s = {
  page:           { padding:'2em 1.5em', maxWidth:'1100px', margin:'5em auto 2em', color:'#f0f0f0' },
  header:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5em' },
  heading:        { color:'#00c8ff', fontSize:'1.5rem', fontWeight:700, margin:0 },
  logoutBtn:      { background:'#dc3545', color:'#fff', border:'none', padding:'0.5em 1.2em', borderRadius:6, cursor:'pointer', fontWeight:600 },
  tabBar:         { display:'flex', gap:'0.4em', borderBottom:'1px solid #2a2a2a', marginBottom:'1.5em', flexWrap:'wrap' },
  tabBtn:         { background:'none', border:'none', color:'#888', padding:'0.6em 1.2em', cursor:'pointer', fontSize:'0.9rem', borderBottom:'2px solid transparent', transition:'all .2s' },
  tabActive:      { color:'#00c8ff', borderBottomColor:'#00c8ff' },
  tabContent:     { background:'#161616', border:'1px solid #2a2a2a', borderRadius:12, padding:'1.5em' },
  tabTitle:       { fontSize:'1rem', fontWeight:600, color:'#e0e0e0', margin:0 },
  tabHeader:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1em' },
  badge:          { background:'#00c8ff22', color:'#00c8ff', borderRadius:20, padding:'1px 8px', fontSize:'0.78rem', marginLeft:8 },
  infoBox:        { background:'#1a1800', border:'1px solid #4a3800', borderRadius:8, padding:'0.75em 1em', marginBottom:'1.2em', fontSize:'0.83rem', lineHeight:1.6 },
  toast:          { borderRadius:8, padding:'0.75em 1em', marginBottom:'1em', fontSize:'0.88rem', fontWeight:500 },
  toastOk:        { background:'#0d3321', color:'#4ade80', border:'1px solid #166534' },
  toastErr:       { background:'#2d1212', color:'#f87171', border:'1px solid #7f1d1d' },
  uploadSection:  { background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:10, padding:'1.2em', marginBottom:'1.5em' },
  dropZone:       { border:'2px dashed #333', borderRadius:10, padding:'2em 1em', textAlign:'center', cursor:'pointer', transition:'all .2s', background:'#111' },
  dropZoneActive: { borderColor:'#00c8ff', background:'#001a22' },
  fieldLabel:     { display:'block', color:'#888', fontSize:'0.8rem', marginBottom:4 },
  input:          { padding:'0.7em 0.9em', border:'1px solid #333', borderRadius:8, background:'#1e1e1e', color:'#fff', fontSize:'0.9rem', width:'100%', boxSizing:'border-box' },
  primaryBtn:     { background:'#00c8ff', color:'#000', border:'none', padding:'0.75em 1.5em', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:'0.9rem' },
  exportBtn:      { background:'#1a2a1a', color:'#4ade80', border:'1px solid #166534', padding:'0.45em 1em', borderRadius:6, cursor:'pointer', fontSize:'0.82rem', fontWeight:600 },
  filterBar:      { display:'flex', alignItems:'center', gap:'1em', marginBottom:'1em', flexWrap:'wrap' },
  filterBtn:      { background:'#1e1e1e', border:'1px solid #2a2a2a', color:'#888', padding:'0.3em 0.8em', borderRadius:20, cursor:'pointer', fontSize:'0.78rem', transition:'all .15s' },
  filterBtnActive:{ background:'#001a22', borderColor:'#00c8ff', color:'#00c8ff' },
  imgGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1em' },
  imgCard:        { background:'#1e1e1e', borderRadius:10, overflow:'hidden', border:'1px solid #2a2a2a', display:'flex', flexDirection:'column' },
  imgThumb:       { width:'100%', height:150, objectFit:'cover', display:'block' },
  replaceOverlay: { position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.7)', color:'#fff', borderRadius:6, padding:'4px 7px', cursor:'pointer', fontSize:'0.85rem', backdropFilter:'blur(4px)' },
  catBadge:       { position:'absolute', bottom:6, left:6, background:'rgba(0,200,255,0.18)', color:'#00c8ff', fontSize:'0.7rem', padding:'2px 7px', borderRadius:10, border:'1px solid #00c8ff44' },
  inlineEdit:     { background:'transparent', border:'none', borderBottom:'1px solid transparent', color:'#e0e0e0', fontSize:'0.85rem', width:'100%', padding:'2px 0', outline:'none', transition:'border-color .15s', cursor:'text' },
  inlineSelect:   { background:'#161616', border:'1px solid #2a2a2a', color:'#888', borderRadius:6, fontSize:'0.76rem', padding:'2px 6px', cursor:'pointer', marginTop:4, width:'100%' },
  imgActions:     { display:'flex', gap:'0.4em', padding:'0.5em 0.7em', borderTop:'1px solid #2a2a2a', marginTop:'auto' },
  moveBtn:        { background:'#2a2a2a', color:'#ccc', border:'none', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontSize:'0.8rem' },
  muted:          { color:'#888', fontSize:'0.9rem', padding:'1em 0', margin:0 },
  tableWrap:      { overflowX:'auto' },
  table:          { width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' },
  thead:          { borderBottom:'1px solid #2a2a2a' },
  th:             { textAlign:'left', padding:'0.6em 0.75em', color:'#888', fontWeight:500, whiteSpace:'nowrap' },
  tr:             { borderBottom:'1px solid #1a1a1a' },
  td:             { padding:'0.65em 0.75em', color:'#ccc', verticalAlign:'top', lineHeight:1.5 },
  link:           { color:'#00c8ff', textDecoration:'none' },
  tagRead:        { background:'#1a2a1a', color:'#4ade80', padding:'2px 8px', borderRadius:12, fontSize:'0.78rem' },
  smallBtn:       { background:'#1e2a3a', color:'#60a5fa', border:'1px solid #2a3a5a', padding:'2px 8px', borderRadius:12, cursor:'pointer', fontSize:'0.78rem' },
  dangerSmallBtn: { background:'#2a1a1a', color:'#f87171', border:'1px solid #5a2a2a', padding:'2px 8px', borderRadius:12, cursor:'pointer', fontSize:'0.78rem' },
  totalRow:       { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0d2a1a', border:'1px solid #166534', borderRadius:8, padding:'0.75em 1em', marginBottom:'1.2em' },
};

export default AdminDashboard;
