"use client";

import { useState } from "react";
import { ImageOff, Play, User } from "lucide-react";
import { rawPhotoUrl, avatarUrl, buildApiUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import { Lightbox } from "@/components/moments/Lightbox";
import type { PhotoDto } from "@/lib/types";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function isVideo(mimeType: string | null): boolean {
  return (mimeType ?? "").startsWith("video/");
}

function UploaderAvatar({ uploaderId }: { readonly uploaderId: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!uploaderId || failed) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <User className="size-5" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl(clientEnv.apiBaseUrl, uploaderId)}
      alt=""
      className="size-10 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function GridPhoto({
  photo,
  onOpen,
}: {
  readonly photo: PhotoDto;
  readonly onOpen: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const video = isVideo(photo.mimeType);
  const src = rawPhotoUrl(clientEnv.apiBaseUrl, photo.id, "w700");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted"
    >
      {failed ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-5" />
        </div>
      ) : video ? (
        <>
          <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <Play className="size-8 text-white drop-shadow-lg" />
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={photo.description ?? photo.filename ?? ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      )}
    </button>
  );
}

interface UploaderGroup {
  uploaderId: string | null;
  uploaderName: string | null;
  photos: PhotoDto[];
  latestAt: string | null;
}

function groupByUploader(photos: PhotoDto[]): UploaderGroup[] {
  const map = new Map<string, UploaderGroup>();

  for (const photo of photos) {
    const key = photo.uploaderId ?? "__anonymous__";
    const existing = map.get(key);
    const photoDate = photo.uploadedAt ?? photo.creationTime;

    if (existing) {
      existing.photos.push(photo);
      if (photoDate && (!existing.latestAt || photoDate > existing.latestAt)) {
        existing.latestAt = photoDate;
      }
    } else {
      map.set(key, {
        uploaderId: photo.uploaderId,
        uploaderName: photo.uploaderName,
        photos: [photo],
        latestAt: photoDate,
      });
    }
  }

  // Sort groups by most recent upload first
  return [...map.values()].sort((a, b) => {
    if (!a.latestAt) return 1;
    if (!b.latestAt) return -1;
    return b.latestAt.localeCompare(a.latestAt);
  });
}

export function GroupedGallery({ photos }: { readonly photos: PhotoDto[] }) {
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoDto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const groups = groupByUploader(photos);

  function openLightbox(groupPhotos: PhotoDto[], index: number) {
    setLightboxPhotos(groupPhotos);
    setLightboxIndex(index);
  }

  if (photos.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No shared memories yet — be the first to add yours.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <div key={group.uploaderId ?? "__anonymous__"} className="flex flex-col gap-4">
          {/* Uploader header — matches screenshot design */}
          <div className="flex items-center gap-3 border-b pb-3">
            <UploaderAvatar uploaderId={group.uploaderId} />
            <div className="flex flex-col">
              <span className="font-medium">
                {group.uploaderName ?? "Anonymous guest"}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.photos.length} photo{group.photos.length === 1 ? "" : "s"}
                {group.latestAt ? ` · ${timeAgo(group.latestAt)}` : ""}
              </span>
            </div>
          </div>

          {/* Photo grid — 3 columns as shown in screenshot */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {group.photos.map((photo, i) => (
              <GridPhoto
                key={photo.id}
                photo={photo}
                onOpen={() => openLightbox(group.photos, i)}
              />
            ))}
          </div>
        </div>
      ))}

      {lightboxIndex !== null && lightboxPhotos.length > 0 && (
        <Lightbox
          items={lightboxPhotos}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
