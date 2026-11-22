// Each call owns its request and response. Even GET routes may have backend side effects.
export async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new Error(body?.error?.message ?? 'Unable to complete the request.');
  }
  return body as T;
}

export function mutation<T = Record<string, unknown>>(path: string, method: string, data?: unknown): Promise<T> {
  return api<T>(path, data instanceof FormData
    ? { method, body: data }
    : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }
  );
}
