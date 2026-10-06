import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { changeOrganizationStatus } from "@/modules/platform/operations";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  try {
    const user = await requireSession();
    const { organizationId } = await context.params;
    const body = (await request.json()) as { status?: string };
    const organization = await changeOrganizationStatus(organizationId, body.status ?? "", user.id);
    revalidatePath(`/platform/organizations/${organizationId}`);
    return NextResponse.json({ success: true, organization });
  } catch (error) {
    return errorResponse(error);
  }
}
