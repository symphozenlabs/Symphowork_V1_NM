import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/chat/messages/[messageId]/task/route';

export const POST: RequestHandler = svelteEndpoint(handler.POST);
