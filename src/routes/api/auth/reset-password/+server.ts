import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/auth/reset-password/route';

export const POST: RequestHandler = svelteEndpoint(handler.POST);
