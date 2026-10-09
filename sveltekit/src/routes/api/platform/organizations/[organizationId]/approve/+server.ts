import { errorResponse } from "@/lib/errors";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { changeOrganizationStatus, retryProvisioning } from "@/modules/platform/operations";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const POST: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async (user) => { await authorizePlatform(PLATFORM_PERMISSIONS.organizationSuspend); const organization = await changeOrganizationStatus(event.params.organizationId, "active", user.id); const provisioning = await retryProvisioning(event.params.organizationId, user.id); return { success: true, organization, provisioning }; })); } catch (cause) { return errorResponse(cause); } };
