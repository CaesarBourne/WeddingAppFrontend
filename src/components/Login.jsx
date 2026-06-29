import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../lib/brand.js';
import { errMessage } from '../lib/api.js';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errMessage(err, 'Could not sign in.'));
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="eyebrow">The Wedding Album</div>
        <h1>
          {brand.first} <span className="amp">&amp;</span> {brand.second}
        </h1>
        <p className="lead">Sign in to browse the gallery and add your photographs.</p>

        {error && (
          <div className="form-error" role="alert">
            <AlertCircle className="ico" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className={`input ${error ? 'invalid' : ''}`}
              type="email"
              autoComplete="username"
              placeholder="you@wedding.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className={`input ${error ? 'invalid' : ''}`}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={busy}>
            {busy ? <Loader2 className="ico spin-ico" /> : <LogIn className="ico" />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">
          Use the admin seeded in the backend&rsquo;s <code>.env</code>
          {' '}(<code>SUPER_ADMIN_EMAIL</code> / <code>SUPER_ADMIN_PASSWORD</code>).
        </p>
      </motion.div>
    </div>
  );
}
