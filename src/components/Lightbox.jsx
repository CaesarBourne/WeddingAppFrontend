import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { rawSrc, isVideo, API_BASE } from '../lib/api.js';

export default function Lightbox({ photos, index, onClose, onNavigate }) {
  const reduce = useReducedMotion();
  const open = index != null;
  const photo = open ? photos[index] : null;

  const go = useCallback(
    (dir) => {
      if (index == null) return;
      const next = index + dir;
      if (next >= 0 && next < photos.length) onNavigate(next);
    },
    [index, photos.length, onNavigate],
  );

  // Keyboard controls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Quietly preload the neighbouring images for instant nav.
  useEffect(() => {
    if (index == null) return;
    [index - 1, index + 1].forEach((i) => {
      const p = photos[i];
      if (p && !isVideo(p.mimeType)) {
        const img = new Image();
        img.src = rawSrc(p.id, 'w1600');
      }
    });
  }, [index, photos]);

  const video = photo && isVideo(photo.mimeType);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="lb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <div className="lb-stage" onClick={onClose}>
            <button className="btn btn-icon lb-close" onClick={onClose} aria-label="Close viewer">
              <X className="ico" />
            </button>

            {index > 0 && (
              <button
                className="lb-nav lb-prev"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="ico" />
              </button>
            )}
            {index < photos.length - 1 && (
              <button
                className="lb-nav lb-next"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next photo"
              >
                <ChevronRight className="ico" />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={photo.id}
                onClick={(e) => e.stopPropagation()}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'grid', placeItems: 'center', minHeight: 0 }}
              >
                {video ? (
                  <video
                    className="lb-media"
                    src={rawSrc(photo.id, 'download')}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <img
                    className="lb-media"
                    src={rawSrc(photo.id, 'w1600')}
                    alt={photo.description || photo.filename || 'Wedding photograph'}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="lb-foot">
            <div className="lb-cap">
              <div className="name">{photo.description || photo.filename || 'Untitled'}</div>
              {photo.creationTime && (
                <div className="sub">
                  {new Date(photo.creationTime).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
            <span className="lb-count">
              {index + 1} / {photos.length}
            </span>
            <a
              className="btn btn-icon"
              href={`${API_BASE}/photos/${encodeURIComponent(photo.id)}/raw?size=download`}
              target="_blank"
              rel="noreferrer"
              aria-label="Download original"
              title="Download original"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="ico" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
