import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, ImageOff } from 'lucide-react';
import { rawSrc, isVideo } from '../lib/api.js';

export default function PhotoTile({ photo, index, onOpen }) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const video = isVideo(photo.mimeType);

  // Reserve aspect-ratio space so the masonry doesn't reflow as images load.
  const ratio =
    photo.width && photo.height ? photo.width / photo.height : 4 / 3;

  return (
    <motion.figure
      className="tile"
      tabIndex={0}
      role="button"
      aria-label={`Open ${photo.filename || 'photo'}`}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(index);
        }
      }}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '120px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.04 }}
    >
      {failed ? (
        <div
          style={{
            aspectRatio: ratio,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--faint)',
            gap: 6,
          }}
        >
          <ImageOff style={{ width: 22, height: 22 }} />
        </div>
      ) : (
        <img
          className="tile-img"
          src={rawSrc(photo.id, 'w700')}
          alt={photo.description || photo.filename || 'Wedding photograph'}
          loading="lazy"
          decoding="async"
          style={{ aspectRatio: ratio }}
          onError={() => setFailed(true)}
        />
      )}

      <span className="tile-frame" aria-hidden="true" />

      {video && (
        <span className="tile-badge" aria-hidden="true">
          <Play className="ico" />
        </span>
      )}

      <figcaption className="tile-cap">
        <span className="name">{photo.description || photo.filename || 'Untitled'}</span>
      </figcaption>
    </motion.figure>
  );
}
