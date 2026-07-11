"use server";

import { revalidatePath } from "next/cache";
import { parseApiError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-server";

export type ModerationResult = { ok: true } | { error: string };

/** Approve or reject a photo (admin). DB-only on the backend, so it takes effect instantly. */
export async function moderatePhotoAction(
  id: string,
  status: "approved" | "rejected",
): Promise<ModerationResult> {
  const res = await apiFetch(`/photos/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not update photo.");
    return { error: err.message };
  }
  revalidatePath("/admin/moderation");
  return { ok: true };
}
