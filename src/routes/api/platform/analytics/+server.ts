import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/platform/analytics/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
