import { parseApiError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-server";
import type { PagedPhotos } from "@/lib/types";

/**
 * Paginated photos proxy for client-side "load more". The session JWT lives in
 * an httpOnly cookie the client can't read, but the browser sends it to this
 * same-origin route automatically, and apiFetch attaches it to the backend call.
 *
 * NOTE (Phase 3 interim): the backend's GET /photos still requires a JWT, so this
 * gallery is behind the invitation login for now. When the backend makes /photos
 * public + approved-only, this route can proxy anonymously (or be dropped for a
 * direct public fetch) with no change to the gallery component.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "24");

  const res = await apiFetch("/photos", { params: { page, pageSize } });
  if (!res.ok) {
    const err = await parseApiError(res, "Could not load photos.");
    return Response.json({ error: err.message }, { status: res.status });
  }

  const data = (await res.json()) as PagedPhotos;
  return Response.json(data);
}
