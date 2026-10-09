import { errorResponse } from "@/lib/errors";
import { getPlatformOrganization } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, ...(await getPlatformOrganization(event.params.organizationId)) }))); } catch (cause) { return errorResponse(cause); } };
