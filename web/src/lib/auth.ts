import { redirect } from "next/navigation";
import { apiFetch } from "./api-server";
import { clearSessionToken, getSessionToken } from "./session";
import type { AuthUser } from "./types";

/** Reads the session cookie and validates it against GET /auth/me. Server-only. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await apiFetch("/auth/me");
  if (!res.ok) {
    await clearSessionToken();
    return null;
  }
  const data = (await res.json()) as AuthUser & { sub: string };
  return { ...data, id: data.sub };
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "admin" || user?.role === "super_admin";
}

/** Redirects to /login if there is no authenticated session. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to / if the current user is not an admin or super_admin. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/");
  return user;
}
