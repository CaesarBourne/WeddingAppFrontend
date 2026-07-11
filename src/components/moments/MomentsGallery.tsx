"use client";

import { useMemo, useState } from "react";
import { ImageOff, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { rawPhotoUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import type { PagedPhotos, PhotoDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Lightbox } from "@/components/moments/Lightbox";

type Filter = "all" | "photos" | "videos";

const PAGE_SIZE = 24;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
];

function isVideo(mimeType: string | null): boolean {
  return (mimeType ?? "").startsWith("video/");
}

function PhotoTile({ photo, onOpen }: { photo: PhotoDto; onOpen: () => void }) {
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const video = isVideo(photo.mimeType);
  const src =
    rawPhotoUrl(clientEnv.apiBaseUrl, photo.id, "w700") + (retry ? `&r=${retry}` : "");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-muted shadow-soft transition-shadow hover:shadow-romance"
    >
      {failed ? (
        <div className="flex aspect-square items-center justify-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      ) : video ? (
        <div className="relative">
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            className="w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-white drop-shadow-lg" />
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={photo.description ?? photo.filename ?? "Wedding memory"}
          loading="lazy"
          className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => (retry < 3 ? setRetry(retry + 1) : setFailed(true))}
        />
      )}
      {photo.uploaderName && (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {photo.uploaderName}
        </span>
      )}
    </button>
  );
}

export function MomentsGallery({ initial }: { initial: PagedPhotos }) {
  const [items, setItems] = useState<PhotoDto[]>(initial.data);
  const [page, setPage] = useState(initial.meta.page);
  const [hasMore, setHasMore] = useState(initial.meta.hasNextPage);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "photos") return items.filter((p) => !isVideo(p.mimeType));
    if (filter === "videos") return items.filter((p) => isVideo(p.mimeType));
    return items;
  }, [items, filter]);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/moments/photos?page=${page + 1}&pageSize=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Could not load more photos.");
      const data = (await res.json()) as PagedPhotos;
      setItems((prev) => [...prev, ...data.data]);
      setPage(data.meta.page);
      setHasMore(data.meta.hasNextPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load more photos.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No memories yet — be the first to share one.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors ${
              filter === f.id
                ? "bg-gradient-gold text-foreground shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [column-fill:_balance]">
        {filtered.map((photo, i) => (
          <PhotoTile key={photo.id} photo={photo} onOpen={() => setLightboxIndex(i)} />
        ))}
      </div>

      {hasMore && filter === "all" && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
