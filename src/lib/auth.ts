import { redirect } from "next/navigation";
import { apiFetch } from "./api-server";
import { getSessionToken } from "./session";
import type { AuthUser } from "./types";

/**
 * Reads the session cookie and validates it against GET /auth/me. Server-only.
 *
 * Does NOT clear an invalid/expired cookie here: Next.js only allows cookie
 * mutation inside a Server Action or Route Handler, and this is called from
 * plain Server Components (every protected page). A stale cookie just keeps
 * failing this check on every request until the user explicitly logs out
 * (logoutAction) or it expires — the user is still correctly redirected.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await apiFetch("/auth/me");
  if (!res.ok) return null;

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

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === "super_admin";
}

/** Redirects to /admin if the current user is not a super_admin. */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAdmin();
  if (!isSuperAdmin(user)) redirect("/admin");
  return user;
}
