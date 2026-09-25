import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { getPlatformOrganization } from "@/modules/platform/operations";
export async function GET(_: Request, context: { params: Promise<{ organizationId: string }> }) { try { const { organizationId } = await context.params; return NextResponse.json({ success: true, ...await getPlatformOrganization(organizationId) }); } catch (error) { return errorResponse(error); } }
