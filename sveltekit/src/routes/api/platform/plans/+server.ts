import { errorResponse } from "@/lib/errors";
import { listPlans, savePlan } from "@/modules/platform/commercial";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, plans: await listPlans() }))); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, plan: await savePlan(input, user.id) })), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
