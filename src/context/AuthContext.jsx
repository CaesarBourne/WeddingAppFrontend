import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { api, tokenStore } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'checking' : 'guest');

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
      .then(({ data }) => {
        if (!alive) return;
        setUser(data);
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

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.accessToken);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const guestLogin = useCallback(async (token) => {
    const { data } = await api.post('/auth/guest', { token });
    tokenStore.set(data.accessToken);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const value = useMemo(
    () => ({ user, status, login, guestLogin, logout, isAdmin }),
    [user, status, login, guestLogin, logout, isAdmin],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
