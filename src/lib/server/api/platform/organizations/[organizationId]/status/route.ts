import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { changeOrganizationStatus } from "@/modules/platform/operations";

export async function POST(request: Request, context: { params: { organizationId: string } }) {
  try {
    const user = await requireSession();
    const { organizationId } = context.params;
    const body = (await request.json()) as { status?: string };
    const organization = await changeOrganizationStatus(organizationId, body.status ?? "", user.id);
    return Response.json({ success: true, organization });
  } catch (error) {
    return errorResponse(error);
  }
}
