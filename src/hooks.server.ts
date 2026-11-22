import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { resolveContext } from '$lib/server/context';
import { SESSION_COOKIE, sameOriginMutation } from '$lib/server/proxy-policy';
import { perfStorage, logPerf } from '$lib/server/perf-logger';
import { requestCacheStorage, createRequestCacheStore } from '$lib/server/compat/react';

export const handle: Handle = async ({ event, resolve }) => {
  const reqStart = performance.now();
  const reqId = crypto.randomUUID().slice(0, 8);
  const path = event.url.pathname;
  const method = event.request.method;

  return requestCacheStorage.run(createRequestCacheStore(), async () => {
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

      if (protectedPage || path.startsWith('/api/')) event.setHeaders({ 'cache-control': 'no-store' });

      if (protectedPage) {
        const authStart = performance.now();
        event.locals.context = resolveContext(event.cookies.get(SESSION_COOKIE));
        const context = await event.locals.context;
        const authMs = performance.now() - authStart;
        logPerf('AUTH', 'session-resolution', authMs, context ? 'VALID' : 'NONE', 200);

        if (context) {
          const store = requestCacheStorage.getStore();
          if (store) {
            store.sharedData.set('svelteContext', context);
          }
        }

        if (!context) redirect(303, path.startsWith('/platform') ? '/platform/login' : '/login');
        if (path.startsWith('/platform') && context.user.platformRole === 'NONE') redirect(303, '/app');
        if (path.startsWith('/app') && !context.organization) redirect(303, '/platform');
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
  });
};
