import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/platform/organizations/[organizationId]/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
export const DELETE: RequestHandler = svelteEndpoint(handler.DELETE);
