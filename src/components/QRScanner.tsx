import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import { getGuestInfo, errMessage } from '../lib/api.ts';
import type { GuestInfo } from '../types.ts';

type ScanState = 'scanning' | 'found' | 'error' | 'nopermission';

export default function QRScanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const foundRef = useRef(false);
  const rafRef = useRef<number>(0);

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMsg, setErrorMsg] = useState('');
  const [foundGuest, setFoundGuest] = useState<GuestInfo | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    foundRef.current = false;
    setScanState('scanning');
    setErrorMsg('');
    setFoundGuest(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
    } catch {
      setScanState('nopermission');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Scan loop — ~8fps is plenty for a handheld scan
  useEffect(() => {
    let throttle = 0;

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - throttle < 120) return;
      throttle = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) return;
      if (foundRef.current) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code?.data) {
        handleScanned(code.data);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScanned(raw: string) {
    if (foundRef.current) return;
    foundRef.current = true;

    try {
      // Extract the guest token from the scanned URL  (e.g. /guest?t=TOKEN)
      let token: string | null = null;
      try {
        const url = new URL(raw);
        token = url.searchParams.get('t');
      } catch {
        token = null;
      }

      if (!token) {
        setErrorMsg("This QR code isn’t a valid wedding guest code. Try again.");
        setScanState('error');
        foundRef.current = false;
        return;
      }

      const guestInfo = await getGuestInfo(token);
      setFoundGuest(guestInfo);
      setScanState('found');

      // Brief pause so the "Found!" state is visible, then navigate
      setTimeout(() => {
        navigate(`/qr/validate/${guestInfo.id}`, { state: { guestInfo } });
      }, 900);
    } catch (err) {
      setErrorMsg(errMessage(err, 'Could not look up this guest. Try again.'));
      setScanState('error');
      foundRef.current = false;
    }
  }

  function retry() {
    foundRef.current = false;
    stopCamera();
    startCamera();
  }

  return (
    <div className="qrs-shell">
      {/* Hidden canvas for jsQR processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="qrs-video"
        muted
        playsInline
        autoPlay
      />

      {/* Dark overlay — leaves a transparent scanning window */}
      <div className="qrs-overlay" aria-hidden="true" />

      {/* Header */}
      <motion.header
        className="qrs-header"
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="btn qrs-back-btn" onClick={() => { stopCamera(); navigate('/admin'); }}>
          <ArrowLeft className="ico" /> Back
        </button>
        <span className="qrs-header-title">Scan Guest QR</span>
      </motion.header>

      {/* Scanning frame */}
      <div className="qrs-frame-wrap">
        <div className={`qrs-frame qrs-frame--${scanState}`}>
          <span className="qrs-corner qrs-corner--tl" />
          <span className="qrs-corner qrs-corner--tr" />
          <span className="qrs-corner qrs-corner--bl" />
          <span className="qrs-corner qrs-corner--br" />
          {scanState === 'scanning' && <div className="qrs-scan-line" />}
        </div>
      </div>

      {/* Footer status */}
      <div className="qrs-footer">
        <AnimatePresence mode="wait">
          {scanState === 'scanning' && (
            <motion.div
              key="scanning"
              className="qrs-status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Camera className="ico" style={{ width: 18, height: 18 }} />
              Point the camera at a guest&rsquo;s QR code
            </motion.div>
          )}

          {scanState === 'found' && (
            <motion.div
              key="found"
              className="qrs-status qrs-status--found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <CheckCircle2 className="ico" style={{ width: 18, height: 18 }} />
              Found — {foundGuest?.name ?? 'Guest'} · redirecting…
            </motion.div>
          )}

          {(scanState === 'error' || scanState === 'nopermission') && (
            <motion.div
              key="error"
              className="qrs-status qrs-status--error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span>
                  {scanState === 'nopermission'
                    ? 'Camera access denied. Please allow camera permission in your browser settings.'
                    : errorMsg}
                </span>
                {scanState === 'error' && (
                  <button className="btn qrs-retry-btn" onClick={retry}>
                    <RefreshCw className="ico" style={{ width: 15, height: 15 }} />
                    Try again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
