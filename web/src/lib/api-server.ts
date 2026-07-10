import { buildApiUrl } from "./api-client";
import { env } from "./env";
import { getSessionToken } from "./session";

export interface ApiFetchOptions extends Omit<RequestInit, "headers"> {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: HeadersInit;
}

/** Attaches a Bearer token to a Headers instance — mirrors src/lib/api.ts's axios request interceptor. */
export function buildAuthHeaders(
  token: string | null,
  existing?: HeadersInit,
): Headers {
  const headers = new Headers(existing);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

/** Server-only fetch wrapper: attaches the session JWT and resolves against the API base URL. */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { params, headers, ...init } = options;
  const token = await getSessionToken();
  const url = buildApiUrl(env.NEXT_PUBLIC_API_BASE_URL, path, params);
  return fetch(url, {
    ...init,
    headers: buildAuthHeaders(token, headers),
  });
}
