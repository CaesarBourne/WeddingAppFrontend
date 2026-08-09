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
    <section id="shared-gallery" ref={ref} className="scroll-mt-nav relative py-28 md:py-40 bg-background overflow-hidden">
      <div className="container relative">
        <div className="text-center mb-14 reveal">
          <p className="font-script text-3xl md:text-4xl text-gradient-gold mb-2">shared with love</p>
          <h2 className="font-serif-display text-4xl md:text-6xl">Our Wedding Gallery</h2>
          <div className="mx-auto mt-6 h-px w-24 bg-gradient-gold" />
          <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground md:text-base">
            Photos and videos shared by us and our guests, all in one place.
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="reveal text-center text-muted-foreground">
            No shared memories yet — check back after the celebration.
          </p>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {photos.slice(0, 12).map((photo, i) => (
              <Tile key={photo.id} photo={photo} onOpen={() => setLightboxIndex(i)} />
            ))}
          </div>
        )}

        <div className="reveal mt-14 flex justify-center">
          <Link
            href="/moments"
            className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-gold px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] text-foreground shadow-gold transition-all duration-500 hover:scale-105 hover:shadow-romance"
          >
            <Images className="size-4" />
            View Full Gallery
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
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
