import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { brand } from '../lib/brand.ts';
import { errMessage, getGuestInfo } from '../lib/api.ts';

export default function GuestLanding() {
  const [params] = useSearchParams();
  const { guestLogin, status, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const tried = useRef(false);

  useEffect(() => {
    if (status === 'authed') {
      const token = params.get('t');
      if (isAdmin && token) {
        getGuestInfo(token)
          .then((data) =>
            navigate(`/qr/validate/${data.id}`, {
              state: { guestInfo: data },
              replace: true,
            }),
          )
          .catch(() => navigate('/', { replace: true }));
      } else {
        navigate('/welcome', { replace: true });
      }
      return;
    }

    const token = params.get('t');
    if (!token) {
      setError('This link is invalid — no guest token found. Please scan your QR code again.');
      return;
    }

    if (tried.current) return;
    tried.current = true;

    guestLogin(token)
      .then(() => navigate('/welcome', { replace: true }))
      .catch((err: unknown) =>
        setError(errMessage(err, 'Could not sign in. Try scanning your QR code again.')),
      );
  }, [status, params, guestLogin, navigate, isAdmin]);

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
