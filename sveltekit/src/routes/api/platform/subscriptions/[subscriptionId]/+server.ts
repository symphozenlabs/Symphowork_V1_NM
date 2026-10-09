import { errorResponse } from "@/lib/errors";
import { updateSubscription } from "@/modules/platform/commercial";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const PATCH: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, subscription: await updateSubscription(input, user.id, event.params.subscriptionId) }))); } catch (cause) { return errorResponse(cause); } };
