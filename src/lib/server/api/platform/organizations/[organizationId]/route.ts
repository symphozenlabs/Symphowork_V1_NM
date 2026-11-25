import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { deletePlatformOrganization, getPlatformOrganization } from "@/modules/platform/operations";

export async function GET(_: Request, context: { params: { organizationId: string } }) {
  try {
    const { organizationId } = context.params;
    return Response.json({ success: true, ...(await getPlatformOrganization(organizationId)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: { organizationId: string } }) {
  try {
    const user = await requireSession();
    const { organizationId } = context.params;
    const result = await deletePlatformOrganization(organizationId, user.id);
    return Response.json({ success: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

