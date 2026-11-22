import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/tasks/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
export const POST: RequestHandler = svelteEndpoint(handler.POST);
