import { errorResponse } from "@/lib/errors";
import { dev } from "$app/environment";
import { requireSession } from "@/modules/identity/auth";
import { resendOrganizationInvitation } from "@/modules/platform/operations";
export async function POST(request: Request, context: { params: { organizationId: string } }) { try { const user = await requireSession(); const { organizationId } = context.params; const baseUrl = dev ? new URL(request.url).origin : undefined; return Response.json({ success: true, ...await resendOrganizationInvitation(organizationId, user.id, baseUrl) }); } catch (error) { return errorResponse(error); } }
