import axios from 'axios';

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

const TOKEN_KEY = 'wpa_jwt';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Broadcast 401s so the auth layer can drop a stale session.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && tokenStore.get()) {
      window.dispatchEvent(new CustomEvent('wpa:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/**
 * Build a stable, public image URL for an <img>/<video> src.
 * `rawUrl` from the API is a relative path; we prefix the API base and swap
 * the size hint so the grid pulls small files and the lightbox pulls large.
 *   size: 'thumb' | 'display' | 'download' | 'w700' | 'w1600' ...
 */
export function rawSrc(id, size = 'display') {
  return `${API_BASE}/photos/${encodeURIComponent(id)}/raw?size=${encodeURIComponent(size)}`;
}

/** Turn an axios error into a human sentence (NestJS sends string | string[]). */
export function errMessage(error, fallback = 'Something went wrong.') {
  const data = error?.response?.data;
  if (Array.isArray(data?.message)) return data.message.join(', ');
  if (typeof data?.message === 'string') return data.message;
  if (error?.message === 'Network Error')
    return 'Cannot reach the API. Is the backend running, and is VITE_API_BASE_URL correct?';
  return error?.message || fallback;
}

export function isVideo(mimeType) {
  return (mimeType || '').startsWith('video/');
}
