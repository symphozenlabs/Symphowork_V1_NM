import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/employees/[employeeId]/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
export const PATCH: RequestHandler = svelteEndpoint(handler.PATCH);
