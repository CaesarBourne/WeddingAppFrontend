import { parseApiError } from "@/lib/api-client";
import { apiFetch } from "@/lib/api-server";
import { getSessionToken } from "@/lib/session";
import type { PhotoDto, UploadResult } from "@/lib/types";

/**
 * Auth-checked upload proxy. Uploads can't go through a Server Action (≈1MB body
 * cap, no progress) — wedding videos run large — so the client drives this with
 * XHR for a real progress bar, and we attach the session JWT here, server-side,
 * so it's never exposed to the browser. Forwards to the backend's single or bulk
 * endpoint based on file count, then normalizes to a single UploadResult shape.
 */
export async function POST(request: Request): Promise<Response> {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ error: "You must be signed in to upload." }, { status: 401 });
  }

  let incoming: FormData;
  try {
    incoming = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload request." }, { status: 400 });
  }
  const files = incoming.getAll("files").filter((f): f is File => f instanceof File);
  const description = String(incoming.get("description") ?? "").trim();

  if (files.length === 0) {
    return Response.json({ error: "No files were provided." }, { status: 400 });
  }

  const many = files.length > 1;
  const outgoing = new FormData();
  if (many) {
    files.forEach((f) => outgoing.append("files", f));
  } else {
    outgoing.append("file", files[0]);
  }
  if (description) outgoing.append("description", description);

  const res = await apiFetch(many ? "/photos/upload/bulk" : "/photos/upload", {
    method: "POST",
    body: outgoing,
  });

  if (!res.ok) {
    const err = await parseApiError(res, "Upload failed.");
    return Response.json({ error: err.message }, { status: res.status });
  }

  const data = await res.json();
  const result: UploadResult = many
    ? (data as UploadResult)
    : { createdCount: 1, failedCount: 0, created: [data as PhotoDto], failed: [] };

  return Response.json(result);
}
