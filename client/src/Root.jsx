import { useState } from 'react';
import App from './App.jsx';
import Auth from './Auth.jsx';
import { getToken, getSavedUser, saveSession, clearSession } from './api';

export default function Root() {
  const [user, setUser] = useState(() => (getToken() ? getSavedUser() : null));

  const onAuth = (token, u) => { saveSession(token, u); setUser(u); };
  const onLogout = () => { clearSession(); setUser(null); };

  return user ? <App user={user} onLogout={onLogout} /> : <Auth onAuth={onAuth} />;
}
