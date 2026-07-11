"use server";

import { revalidatePath } from "next/cache";
import { parseApiError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-server";
import type { ActionState } from "@/lib/actions/auth";

export async function uploadMyAvatarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const res = await apiFetch("/users/me/avatar", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not upload photo.");
    return { error: err.message };
  }
  revalidatePath("/welcome");
  return {};
}

export async function createGuestAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const res = await apiFetch("/users/guests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not create guest.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

export async function deleteGuestAction(guestId: string): Promise<ActionState> {
  const res = await apiFetch(`/users/guests/${guestId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not remove guest.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

export async function toggleGuestButtonAction(
  guestId: string,
  enabled: boolean,
): Promise<ActionState> {
  const res = await apiFetch(`/users/guests/${guestId}/button`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not update guest.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

export async function uploadUserAvatarAction(
  userId: string,
  formData: FormData,
): Promise<ActionState> {
  const res = await apiFetch(`/users/${userId}/avatar`, { method: "PATCH", body: formData });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not upload avatar.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

export async function admitGuestAction(guestId: string): Promise<
  { admissionStatus: string; admittedAt: string | null } | { error: string }
> {
  const res = await apiFetch(`/users/${guestId}/admit`, { method: "POST" });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not admit guest.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return (await res.json()) as { admissionStatus: string; admittedAt: string | null };
}
