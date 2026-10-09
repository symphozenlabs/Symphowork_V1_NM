import { AppError, errorResponse } from "@/lib/errors";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listPlatformOrganizations } from "@/modules/platform/operations";
import { createOrganization } from "@/modules/platform/provisioning";
import { organizationInputSchema } from "@/modules/platform/validation";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    const url = new URL(event.request.url);
    return Response.json(await withSvelteRequestUser(event, async () => {
      const result = await listPlatformOrganizations({ page: Number(url.searchParams.get("page") ?? "1"), pageSize: Number(url.searchParams.get("pageSize") ?? "20"), query: url.searchParams.get("query") ?? undefined, status: url.searchParams.get("status") ?? undefined });
      return { success: true, ...result, organizations: result.rows };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const input = organizationInputSchema.parse(await event.request.json());
    return Response.json(await withSvelteRequestUser(event, async () => {
      const user = await authorizePlatform(PLATFORM_PERMISSIONS.organizationCreate);
      const result = await createOrganization(input, user.id);
      return { success: true, organization: result.organization, provisioningJob: result.job };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
