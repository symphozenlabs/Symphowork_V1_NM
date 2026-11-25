import { errorResponse } from "@/lib/errors";
import { publicJobBySlug } from "@/modules/ats/service";
export async function GET(_request: Request, context: { params: { slug: string } }) { try { const { slug } = context.params; const result = await publicJobBySlug(slug); return Response.json({ success: true, job: { ...result.job, organizationId: undefined, requisitionId: undefined, status: undefined } }); } catch (error) { return errorResponse(error); } }
