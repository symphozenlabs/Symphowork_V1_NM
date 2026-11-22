import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/platform/features/[featureId]/route';

export const PATCH: RequestHandler = svelteEndpoint(handler.PATCH);
