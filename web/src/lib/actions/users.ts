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
