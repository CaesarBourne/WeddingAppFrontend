import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, tokenStore } from '../lib/api.ts';
import type { AuthUser, AuthContextValue } from '../types.ts';

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'checking' | 'authed' | 'guest'>(
    tokenStore.get() ? 'checking' : 'guest',
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  useEffect(() => {
    let alive = true;
    if (!tokenStore.get()) return;
    api
      .get('/auth/me')
      .then(({ data }: { data: AuthUser & { sub: string } }) => {
        if (!alive) return;
        setUser({ ...data, id: data.sub });
        setStatus('authed');
      })
      .catch(() => alive && logout());
    return () => { alive = false; };
  }, [logout]);

  useEffect(() => {
    const handler = () => logout();
    globalThis.addEventListener('wpa:unauthorized', handler);
    return () => globalThis.removeEventListener('wpa:unauthorized', handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
      '/auth/login',
      { email, password },
    );
    tokenStore.set(data.accessToken);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const guestLogin = useCallback(async (token: string): Promise<AuthUser> => {
    const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
      '/auth/guest',
      { token },
    );
    tokenStore.set(data.accessToken);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, guestLogin, logout, isAdmin, isSuperAdmin }),
    [user, status, login, guestLogin, logout, isAdmin, isSuperAdmin],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
