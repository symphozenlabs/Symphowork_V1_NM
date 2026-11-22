import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { retryProvisioning } from "@/modules/platform/operations";
export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) { try { const user = await requireSession(); const { organizationId } = await context.params; const body = await request.json().catch(() => ({})) as { primaryAdminEmail?: string }; return NextResponse.json({ success: true, ...await retryProvisioning(organizationId, user.id, body.primaryAdminEmail) }); } catch (error) { return errorResponse(error); } }
