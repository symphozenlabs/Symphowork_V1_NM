import { errorResponse } from "@/lib/errors";
import { changePlatformRole, listPlatformUsers } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import { AppError } from "@/lib/errors";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, users: await listPlatformUsers() }))); } catch (cause) { return errorResponse(cause); } };
export const PATCH: RequestHandler = async (event) => { try { const body = await event.request.json() as { userId?: string; platformRole?: string }; if (!body.userId || !body.platformRole) throw new AppError("VALIDATION_ERROR", "userId and platformRole are required.", 400); return Response.json(await withPlatformRequest(event, async (actor) => ({ success: true, user: await changePlatformRole(body.userId!, body.platformRole!, actor.id) }))); } catch (cause) { return errorResponse(cause); } };
