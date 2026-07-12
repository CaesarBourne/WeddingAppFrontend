import { buildApiUrl } from "@/lib/api-client";
import { env } from "@/lib/env";
import { getSessionToken } from "@/lib/session";

/**
 * Proxies the backend SSE order-notification stream to the browser.
 *
 * EventSource cannot send custom headers, so the browser connects here
 * (same-origin, cookie automatically included). We read the httpOnly
 * session cookie, attach the Bearer token, and pipe the backend stream
 * straight through.
 */
export async function GET(): Promise<Response> {
  const token = await getSessionToken();
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = buildApiUrl(env.NEXT_PUBLIC_API_BASE_URL, "/food/events");

  let backendRes: Response;
  try {
    backendRes = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      // Keep the connection alive for as long as the client is connected.
      // @ts-expect-error — Next.js / Node fetch supports this non-standard option
      duplex: "half",
    });
  } catch {
    return new Response("Stream unavailable", { status: 503 });
  }

  if (!backendRes.ok || !backendRes.body) {
    return new Response("Stream unavailable", { status: 503 });
  }

  return new Response(backendRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
