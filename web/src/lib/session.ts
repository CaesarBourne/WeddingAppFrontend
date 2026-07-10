import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "wpa_session";

export function sessionCookieOptions(nodeEnv: string) {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches the backend's default JWT_EXPIRES_IN
  };
}

/** Reads the session JWT. Must be called within a request scope (Server Component, Route Handler, Server Action). */
export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Sets the session JWT as an httpOnly cookie. Callable only from a Route Handler or Server Action. */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(process.env.NODE_ENV ?? "development"),
  );
}

/** Clears the session cookie (logout). Callable only from a Route Handler or Server Action. */
export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
