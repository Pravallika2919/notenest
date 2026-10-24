import { useState } from 'react';
import { api } from './api';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode}`, form);
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot reach the server. Is the backend running on port 5000?');
    } finally {
      setBusy(false);
    }
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>📚 NoteNest</h1>
        <p className="muted">Your study notes, organised and ready for exams.</p>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>

        {mode === 'register' && (
          <input required placeholder="Full name" value={form.name} onChange={set('name')} />
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={set('email')} />
        <input required type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={set('password')} />

        {error && <div className="auth-error">{error}</div>}

        <button className="primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="switch">
          {mode === 'login' ? "New here? " : 'Already have an account? '}
          <a href="#" onClick={e => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </a>
        </p>
        {mode === 'login' && <p className="muted small">Demo: demo@notenest.com / demo123 (after running the seed)</p>}
      </form>
    </div>
  );
}
