import { errorResponse } from "@/lib/errors";
import { getPlanFeatures, savePlan, setPlanFeatures } from "@/modules/platform/commercial";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, features: await getPlanFeatures(event.params.planId) }))); } catch (cause) { return errorResponse(cause); } };
export const PATCH: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, plan: await savePlan(input, user.id, event.params.planId) }))); } catch (cause) { return errorResponse(cause); } };
export const PUT: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, feature: await setPlanFeatures({ ...input, planId: event.params.planId }, user.id) }))); } catch (cause) { return errorResponse(cause); } };
