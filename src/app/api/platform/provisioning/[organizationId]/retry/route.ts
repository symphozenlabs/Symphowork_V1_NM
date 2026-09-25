import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { retryProvisioning } from "@/modules/platform/operations";
export async function POST(_: Request, context: { params: Promise<{ organizationId: string }> }) { try { const user = await requireSession(); const { organizationId } = await context.params; return NextResponse.json({ success: true, ...await retryProvisioning(organizationId, user.id) }); } catch (error) { return errorResponse(error); } }
