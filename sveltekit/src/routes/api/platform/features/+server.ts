import { errorResponse } from "@/lib/errors";
import { listFeatureFlags, saveFeatureFlag } from "@/modules/platform/features";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, features: await listFeatureFlags(new URL(event.request.url).searchParams.get("query") ?? undefined) }))); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, feature: await saveFeatureFlag(input, user.id) })), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
