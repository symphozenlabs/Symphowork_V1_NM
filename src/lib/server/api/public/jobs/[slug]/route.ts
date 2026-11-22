import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { publicJobBySlug } from "@/modules/ats/service";
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) { try { const { slug } = await context.params; const result = await publicJobBySlug(slug); return NextResponse.json({ success: true, job: { ...result.job, organizationId: undefined, requisitionId: undefined, status: undefined } }); } catch (error) { return errorResponse(error); } }
