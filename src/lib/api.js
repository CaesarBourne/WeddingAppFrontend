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

/** Build a URL for a user's avatar (requires auth header on requests). */
export function avatarSrc(userId) {
  return `${API_BASE}/users/${encodeURIComponent(userId)}/avatar`;
}

/** Upload the current user's own avatar. */
export async function uploadMyAvatar(file) {
  const form = new FormData();
  form.append('file', file);
  return api.post('/users/me/avatar', form);
}

/** Admin uploads an avatar for any user. */
export async function uploadUserAvatar(userId, file) {
  const form = new FormData();
  form.append('file', file);
  return api.patch(`/users/${encodeURIComponent(userId)}/avatar`, form);
}

/** Admin fetches guest info from their QR token (does not create a session). */
export async function getGuestInfo(token) {
  const { data } = await api.post('/auth/guest-info', { token });
  return data;
}

/** Admin marks a guest as admitted at the event entrance. */
export async function admitGuest(guestId) {
  const { data } = await api.post(`/users/${encodeURIComponent(guestId)}/admit`);
  return data;
}

/** Admin fetches the current admission status for a single guest. */
export async function getGuestAdmission(guestId) {
  const { data } = await api.get(`/users/${encodeURIComponent(guestId)}`);
  return data;
}
