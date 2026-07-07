import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { usePhotos } from '../lib/queries.ts';
import { useAuth } from '../context/AuthContext.tsx';
import PhotoTile from './PhotoTile.tsx';
import Lightbox from './Lightbox.tsx';
import type { PhotoDto } from '../types.ts';

interface LightboxState {
  photos: PhotoDto[];
  index: number;
}

export default function UploaderPage() {
  const { uploaderId } = useParams<{ uploaderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const resolvedId = uploaderId === '_uncredited_' ? null : (uploaderId ?? null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePhotos();

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin && user?.id !== resolvedId) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, user, resolvedId, navigate]);

  const photos = useMemo(
    () => (data ? data.pages.flatMap((p) => p.data) : []),
    [data],
  );

  const uploaderPhotos = useMemo(
    () => photos.filter((p) => (p.uploaderId ?? null) === resolvedId),
    [photos, resolvedId],
  );

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

  const locationState = location.state as { uploaderName?: string } | null;
  const uploaderName =
    uploaderPhotos[0]?.uploaderName ??
    locationState?.uploaderName ??
    (uploaderId === '_uncredited_' ? 'Wedding Album' : 'Guest');

  return (
    <div className="uploader-page">
      <motion.header
        className="uploader-page-header"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="ico" /> Gallery
        </button>
        <div className="uploader-page-title">
          <span className="uploader-page-name">{uploaderName}</span>
          <span className="uploader-page-count">
            {uploaderPhotos.length} {uploaderPhotos.length === 1 ? 'photo' : 'photos'}
            {hasNextPage ? '+' : ''}
          </span>
        </div>
      </motion.header>

      <main className="uploader-page-main">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : (
          <div className="masonry">
            {uploaderPhotos.map((photo, i) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                index={i}
                onOpen={() => setLightbox({ photos: uploaderPhotos, index: i })}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="sentinel" />

        {isFetchingNextPage && (
          <div className="loadmore">
            <span className="spinner" />
          </div>
        )}
        {!hasNextPage && uploaderPhotos.length > 0 && (
          <div
            className="loadmore"
            style={{ fontStyle: 'italic', fontFamily: 'var(--display)' }}
          >
            fin.
          </div>
        )}
      </main>

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox((prev) => prev ? { ...prev, index: idx } : null)}
        />
      )}
    </div>
  );
}
