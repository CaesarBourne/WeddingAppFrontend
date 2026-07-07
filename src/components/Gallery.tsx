import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, Images, RotateCw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePhotos } from '../lib/queries.ts';
import { errMessage } from '../lib/api.ts';
import { brand } from '../lib/brand.ts';
import { timeAgo } from '../lib/timeAgo.ts';
import { useAuth } from '../context/AuthContext.tsx';
import PhotoTile from './PhotoTile.tsx';
import Lightbox from './Lightbox.tsx';
import type { PhotoDto, UploaderGroup as UploaderGroupType } from '../types.ts';

const SKELETON_HEIGHTS = [220, 300, 180, 260, 340, 200] as const;

function Skeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="masonry" aria-hidden="true">
      {SKELETON_HEIGHTS.slice(0, count).map((h) => (
        <div className="sk" key={h} style={{ height: h }} />
      ))}
    </div>
  );
}

interface LightboxState {
  photos: PhotoDto[];
  index: number;
}

interface UploaderGroupProps {
  group: UploaderGroupType;
  onOpen: (state: LightboxState) => void;
  delay?: number;
}

function UploaderGroup({ group, onOpen, delay = 0 }: UploaderGroupProps) {
  const navigate = useNavigate();
  const preview = group.photos.slice(0, 3);
  const extra = group.photos.length - 3;

  return (
    <motion.section
      className="photo-group"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      <div className="photo-group-head">
        <div className="photo-group-avatar">
          <User className="ico" />
        </div>
        <div className="photo-group-meta">
          <span className="photo-group-name">{group.uploaderName}</span>
          <span className="photo-group-stats">
            {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
            {group.lastUploadedAt && (
              <span className="photo-group-time"> · {timeAgo(group.lastUploadedAt)}</span>
            )}
          </span>
        </div>
      </div>

      <div
        className="photo-row"
        style={{ gridTemplateColumns: `repeat(${preview.length}, 1fr)` }}
      >
        {preview.map((photo, i) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            index={i}
            onOpen={() => onOpen({ photos: group.photos, index: i })}
            compact
          />
        ))}
      </div>

      {extra > 0 && (
        <motion.button
          className="btn-see-more"
          onClick={() =>
            navigate(`/gallery/uploader/${group.uploaderId ?? '_uncredited_'}`, {
              state: { uploaderName: group.uploaderName },
            })
          }
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Images className="ico" />
          See {extra} more {extra === 1 ? 'photo' : 'photos'}
        </motion.button>
      )}
    </motion.section>
  );
}

interface GalleryProps {
  onTotal?: (total: number) => void;
  onUpload?: () => void;
}

export default function Gallery({ onTotal, onUpload }: GalleryProps) {
  const { user, isAdmin } = useAuth();
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

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const photos = useMemo(
    () => (data ? data.pages.flatMap((p) => p.data) : []),
    [data],
  );
  const total = data?.pages?.[0]?.meta?.total ?? null;

  useEffect(() => {
    if (typeof total === 'number') onTotal?.(total);
  }, [total, onTotal]);

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

  const groups = useMemo<UploaderGroupType[]>(() => {
    const map = new Map<string, UploaderGroupType>();
    for (const photo of photos) {
      const key = photo.uploaderId ?? '__uncredited__';
      if (!map.has(key)) {
        map.set(key, {
          uploaderId: photo.uploaderId,
          uploaderName: photo.uploaderName ?? 'Wedding Album',
          photos: [],
          lastUploadedAt: null,
        });
      }
      const g = map.get(key)!;
      g.photos.push(photo);
      if (
        photo.uploadedAt &&
        (!g.lastUploadedAt || new Date(photo.uploadedAt) > new Date(g.lastUploadedAt))
      ) {
        g.lastUploadedAt = photo.uploadedAt;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (!a.lastUploadedAt && !b.lastUploadedAt) return 0;
      if (!a.lastUploadedAt) return 1;
      if (!b.lastUploadedAt) return -1;
      return new Date(b.lastUploadedAt).getTime() - new Date(a.lastUploadedAt).getTime();
    });
  }, [photos]);

  const visibleGroups = useMemo(
    () => (isAdmin ? groups : groups.filter((g) => g.uploaderId === user?.id)),
    [groups, isAdmin, user],
  );

  if (isLoading) {
    return (
      <div className="gallery-wrap">
        <div className="photo-group">
          <div className="photo-group-head">
            <div className="photo-group-avatar sk" style={{ background: 'var(--surface-3)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="sk" style={{ width: 120, height: 16, borderRadius: 4 }} />
              <div className="sk" style={{ width: 80, height: 12, borderRadius: 4 }} />
            </div>
          </div>
          <Skeletons />
        </div>
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

  if (visibleGroups.length === 0 && !hasNextPage) {
    return (
      <div className="state">
        <div className="mark" aria-hidden="true">&amp;</div>
        <h2>{isAdmin ? 'The album is empty' : 'No photos yet'}</h2>
        <p>
          {isAdmin
            ? 'No photographs yet. The first upload starts the collection — go ahead.'
            : "You haven't added any photos yet. Tap the button above to share your first one."}
        </p>
        <button className="btn btn-gold" onClick={onUpload}>
          <ImagePlus className="ico" /> Add the first photo
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-wrap">
        {visibleGroups.map((group, i) => (
          <UploaderGroup
            key={group.uploaderId ?? '__uncredited__'}
            group={group}
            onOpen={setLightbox}
            delay={i * 0.06}
          />
        ))}

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

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox((prev) => prev ? { ...prev, index: idx } : null)}
        />
      )}
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
