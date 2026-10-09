import { errorResponse } from "@/lib/errors";
import { listOrganizationUsage } from "@/modules/platform/commercial";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, usage: await listOrganizationUsage() }))); } catch (cause) { return errorResponse(cause); } };
