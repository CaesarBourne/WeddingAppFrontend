"use client";

import imageCompression from "browser-image-compression";
import type { UploadResult } from "@/lib/types";

export const ACCEPTED_UPLOAD_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2000,
  useWebWorker: true,
} as const;

/** Compress images client-side (videos pass through untouched) — matches emmilove's upload. */
export async function compressIfImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, COMPRESSION_OPTIONS);
  } catch {
    // If compression fails for any reason, fall back to the original file.
    return file;
  }
}

/**
 * Compresses images, then uploads via the auth-checked Route Handler using XHR
 * (so we get real upload progress, which fetch/Server Actions can't provide).
 * `onProgress` reports 0–100 for the browser → server leg.
 */
export async function uploadFiles(
  files: File[],
  description: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const processed = await Promise.all(files.map(compressIfImage));

  const form = new FormData();
  processed.forEach((f) => form.append("files", f));
  if (description) form.append("description", description);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/moments/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as UploadResult);
      } else {
        const message =
          (body as { error?: string } | null)?.error ?? "Upload failed. Please try again.";
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}
