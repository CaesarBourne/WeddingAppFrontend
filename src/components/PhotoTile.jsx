import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, ImageOff } from 'lucide-react';
import { rawSrc, isVideo } from '../lib/api.js';

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 4000;

export default function PhotoTile({ photo, index, onOpen, compact = false }) {
  const reduce = useReducedMotion();
  const [retries, setRetries] = useState(0);
  const timerRef = useRef(null);
  const video = isVideo(photo.mimeType);

  const failed = retries > MAX_RETRIES;

  function handleError() {
    if (retries < MAX_RETRIES) {
      timerRef.current = setTimeout(
        () => setRetries((r) => r + 1),
        RETRY_DELAY_MS,
      );
    } else {
      setRetries(MAX_RETRIES + 1);
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const ratio =
    photo.width && photo.height ? photo.width / photo.height : 4 / 3;

  // compact=true fills the parent container; default preserves aspect ratio.
  const containerStyle = compact
    ? { width: '100%', height: '100%' }
    : { aspectRatio: ratio };
  const mediaStyle = compact
    ? { width: '100%', height: '100%', objectFit: 'cover' }
    : { aspectRatio: ratio };

  const cacheBust = retries > 0 ? `&r=${retries}` : '';
  const imgSrc = rawSrc(photo.id, 'w700') + cacheBust;
  const videoSrc = rawSrc(photo.id, 'download') + cacheBust;

  let media;
  if (failed) {
    media = (
      <div
        style={{
          ...containerStyle,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--faint)',
          gap: 6,
        }}
      >
        <ImageOff style={{ width: 22, height: 22 }} />
      </div>
    );
  } else if (video) {
    media = (
      <video
        key={retries}
        className="tile-img"
        src={videoSrc}
        poster={rawSrc(photo.id, 'w700')}
        preload="none"
        muted
        playsInline
        style={mediaStyle}
        onError={handleError}
      />
    );
  } else {
    media = (
      <img
        key={retries}
        className="tile-img"
        src={imgSrc}
        alt={photo.description || photo.filename || 'Wedding photograph'}
        loading="lazy"
        decoding="async"
        style={mediaStyle}
        onError={handleError}
      />
    );
  }

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
      {media}

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

PhotoTile.propTypes = {
  photo: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onOpen: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};
