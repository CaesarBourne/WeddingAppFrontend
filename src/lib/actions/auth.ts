"use server";

import { redirect } from "next/navigation";
import { buildApiUrl, parseApiError } from "@/lib/api-client";
import { env } from "@/lib/env";
import { clearSessionToken, setSessionToken } from "@/lib/session";

export interface ActionState {
  error?: string;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const res = await fetch(buildApiUrl(env.NEXT_PUBLIC_API_BASE_URL, "/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await parseApiError(res, "Could not sign in.");
    return { error: err.message };
  }

  const data = (await res.json()) as { accessToken: string };
  await setSessionToken(data.accessToken);
  redirect("/admin");
}

export async function guestLoginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");

  const res = await fetch(buildApiUrl(env.NEXT_PUBLIC_API_BASE_URL, "/auth/guest"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const err = await parseApiError(res, "Could not sign in. Try scanning your QR code again.");
    return { error: err.message };
  }

  const data = (await res.json()) as { accessToken: string };
  await setSessionToken(data.accessToken);
  redirect("/welcome");
}

export async function logoutAction(): Promise<void> {
  await clearSessionToken();
  redirect("/login");
}
