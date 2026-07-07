import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { API_BASE, admitGuest, getGuestAdmission, errMessage } from '../lib/api.ts';
import { useToast } from '../hooks/useToast.tsx';
import { timeAgo } from '../lib/timeAgo.ts';
import type { GuestInfo } from '../types.ts';

type RingState = 'loading' | 'pending' | 'just_admitted' | 'already_admitted';

interface AvatarRingProps {
  avatarUrl: string | null;
  name: string;
  ringState: RingState;
}

function AvatarRing({ avatarUrl, name, ringState }: AvatarRingProps) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const src = avatarUrl ? `${API_BASE}${avatarUrl}` : null;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`qrv-ring qrv-ring--${ringState}`}>
      <div className="qrv-avatar">
        {src && !imgFailed ? (
          <img
            src={src}
            alt={name}
            className="qrv-avatar-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="qrv-avatar-initials">{initials}</span>
        )}

        <AnimatePresence>
          {ringState === 'just_admitted' && (
            <motion.div
              className="qrv-overlay qrv-overlay--green"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <CheckCircle2 style={{ width: 64, height: 64 }} />
            </motion.div>
          )}
          {ringState === 'already_admitted' && (
            <motion.div
              className="qrv-overlay qrv-overlay--red"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <XCircle style={{ width: 64, height: 64 }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function QRValidate() {
  const { guestId } = useParams<{ guestId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const locationState = location.state as { guestInfo?: GuestInfo } | null;
  const stateInfo = locationState?.guestInfo ?? null;

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(stateInfo);
  const [ringState, setRingState] = useState<RingState>('loading');
  const [admitting, setAdmitting] = useState(false);

  useEffect(() => {
    if (!guestId) return;
    getGuestAdmission(guestId)
      .then((data) => {
        setGuestInfo({ ...data, avatarUrl: data.avatarUrl ?? null });
        setRingState(data.admissionStatus === 'admitted' ? 'already_admitted' : 'pending');
      })
      .catch(() => {
        if (stateInfo) {
          setGuestInfo(stateInfo);
          setRingState(stateInfo.admissionStatus === 'admitted' ? 'already_admitted' : 'pending');
        } else {
          setRingState('pending');
        }
      });
  }, [guestId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdmit() {
    if (admitting || !guestId) return;
    setAdmitting(true);
    try {
      const result = await admitGuest(guestId);
      setGuestInfo((prev) => prev ? { ...prev, ...result, avatarUrl: prev.avatarUrl } : null);
      setRingState('just_admitted');
    } catch (err) {
      toast.err(errMessage(err, 'Could not admit guest.'));
    } finally {
      setAdmitting(false);
    }
  }

  const name = guestInfo?.name ?? 'Guest';
  const admittedAt = guestInfo?.admittedAt ?? null;
  const avatarUrl = guestInfo?.avatarUrl ?? null;

  return (
    <div className="qrv-shell">
      <motion.header
        className="qrv-header"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="btn btn-ghost" onClick={() => navigate('/admin')}>
          <ArrowLeft className="ico" /> Guest list
        </button>
        <div className="qrv-header-title">Entrance Scan</div>
      </motion.header>

      <main className="qrv-main">
        <motion.div
          className="qrv-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          {ringState === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
              <span className="spinner" />
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Checking status…</p>
            </div>
          ) : (
            <>
              <AvatarRing avatarUrl={avatarUrl} name={name} ringState={ringState} />

              <motion.h2
                className="qrv-name"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {name}
              </motion.h2>

              <span className="user-badge guest" style={{ alignSelf: 'center' }}>Wedding Guest</span>

              <AnimatePresence mode="wait">
                {ringState === 'pending' && (
                  <motion.div
                    key="pending"
                    className="qrv-status qrv-status--pending"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Clock className="qrv-status-icon" />
                    <div className="qrv-status-body">
                      <strong>Valid guest — not yet admitted</strong>
                      <span>Scan confirmed. Tap below to admit to the event.</span>
                    </div>
                  </motion.div>
                )}

                {ringState === 'just_admitted' && (
                  <motion.div
                    key="admitted"
                    className="qrv-status qrv-status--admitted"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ShieldCheck className="qrv-status-icon" />
                    <div className="qrv-status-body">
                      <strong>Welcome to the wedding!</strong>
                      <span>{name} has been admitted.</span>
                    </div>
                  </motion.div>
                )}

                {ringState === 'already_admitted' && (
                  <motion.div
                    key="denied"
                    className="qrv-status qrv-status--denied"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <XCircle className="qrv-status-icon" />
                    <div className="qrv-status-body">
                      <strong>Already admitted</strong>
                      <span>
                        {admittedAt
                          ? `Entered ${timeAgo(admittedAt)} — QR re-use detected.`
                          : 'This guest has already been admitted to the event.'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {ringState === 'pending' && (
                <motion.button
                  className="btn btn-admit"
                  onClick={handleAdmit}
                  disabled={admitting}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ShieldCheck className="ico" />
                  {admitting ? 'Admitting…' : 'Admit to Event'}
                </motion.button>
              )}

              {(ringState === 'just_admitted' || ringState === 'already_admitted') && (
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => navigate('/admin')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ringState === 'just_admitted' ? 0.6 : 0.3 }}
                >
                  <ArrowLeft className="ico" /> Back to guest list
                </motion.button>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
