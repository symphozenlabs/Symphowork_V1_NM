import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/employees/[employeeId]/invite/revoke/route';

export const POST: RequestHandler = svelteEndpoint(handler.POST);
