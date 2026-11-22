import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/platform/plans/[planId]/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
export const PUT: RequestHandler = svelteEndpoint(handler.PUT);
export const PATCH: RequestHandler = svelteEndpoint(handler.PATCH);
export const DELETE: RequestHandler = svelteEndpoint(handler.DELETE);
