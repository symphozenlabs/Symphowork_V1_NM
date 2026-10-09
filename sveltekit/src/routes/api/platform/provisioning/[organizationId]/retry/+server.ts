import { errorResponse } from "@/lib/errors";
import { retryProvisioning } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json().catch(() => ({})) as { primaryAdminEmail?: string }; return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, ...(await retryProvisioning(event.params.organizationId, user.id, body.primaryAdminEmail)) }))); } catch (cause) { return errorResponse(cause); } };
