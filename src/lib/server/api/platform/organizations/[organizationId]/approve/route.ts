import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { authorizePlatform, authorizePlatformTargetOrganization, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { changeOrganizationStatus, retryProvisioning } from "@/modules/platform/operations";
import { withPlatformTransaction } from "@/db/client";
import { provisioningJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_: Request, context: { params: { organizationId: string } }) {
  try {
    const user = await requireSession();
    await authorizePlatform(PLATFORM_PERMISSIONS.organizationSuspend);
    const { organizationId } = context.params;

    const { organization: currentOrg } = await authorizePlatformTargetOrganization({
      organizationId,
      permission: PLATFORM_PERMISSIONS.organizationSuspend,
      action: "organization_approval",
    });

    let organization = currentOrg;
    if (currentOrg.status === "pending") {
      organization = await changeOrganizationStatus(organizationId, "active", user.id);
    } else if (currentOrg.status !== "active") {
      organization = await changeOrganizationStatus(organizationId, "active", user.id);
    }

    const job = await withPlatformTransaction((tx) =>
      tx.query.provisioningJobs.findFirst({ where: eq(provisioningJobs.organizationId, organizationId) })
    );

    let provisioning;
    if (job && job.status === "completed") {
      provisioning = {
        job,
        invitation: { status: "already_exists", delivery: "not_configured" as const },
      };
    } else {
      provisioning = await retryProvisioning(organizationId, user.id);
    }

    return Response.json({ success: true, organization, provisioning });
  } catch (error) {
    return errorResponse(error);
  }
}
