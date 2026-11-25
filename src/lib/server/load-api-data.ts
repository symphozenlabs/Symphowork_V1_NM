import { error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export async function loadApiData<T>(request: Request, path: string): Promise<T> {
  const url = new URL(path, request.url);
  if (url.origin !== new URL(request.url).origin || !url.pathname.startsWith('/api/')) {
    error(500, 'Invalid application API path.');
  }
  const response = await getRequestEvent().fetch(url.pathname + url.search);
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    error(response.ok ? 502 : response.status, body?.error?.message ?? 'Unable to load application data.');
  }
  return body as T;
}
