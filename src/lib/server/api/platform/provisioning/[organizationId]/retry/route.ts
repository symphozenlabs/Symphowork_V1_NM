import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { retryProvisioning } from "@/modules/platform/operations";
export async function POST(request: Request, context: { params: { organizationId: string } }) { try { const user = await requireSession(); const { organizationId } = context.params; const body = await request.json().catch(() => ({})) as { primaryAdminEmail?: string }; return Response.json({ success: true, ...await retryProvisioning(organizationId, user.id, body.primaryAdminEmail) }); } catch (error) { return errorResponse(error); } }
