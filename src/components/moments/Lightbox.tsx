"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { rawPhotoUrl } from "@/lib/api-client";
import { clientEnv } from "@/lib/env-client";
import type { PhotoDto } from "@/lib/types";

interface Props {
  items: PhotoDto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

function isVideo(mimeType: string | null): boolean {
  return (mimeType ?? "").startsWith("video/");
}

export function Lightbox({ items, index, onIndexChange, onClose }: Props) {
  const item = items[index];

  const prev = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (!item) return null;

  const displaySrc = rawPhotoUrl(clientEnv.apiBaseUrl, item.id, "display");
  const downloadSrc = rawPhotoUrl(clientEnv.apiBaseUrl, item.id, "download");
  const caption = item.description || item.filename || "Untitled";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 text-white/80 hover:text-white"
        aria-label="Close"
        onClick={onClose}
      >
        <X className="h-7 w-7" />
      </button>

      {items.length > 1 && (
        <button
          className="absolute left-4 text-white/70 hover:text-white"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
        >
          <ChevronLeft className="h-9 w-9" />
        </button>
      )}

      <div className="flex max-h-[88vh] max-w-[92vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {isVideo(item.mimeType) ? (
          <video
            src={displaySrc}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={caption}
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
          />
        )}

        <div className="flex items-center gap-4 text-sm text-white/80">
          <span className="truncate">{item.uploaderName ? `${caption} · ${item.uploaderName}` : caption}</span>
          <a
            href={downloadSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" /> Download
          </a>
          {items.length > 1 && (
            <span className="text-white/50">
              {index + 1} / {items.length}
            </span>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <button
          className="absolute right-4 text-white/70 hover:text-white"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
        >
          <ChevronRight className="h-9 w-9" />
        </button>
      )}
    </div>
  );
}
