import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { errorResponse } from '@/lib/errors';
import { resolveContext } from '$lib/server/context';
import { SESSION_COOKIE, sameOriginMutation } from '$lib/server/proxy-policy';
import { perfStorage, logPerf } from '$lib/server/perf-logger';
import { createRequestCacheStore } from '@/lib/server/request-cache';

export const handle: Handle = async ({ event, resolve }) => {
  const reqStart = performance.now();
  const reqId = crypto.randomUUID().slice(0, 8);
  const path = event.url.pathname;
  const method = event.request.method;

  event.locals.requestCache = createRequestCacheStore();
  return perfStorage.run({ reqId, url: path, method, startTime: reqStart }, async () => {
      if (!sameOriginMutation(event.request, event.url.origin)) {
        return Response.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cross-origin mutation requests are not allowed.' } }, { status: 403 });
      }

      const security = {
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'DENY',
        'permissions-policy': 'camera=(), microphone=(self), geolocation=()',
        'x-request-id': reqId
      };
      event.setHeaders(security);

      const protectedPage = path === '/change-password' || path === '/app' || path.startsWith('/app/') ||
        ((path === '/platform' || path.startsWith('/platform/')) && path !== '/platform/login');
      const protectedApi = path.startsWith('/api/app/');

      if (protectedPage || path.startsWith('/api/')) event.setHeaders({ 'cache-control': 'no-store' });

      if (protectedPage || protectedApi) {
        const authStart = performance.now();
        event.locals.context = resolveContext(event.cookies.get(SESSION_COOKIE));
        let context: Awaited<ReturnType<typeof resolveContext>> = null;
        try {
          context = await event.locals.context;
        } catch (cause) {
          if (!protectedApi) throw cause;
          const response = errorResponse(cause);
          logPerf('AUTH', 'session-resolution', performance.now() - authStart, 'ERROR', response.status);
          for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
          response.headers.set('cache-control', 'no-store');
          if (event.url.protocol === 'https:') response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
          return response;
        }
        const authMs = performance.now() - authStart;
        logPerf('AUTH', 'session-resolution', authMs, context ? 'VALID' : 'NONE', 200);

        if (context) {
          const store = event.locals.requestCache;
          if (store) {
            store.sharedData.set('svelteContext', context);
          }
        }

        if (!context && protectedPage) redirect(303, path.startsWith('/platform') ? '/platform/login' : '/login');
        if (protectedPage && path.startsWith('/platform') && context?.user.platformRole === 'NONE') redirect(303, '/app');
        if (protectedPage && path.startsWith('/app') && context && !context.organization) redirect(303, '/platform');
      }

    const response = await resolve(event);
    for (const [name, value] of Object.entries(security)) response.headers.set(name, value);
    if (event.url.protocol === 'https:') response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    response.headers.set('x-frame-options', 'DENY');
    if (protectedPage || path.startsWith('/api/')) response.headers.set('cache-control', 'no-store');

    const totalMs = performance.now() - reqStart;
    logPerf(method, path, totalMs, response.status, 500);

    return response;
    });
};
