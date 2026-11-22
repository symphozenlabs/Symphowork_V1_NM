import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { requestCookieStorage, type CookieStore } from './compat/headers';
import { logPerf } from './perf-logger';
import { requestCacheStorage, createRequestCacheStore } from './compat/react';

export type NextRouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response;

export function svelteEndpoint(handler?: NextRouteHandler): RequestHandler {
  return async (event: RequestEvent) => {
    if (!handler) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: 'This method is not supported.' }
        }),
        {
          status: 405,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
        }
      );
    }
    return handleSvelteKitRoute(event, handler);
  };
}

export async function handleSvelteKitRoute(
  event: RequestEvent,
  handler: NextRouteHandler
): Promise<Response> {
  const cookieStore: CookieStore = {
    get(name: string) {
      const val = event.cookies.get(name);
      if (val === undefined) return undefined;
      return { name, value: val };
    },
    set(name: string, value: string, options?: any) {
      event.cookies.set(name, value, {
        path: options?.path ?? '/',
        httpOnly: options?.httpOnly ?? true,
        secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
        sameSite: options?.sameSite ?? 'lax',
        maxAge: options?.maxAge,
        expires: options?.expires
      });
    },
    delete(name: string, options?: any) {
      event.cookies.delete(name, {
        path: options?.path ?? '/'
      });
    }
  };

  const context = {
    params: Promise.resolve(event.params as Record<string, string>)
  };

  const epStart = performance.now();
  try {
    const runHandler = async () => {
      return await requestCookieStorage.run(cookieStore, async () => {
        return await handler(event.request, context);
      });
    };

    const response = requestCacheStorage.getStore()
      ? await runHandler()
      : await requestCacheStorage.run(createRequestCacheStore(), runHandler);
    const epDuration = performance.now() - epStart;
    logPerf('API', `${event.request.method} ${event.url.pathname}`, epDuration, response.status, 250);
    return response;
  } catch (error) {
    console.error('Unhandled API endpoint error; details withheld.', error instanceof Error ? error.name : 'UnknownError');
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' }
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
      }
    );
  }
}
