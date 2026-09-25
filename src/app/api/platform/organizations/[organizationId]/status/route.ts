import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { changeOrganizationStatus } from "@/modules/platform/operations";
export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) { try { const user = await requireSession(); const { organizationId } = await context.params; const body = (await request.json()) as { status?: string }; return NextResponse.json({ success: true, organization: await changeOrganizationStatus(organizationId, body.status ?? "", user.id) }); } catch (error) { return errorResponse(error); } }
