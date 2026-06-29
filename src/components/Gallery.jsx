import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, AlertCircle, RotateCw } from 'lucide-react';
import { usePhotos } from '../lib/queries.js';
import { errMessage } from '../lib/api.js';
import { brand } from '../lib/brand.js';
import PhotoTile from './PhotoTile.jsx';
import Lightbox from './Lightbox.jsx';

function Skeletons({ count = 8 }) {
  // Varied heights so the loading state reads like a real masonry wall.
  const heights = [220, 300, 180, 260, 340, 200, 280, 240];
  return (
    <div className="masonry" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="sk" key={i} style={{ height: heights[i % heights.length] }} />
      ))}
    </div>
  );
}

export default function Gallery({ onTotal, onUpload }) {
  const {
    data,
    error,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePhotos();

  const [lightbox, setLightbox] = useState(null);
  const sentinelRef = useRef(null);

  const photos = useMemo(
    () => (data ? data.pages.flatMap((p) => p.data) : []),
    [data],
  );
  const total = data?.pages?.[0]?.meta?.total ?? null;

  useEffect(() => {
    if (typeof total === 'number') onTotal?.(total);
  }, [total, onTotal]);

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="gallery-wrap">
        <Skeletons />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="state">
        <div className="mark" aria-hidden="true">!</div>
        <h2>The album won&rsquo;t load</h2>
        <p>{errMessage(error)}</p>
        <button className="btn btn-gold" onClick={() => refetch()}>
          <RotateCw className="ico" /> Try again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="state">
        <div className="mark" aria-hidden="true">&amp;</div>
        <h2>The album is empty</h2>
        <p>No photographs yet. The first upload starts the collection — go ahead.</p>
        <button className="btn btn-gold" onClick={onUpload}>
          <ImagePlus className="ico" /> Add the first photo
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-wrap">
        <div className="masonry">
          {photos.map((photo, i) => (
            <PhotoTile key={photo.id} photo={photo} index={i} onOpen={setLightbox} />
          ))}
        </div>

        <div ref={sentinelRef} className="sentinel" />

        {isFetchingNextPage && (
          <div className="loadmore">
            <span className="spinner" />
          </div>
        )}
        {!hasNextPage && photos.length > 0 && (
          <div className="loadmore" style={{ fontStyle: 'italic', fontFamily: 'var(--display)' }}>
            fin.
          </div>
        )}
      </div>

      <Lightbox
        photos={photos}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
      />
    </>
  );
}

export function Masthead() {
  return (
    <motion.section
      className="masthead"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <div className="eyebrow">{brand.date}</div>
      <h1>
        {brand.first} <span className="amp">&amp;</span> {brand.second}
      </h1>
      <p className="sub">{brand.tagline}</p>
      <div className="rule" />
    </motion.section>
  );
}
