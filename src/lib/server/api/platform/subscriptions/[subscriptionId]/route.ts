import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { updateSubscription } from "@/modules/platform/commercial";
export async function PATCH(request: Request, context: { params: Promise<{ subscriptionId: string }> }) { try { const user = await requireSession(); const { subscriptionId } = await context.params; return NextResponse.json({ success: true, subscription: await updateSubscription(await request.json(), user.id, subscriptionId) }); } catch (error) { return errorResponse(error); } }
