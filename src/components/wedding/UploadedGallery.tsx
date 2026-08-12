"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageOff, Images } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { rawPhotoUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import { Lightbox } from "@/components/moments/Lightbox";
import type { PagedPhotos, PhotoDto } from "@/lib/types";

function Tile({ photo, onOpen }: { readonly photo: PhotoDto; readonly onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const src = rawPhotoUrl(clientEnv.apiBaseUrl, photo.id, "w700");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="reveal group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-soft transition-all duration-700 hover:shadow-romance"
    >
      {failed ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-6" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={photo.description ?? photo.filename ?? "Wedding memory"}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-110"
          onError={() => setFailed(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {photo.uploaderName && (
        <div className="absolute bottom-3 left-3 right-3 text-left text-xs tracking-wider text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {photo.uploaderName}
        </div>
      )}
    </button>
  );
}

export function UploadedGallery({ initial }: { readonly initial: PagedPhotos }) {
  const ref = useReveal();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = initial.data;

  return (
    <section id="shared-gallery" ref={ref} className="scroll-mt-nav relative py-10 md:py-14 bg-background overflow-hidden">
      <div className="container relative">
        <div className="reveal mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif-display text-2xl md:text-3xl">
            <span className="font-script text-gradient-gold mr-2">shared with love</span>
            Our Wedding Gallery
          </h2>
          <Link
            href="/moments"
            className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-foreground"
          >
            <Images className="size-4" />
            View Full Gallery
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {photos.length === 0 ? (
          <p className="reveal text-center text-muted-foreground">
            No shared memories yet — check back after the celebration.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
            {photos.slice(0, 12).map((photo, i) => (
              <Tile key={photo.id} photo={photo} onOpen={() => setLightboxIndex(i)} />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={photos.slice(0, 12)}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
