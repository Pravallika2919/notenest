import { useEffect, useState } from 'react';
import { api, FILE_URL } from './api';
import './App.css';

const empty = { title: '', content: '', topic: '', subject: '' };
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const TEMPLATE = `DEFINITION:


EXPLANATION (key points):
1.
2.
3.

DIAGRAM / FORMULA:


EXAMPLE:


ADVANTAGES:
-

DISADVANTAGES / LIMITATIONS:
-

APPLICATIONS:
-

EXAM TIP / KEYWORDS TO WRITE:
`;

export default function App({ user, onLogout }) {
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [recent, setRecent] = useState([]);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(''); // subject id, '' = all, 'fav' = favorites
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [newSubject, setNewSubject] = useState('');
  const [newExam, setNewExam] = useState('');
  const [viewNote, setViewNote] = useState(null); // note open in the reader
  const [ready, setReady] = useState(false); // first load finished
  const [editSub, setEditSub] = useState(null); // subject being edited

  const load = async () => {
    const params = { q };
    if (active === 'fav') params.favorite = true;
    else if (active) params.subject = active;
    const [n, r, s] = await Promise.all([
      api.get('/notes', { params }), api.get('/notes/recent'), api.get('/subjects')
    ]);
    setNotes(n.data); setRecent(r.data); setSubjects(s.data); setReady(true);
    setViewNote(v => (v ? n.data.find(x => x._id === v._id) || r.data.find(x => x._id === v._id) || null : null));
  };
  useEffect(() => { load(); }, [q, active]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setViewNote(null); setEditSub(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const save = async e => {
    e.preventDefault();
    const body = { ...form, subject: form.subject || undefined };
    editId ? await api.put(`/notes/${editId}`, body) : await api.post('/notes', body);
    setForm(empty); setEditId(null); load();
  };
  const startEdit = n => {
    setViewNote(null);
    setEditId(n._id);
    setForm({ title: n.title, content: n.content, topic: n.topic, subject: n.subject?._id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggle = async (n, key) => { await api.put(`/notes/${n._id}`, { [key]: !n[key] }); load(); };
  const remove = async id => {
    if (confirm('Delete this note?')) { setViewNote(null); await api.delete(`/notes/${id}`); load(); }
  };
  const upload = async (id, file) => {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { await api.post(`/notes/${id}/files`, fd); load(); }
    catch { alert('Upload failed. Use a PDF or image under 10 MB.'); }
  };
  const addSubject = async () => {
    if (!newSubject.trim()) return;
    await api.post('/subjects', {
      name: newSubject,
      color: COLORS[subjects.length % COLORS.length],
      examDate: newExam || undefined
    });
    setNewSubject(''); setNewExam(''); load();
  };
  const openEditSubject = sub => setEditSub({
    _id: sub._id, name: sub.name, color: sub.color || COLORS[0],
    examDate: sub.examDate ? sub.examDate.slice(0, 10) : ''
  });
  const saveSubject = async e => {
    e.preventDefault();
    await api.put(`/subjects/${editSub._id}`, {
      name: editSub.name, color: editSub.color, examDate: editSub.examDate || null
    });
    setEditSub(null); load();
  };
  const removeSubject = async sub => {
    if (!confirm(`Delete subject "${sub.name}"? Its notes will be kept without a subject.`)) return;
    await api.delete(`/subjects/${sub._id}`);
    if (active === sub._id) setActive(''); else load();
  };
  const loadSample = async () => {
    try { await api.post('/auth/starter'); load(); }
    catch (e) { alert(e.response?.data?.error || 'Could not load sample data'); }
  };
  const daysLeft = d => Math.ceil((new Date(d) - Date.now()) / 864e5);

  const upcoming = subjects
    .filter(s => s.examDate && daysLeft(s.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))[0];

  return (
    <div className="layout">
      <aside>
        <h1>📚 NoteNest</h1>
        <button className={!active ? 'on' : ''} onClick={() => setActive('')}>All notes</button>
        <button className={active === 'fav' ? 'on' : ''} onClick={() => setActive('fav')}>⭐ Favorites</button>
        <h4>Subjects</h4>
        {subjects.map(s => (
          <div key={s._id} className={`subrow ${active === s._id ? 'on' : ''}`}>
            <button className="main" onClick={() => setActive(s._id)}>
              <span className="dot" style={{ background: s.color }} /> {s.name}
              {s.examDate && daysLeft(s.examDate) >= 0 && <small>{daysLeft(s.examDate)}d</small>}
            </button>
            <span className="icons">
              <button title="Edit subject" onClick={() => openEditSubject(s)}>✏️</button>
              <button title="Delete subject" onClick={() => removeSubject(s)}>🗑</button>
            </span>
          </div>
        ))}
        <div className="add">
          <input placeholder="New subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
          <button onClick={addSubject}>+</button>
        </div>
        <input type="date" className="exam" title="Exam date (optional)" value={newExam} onChange={e => setNewExam(e.target.value)} />
        <div className="userbox">
          <span className="who">👤 {user?.name}</span>
          <button onClick={onLogout}>Log out</button>
        </div>
      </aside>

      <main>
        {ready && !subjects.length && !notes.length && !q && (
          <div className="welcome">
            <h3>👋 Welcome, {user?.name}!</h3>
            <p>Your account is empty. Load sample engineering and AI subjects with notes to explore NoteNest, or add your own subject from the sidebar.</p>
            <button className="primary" onClick={loadSample}>Load sample subjects and notes</button>
          </div>
        )}

        <input className="search" placeholder="Search title, topic or keywords…" value={q} onChange={e => setQ(e.target.value)} />

        {upcoming && (
          <div className="banner">
            ⏳ <b>{upcoming.name}</b> exam in <b>{daysLeft(upcoming.examDate)} days</b>
          </div>
        )}

        <section className="recent">
          <h3>Recently updated</h3>
          <div className="row">
            {recent.map(n => (
              <button key={n._id} className="chip" onClick={() => setViewNote(n)}>{n.title}</button>
            ))}
            {!recent.length && <span className="muted">Nothing yet</span>}
          </div>
        </section>

        <form onSubmit={save} className="card form">
          <h3>{editId ? 'Edit note' : 'New note'}</h3>
          <input required placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div className="row">
            <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <input placeholder="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
          <textarea rows="12" placeholder="Write your detailed note…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          <div className="row">
            <button className="primary">{editId ? 'Update' : 'Add note'}</button>
            <button type="button" className="ghost" onClick={() => setForm({ ...form, content: form.content ? form.content + '\n\n' + TEMPLATE : TEMPLATE })}>
              📝 Insert exam answer template
            </button>
            {editId && <button type="button" className="ghost" onClick={() => { setEditId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>

        <div className="grid">
          {notes.map(n => (
            <article key={n._id} className={`card ${n.pinned ? 'pinned' : ''}`}>
              <div className="top">
                <h4 className="title" onClick={() => setViewNote(n)}>{n.pinned && '📌 '}{n.title}</h4>
                <div>
                  <button title="Pin" onClick={() => toggle(n, 'pinned')}>📌</button>
                  <button title="Favorite" onClick={() => toggle(n, 'favorite')}>{n.favorite ? '⭐' : '☆'}</button>
                </div>
              </div>
              {n.subject && <span className="tag" style={{ background: n.subject.color }}>{n.subject.name}</span>}
              {n.topic && <span className="tag alt">{n.topic}</span>}
              <p className="preview">{n.content}</p>
              {n.files.map((f, i) => <a key={i} href={FILE_URL + f.path} target="_blank" rel="noreferrer">📎 {f.name}</a>)}
              <div className="actions">
                <button onClick={() => setViewNote(n)}>Open</button>
                <label className="link">Upload<input hidden type="file" accept="application/pdf,image/*" onChange={e => upload(n._id, e.target.files[0])} /></label>
                <button onClick={() => startEdit(n)}>Edit</button>
                <button onClick={() => remove(n._id)}>Delete</button>
              </div>
            </article>
          ))}
          {!notes.length && <p className="muted">No notes found. Create your first one above.</p>}
        </div>
      </main>

      {editSub && (
        <div className="overlay" onClick={() => setEditSub(null)}>
          <form className="modal small-modal" onClick={e => e.stopPropagation()} onSubmit={saveSubject}>
            <h3>Edit subject</h3>
            <label>Name</label>
            <input required value={editSub.name} onChange={e => setEditSub({ ...editSub, name: e.target.value })} />
            <label>Exam date (optional)</label>
            <input type="date" value={editSub.examDate} onChange={e => setEditSub({ ...editSub, examDate: e.target.value })} />
            <label>Colour</label>
            <div className="colors">
              {COLORS.map(c => (
                <button type="button" key={c} className={editSub.color === c ? 'swatch sel' : 'swatch'}
                  style={{ background: c }} onClick={() => setEditSub({ ...editSub, color: c })} />
              ))}
            </div>
            <div className="modal-actions">
              <button className="primary">Save</button>
              <button type="button" className="ghost" onClick={() => setEditSub({ ...editSub, examDate: '' })}>Clear exam date</button>
              <button type="button" className="ghost" onClick={() => setEditSub(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {viewNote && (
        <div className="overlay" onClick={() => setViewNote(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{viewNote.pinned && '📌 '}{viewNote.title}</h2>
                {viewNote.subject && <span className="tag" style={{ background: viewNote.subject.color }}>{viewNote.subject.name}</span>}
                {viewNote.topic && <span className="tag alt">{viewNote.topic}</span>}
                <span className="muted small"> Updated {new Date(viewNote.updatedAt).toLocaleString()}</span>
              </div>
              <button className="close" onClick={() => setViewNote(null)}>✕</button>
            </div>
            <div className="reader">{viewNote.content || 'This note is empty. Click Edit to add content.'}</div>
            {viewNote.files.length > 0 && (
              <div className="files">
                <h4>Attached files</h4>
                {viewNote.files.map((f, i) => <a key={i} href={FILE_URL + f.path} target="_blank" rel="noreferrer">📎 {f.name}</a>)}
              </div>
            )}
            <div className="modal-actions">
              <button className="primary" onClick={() => startEdit(viewNote)}>Edit</button>
              <button className="ghost" onClick={() => window.print()}>🖨 Print</button>
              <button className="ghost" onClick={() => setViewNote(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
