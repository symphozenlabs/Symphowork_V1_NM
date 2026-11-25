import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { updateSubscription } from "@/modules/platform/commercial";
export async function PATCH(request: Request, context: { params: { subscriptionId: string } }) { try { const user = await requireSession(); const { subscriptionId } = context.params; return Response.json({ success: true, subscription: await updateSubscription(await request.json(), user.id, subscriptionId) }); } catch (error) { return errorResponse(error); } }
