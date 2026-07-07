import axios, { type AxiosResponse } from 'axios';
import type { GuestInfo, UserDto } from '../types.ts';

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

const TOKEN_KEY = 'wpa_jwt';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (t: string): void => { localStorage.setItem(TOKEN_KEY, t); },
  clear: (): void => { localStorage.removeItem(TOKEN_KEY); },
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
  (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401 && tokenStore.get()) {
      window.dispatchEvent(new CustomEvent('wpa:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Build a stable, public image URL for an <img>/<video> src. */
export function rawSrc(id: string, size = 'display'): string {
  return `${API_BASE}/photos/${encodeURIComponent(id)}/raw?size=${encodeURIComponent(size)}`;
}

/** Build a URL to fetch a user's avatar. */
export function avatarSrc(userId: string): string {
  return `${API_BASE}/users/${encodeURIComponent(userId)}/avatar`;
}

/** Turn an axios error into a human sentence. */
export function errMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  if (Array.isArray(data?.message)) return (data.message as string[]).join(', ');
  if (typeof data?.message === 'string') return data.message;
  const msg = (error as { message?: string })?.message;
  if (msg === 'Network Error')
    return 'Cannot reach the API. Is the backend running, and is VITE_API_BASE_URL correct?';
  return msg || fallback;
}

export function isVideo(mimeType: string | null | undefined): boolean {
  return (mimeType || '').startsWith('video/');
}

/** Upload the current user's own avatar. */
export async function uploadMyAvatar(file: File): Promise<AxiosResponse<{ avatarUrl: string }>> {
  const form = new FormData();
  form.append('file', file);
  return api.post('/users/me/avatar', form);
}

/** Admin uploads an avatar for any user. */
export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<AxiosResponse<{ avatarUrl: string }>> {
  const form = new FormData();
  form.append('file', file);
  return api.patch(`/users/${encodeURIComponent(userId)}/avatar`, form);
}

/** Admin fetches guest info from their QR token (does not create a session). */
export async function getGuestInfo(token: string): Promise<GuestInfo> {
  const { data } = await api.post('/auth/guest-info', { token });
  return data as GuestInfo;
}

/** Admin marks a guest as admitted at the event entrance. */
export async function admitGuest(guestId: string): Promise<{
  id: string;
  admissionStatus: string;
  admittedAt: string | null;
}> {
  const { data } = await api.post(`/users/${encodeURIComponent(guestId)}/admit`);
  return data;
}

/** Admin fetches the current admission status for a single guest. */
export async function getGuestAdmission(guestId: string): Promise<UserDto> {
  const { data } = await api.get(`/users/${encodeURIComponent(guestId)}`);
  return data as UserDto;
}
