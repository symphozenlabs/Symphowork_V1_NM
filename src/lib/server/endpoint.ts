import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { logPerf } from './perf-logger';

export type ApiOperation = (
  request: Request,
  context: { params: Record<string, string> }
) => Promise<Response> | Response;

export function svelteEndpoint(handler?: ApiOperation): RequestHandler {
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
  handler: ApiOperation
): Promise<Response> {
  const epStart = performance.now();
  try {
    const response = await handler(event.request, event);
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
