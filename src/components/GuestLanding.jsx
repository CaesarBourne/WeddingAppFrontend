import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { brand } from '../lib/brand.js';
import { errMessage } from '../lib/api.js';

export default function GuestLanding() {
  const [params] = useSearchParams();
  const { guestLogin, status } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const tried = useRef(false);

  useEffect(() => {
    // If already authenticated, skip straight to gallery.
    if (status === 'authed') {
      navigate('/', { replace: true });
      return;
    }

    const token = params.get('t');
    if (!token) {
      setError('This link is invalid — no guest token found. Please scan your QR code again.');
      return;
    }

    // Only attempt once per mount; React StrictMode double-fires effects.
    if (tried.current) return;
    tried.current = true;

    guestLogin(token)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => setError(errMessage(err, 'Could not sign in. Try scanning your QR code again.')));
  }, [status, params, guestLogin, navigate]);

  if (error) {
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
          <div className="form-error" role="alert" style={{ marginTop: 20 }}>
            <AlertCircle className="ico" />
            <span>{error}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center' }}>
        <span className="spinner" />
        <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: '0.9rem' }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
}
