import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:5000/api' });
export const FILE_URL = 'http://localhost:5000/';

export const getToken = () => {
  try { return localStorage.getItem('notenest_token'); } catch { return null; }
};
export const saveSession = (token, user) => {
  localStorage.setItem('notenest_token', token);
  localStorage.setItem('notenest_user', JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem('notenest_token');
  localStorage.removeItem('notenest_user');
};
export const getSavedUser = () => {
  try { return JSON.parse(localStorage.getItem('notenest_user')); } catch { return null; }
};

// send the token with every request
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token is invalid or expired, log out
api.interceptors.response.use(
  r => r,
  err => {
    const isAuthCall = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthCall) {
      clearSession();
      window.location.reload();
    }
    return Promise.reject(err);
  }
);
