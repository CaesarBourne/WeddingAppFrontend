import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { API_BASE, admitGuest, getGuestAdmission, avatarSrc, errMessage } from '../lib/api.js';
import { useToast } from '../hooks/useToast.jsx';
import { timeAgo } from '../lib/timeAgo.js';

// Visual states
const PENDING = 'pending';
const JUST_ADMITTED = 'just_admitted';
const ALREADY_ADMITTED = 'already_admitted';
const LOADING = 'loading';

function AvatarRing({ userId, avatarUrl, name, ringState }) {
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
          {ringState === JUST_ADMITTED && (
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
          {ringState === ALREADY_ADMITTED && (
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
  const { guestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const stateInfo = location.state?.guestInfo ?? null;

  const [guestInfo, setGuestInfo] = useState(stateInfo);
  const [ringState, setRingState] = useState(LOADING);
  const [admitting, setAdmitting] = useState(false);

  // Fetch fresh status on mount (navigation state may be stale on re-scan).
  useEffect(() => {
    getGuestAdmission(guestId)
      .then((data) => {
        setGuestInfo(data);
        setRingState(data.admissionStatus === 'admitted' ? ALREADY_ADMITTED : PENDING);
      })
      .catch(() => {
        if (stateInfo) {
          setGuestInfo(stateInfo);
          setRingState(stateInfo.admissionStatus === 'admitted' ? ALREADY_ADMITTED : PENDING);
        } else {
          setRingState(PENDING);
        }
      });
  }, [guestId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdmit() {
    if (admitting) return;
    setAdmitting(true);
    try {
      const result = await admitGuest(guestId);
      setGuestInfo((prev) => ({ ...prev, ...result }));
      setRingState(JUST_ADMITTED);
    } catch (err) {
      toast.err(errMessage(err, 'Could not admit guest.'));
    } finally {
      setAdmitting(false);
    }
  }

  const name = guestInfo?.name ?? 'Guest';
  const admittedAt = guestInfo?.admittedAt;
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
          {ringState === LOADING ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
              <span className="spinner" />
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Checking status…</p>
            </div>
          ) : (
            <>
              {/* Avatar with colored ring */}
              <AvatarRing
                userId={guestId}
                avatarUrl={avatarUrl}
                name={name}
                ringState={ringState}
              />

              {/* Name */}
              <motion.h2
                className="qrv-name"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {name}
              </motion.h2>

              <span className="user-badge guest" style={{ alignSelf: 'center' }}>Wedding Guest</span>

              {/* Status panel */}
              <AnimatePresence mode="wait">
                {ringState === PENDING && (
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

                {ringState === JUST_ADMITTED && (
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

                {ringState === ALREADY_ADMITTED && (
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

              {/* Action button */}
              {ringState === PENDING && (
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

              {ringState === JUST_ADMITTED && (
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => navigate('/admin')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <ArrowLeft className="ico" /> Back to guest list
                </motion.button>
              )}

              {ringState === ALREADY_ADMITTED && (
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => navigate('/admin')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
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
