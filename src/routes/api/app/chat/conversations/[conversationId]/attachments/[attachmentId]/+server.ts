import type { RequestHandler } from './$types';
import { svelteEndpoint } from '$lib/server/endpoint';
import * as handler from '$lib/server/api/app/chat/conversations/[conversationId]/attachments/[attachmentId]/route';

export const GET: RequestHandler = svelteEndpoint(handler.GET);
