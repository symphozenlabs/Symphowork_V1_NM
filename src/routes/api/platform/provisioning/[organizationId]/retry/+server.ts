import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/platform/provisioning/[organizationId]/retry/route';

export const POST: RequestHandler = svelteEndpoint(handler.POST);
