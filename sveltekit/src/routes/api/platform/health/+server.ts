import { errorResponse } from "@/lib/errors";
import { getPlatformHealth } from "@/modules/platform/health";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, health: await getPlatformHealth() }))); } catch (cause) { return errorResponse(cause); } };
