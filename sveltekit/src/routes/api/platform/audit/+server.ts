import { errorResponse } from "@/lib/errors";
import { listPlatformAudit } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, events: await listPlatformAudit() }))); } catch (cause) { return errorResponse(cause); } };
