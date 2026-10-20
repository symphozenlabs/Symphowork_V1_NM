import { invalidRelayInput } from './request-validation';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {sessionDatabaseURL,IntegrationConfigurationError} from './integration-configuration';
import { allowedMethods, allowsRequest, sameOriginMutation, upstreamOrigin, sessionCookie, SESSION_COOKIE } from './proxy-policy';
function failure(status: number, code: string, message: string): Response {
  return Response.json({ success: false, error: { code, message } }, { status, headers: { 'cache-control': 'no-store' } });
}
export async function relay(request: Request, transport: typeof fetch = fetch, configuredOrigin = env.LEGACY_BACKEND_ORIGIN, clientAddress?: string, sessionDatabaseConfigured?:boolean): Promise<Response> {
  const input = new URL(request.url);
  if (!sameOriginMutation(request, input.origin)) return failure(403, 'FORBIDDEN', 'Cross-origin mutation requests are not allowed.');
  const methods = allowedMethods(input.pathname);
  if (!methods.length) return failure(404, 'NOT_FOUND', 'API route not found.');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { allow: [...methods, ...(methods.includes('GET') ? ['HEAD'] : []), 'OPTIONS'].join(', '), 'cache-control': 'no-store' } });
  if (!allowsRequest(input.pathname, request.method)) return failure(405, 'METHOD_NOT_ALLOWED', 'This method is not supported.');
  let upstream: URL;
  try { upstream = upstreamOrigin(configuredOrigin, input.origin); }
  catch { return failure(503, 'BACKEND_NOT_CONFIGURED', 'The application backend is not configured. Set LEGACY_BACKEND_ORIGIN to the authorized running Next.js backend origin and restart the Svelte server.'); }
  if (request.method === 'POST' && ['/api/auth/login','/api/platform/auth/login'].includes(input.pathname)) {
    try { sessionDatabaseConfigured ??= Boolean(sessionDatabaseURL(env)); }
    catch(cause){return failure(503,'SESSION_CONFIGURATION_INVALID',cause instanceof IntegrationConfigurationError?cause.message:'Session configuration could not be loaded.');}
    if(!sessionDatabaseConfigured)
    return failure(503, 'SESSION_DATABASE_NOT_CONFIGURED', 'Sign-in is unavailable. Supply DATABASE_URL for the existing database or opt in to SYMPHOWORK_REFERENCE_ENV_FILE, then restart the Svelte server.');
  }
  if (await invalidRelayInput(request)) return failure(400, 'VALIDATION_ERROR', 'Invalid request fields or identifier.');
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'range', 'idempotency-key']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  const cookie = sessionCookie(request); if (cookie) headers.set('cookie', cookie);
  if (clientAddress) headers.set('x-forwarded-for', clientAddress);
  headers.set('origin', upstream.origin);
  let response: Response;
  try {
    const init: RequestInit & { duplex?: string } = { method: request.method, headers, redirect: 'manual', cache: 'no-store', signal: request.signal };
    if (!['GET', 'HEAD'].includes(request.method)) { init.body = request.body; init.duplex = 'half'; }
    response = await transport(new URL(input.pathname + input.search, upstream), init);
  } catch { return failure(502, 'BACKEND_UNAVAILABLE', 'Unable to connect to the application backend.'); }
  const outgoing = new Headers({ 'cache-control': 'no-store' });
  for (const name of ['content-type', 'content-disposition', 'accept-ranges', 'content-range', 'retry-after']) {
    const value = response.headers.get(name); if (value) outgoing.set(name, value);
  }
  for (const cookie of response.headers.getSetCookie()) {
    if (cookie.startsWith(SESSION_COOKIE + '=')) outgoing.append('set-cookie', cookie.replace(/;\s*Domain=[^;]+/ig, ''));
  }
  const location = response.headers.get('location');
  if (location) {
    const target = new URL(location, upstream);
    if (target.origin !== upstream.origin) return failure(502, 'UNSAFE_REDIRECT', 'The backend returned an unsupported redirect.');
    outgoing.set('location', target.pathname + target.search + target.hash);
  }
  return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers: outgoing });
}
export async function legacyJSON<T>(request: Request, path: string): Promise<T> {
  const response = await relay(new Request(new URL(path, request.url), { headers: { cookie: sessionCookie(request) } }));
  const body = await response.json().catch(()=>null);
  if (!response.ok || body?.success !== true) error(response.ok ? 502 : response.status, body?.error?.message ?? 'Unable to load application data.');
  return body as T;
}

