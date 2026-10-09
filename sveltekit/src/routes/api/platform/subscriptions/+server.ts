import { errorResponse } from "@/lib/errors";
import { listSubscriptions, updateSubscription } from "@/modules/platform/commercial";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { const url = new URL(event.request.url); return Response.json(await withPlatformRequest(event, async () => ({ success: true, subscriptions: await listSubscriptions({ query: url.searchParams.get("query") ?? undefined, status: url.searchParams.get("status") ?? undefined }) }))); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, subscription: await updateSubscription(input, user.id) })), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
