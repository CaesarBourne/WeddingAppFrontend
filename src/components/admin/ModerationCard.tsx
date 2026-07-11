"use client";

import { useState } from "react";
import { Check, Clock, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";
import { moderatePhotoAction } from "@/lib/actions/photos";
import type { PhotoDto } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function isVideo(mimeType: string | null): boolean {
  return (mimeType ?? "").startsWith("video/");
}

export function ModerationCard({ item }: { item: PhotoDto }) {
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  // The moderation endpoint returns a fresh Google URL directly (pending photos
  // can't be served via /raw). Prefer the thumbnail for the grid.
  const preview = item.thumbnailUrl ?? item.displayUrl ?? item.baseUrl;

  async function moderate(status: "approved" | "rejected") {
    setBusy(status);
    const result = await moderatePhotoAction(item.id, status);
    if ("error" in result) {
      toast.error(result.error);
      setBusy(null);
    } else {
      toast.success(status === "approved" ? "Approved" : "Rejected");
      // revalidatePath refreshes the list; the card unmounts on success.
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="relative aspect-square bg-muted">
        {preview ? (
          isVideo(item.mimeType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <video src={item.displayUrl ?? preview} className="h-full w-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={item.description ?? item.filename ?? "Pending upload"}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Clock className="h-6 w-6" />
          </div>
        )}
        {item.status && (
          <Badge
            variant={item.status === "approved" ? "default" : "secondary"}
            className="absolute left-2 top-2 capitalize"
          >
            {item.status}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {item.description && (
          <p className="line-clamp-2 text-sm italic text-foreground/70">
            &ldquo;{item.description}&rdquo;
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{item.uploaderName ?? "Anonymous"}</span>
          {item.uploadedAt && (
            <>
              <span>·</span>
              <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {item.status !== "approved" && (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={busy !== null}
              onClick={() => moderate("approved")}
            >
              {busy === "approved" ? <Loader2 className="animate-spin" /> : <Check />}
              Approve
            </Button>
          )}
          {item.status !== "rejected" && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={busy !== null}
              onClick={() => moderate("rejected")}
            >
              {busy === "rejected" ? <Loader2 className="animate-spin" /> : <X />}
              {item.status === "approved" ? "Unpublish" : "Reject"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
