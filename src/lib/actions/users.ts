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

export async function createAdminAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8)
    return { error: "Name, email, and a password of at least 8 characters are required." };

  const res = await apiFetch("/users/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not create admin.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

export async function deleteAdminAction(adminId: string): Promise<ActionState> {
  const res = await apiFetch(`/users/admins/${adminId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not remove admin.");
    return { error: err.message };
  }
  revalidatePath("/admin");
  return {};
}

/** Looks up a guest by their QR token without creating a session. Returns the guest's ID. */
export async function getGuestByTokenAction(
  token: string,
): Promise<{ guestId: string; name: string } | { error: string }> {
  const res = await apiFetch("/auth/guest-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await parseApiError(res, "Guest not found or QR code is invalid.");
    return { error: err.message };
  }
  const data = (await res.json()) as { id: string; name?: string };
  return { guestId: data.id, name: data.name ?? "Guest" };
}
