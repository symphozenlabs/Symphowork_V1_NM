import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { saveFeatureFlag } from "@/modules/platform/features";
export async function PATCH(request: Request, context: { params: { featureId: string } }) { try { const user = await requireSession(); const { featureId } = context.params; return Response.json({ success: true, feature: await saveFeatureFlag(await request.json(), user.id, featureId) }); } catch (error) { return errorResponse(error); } }
