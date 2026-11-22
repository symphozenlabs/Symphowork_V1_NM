import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/departments/[departmentId]/teams/[teamId]/route';

export const PATCH: RequestHandler = svelteEndpoint(handler.PATCH);
export const DELETE: RequestHandler = svelteEndpoint(handler.DELETE);
