import { errorResponse } from "@/lib/errors";
import { changeOrganizationStatus } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const POST: RequestHandler = async (event) => { try { const body = await event.request.json() as { status?: string }; return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, organization: await changeOrganizationStatus(event.params.organizationId, body.status ?? "", user.id) }))); } catch (cause) { return errorResponse(cause); } };
