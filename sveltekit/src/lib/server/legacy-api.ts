import { error } from "@sveltejs/kit";

const REQUEST_TIMEOUT_MS = 30_000;

function legacyOrigin() {
  const origin = process.env.LEGACY_API_ORIGIN?.trim();
  if (!origin) throw error(503, "The API service is not configured for this deployment.");
  try {
    return new URL(origin);
  } catch {
    throw error(503, "The API service is not configured correctly for this deployment.");
  }
}

export async function forwardLegacyRequest({ request, path, fetch }: { request: Request; path: string; fetch: typeof globalThis.fetch }) {
  const target = legacyOrigin();
  target.pathname = `/api/${path}`;
  target.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-symphowork-frontend", "sveltekit");

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    throw error(503, "The API service is temporarily unavailable.");
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
