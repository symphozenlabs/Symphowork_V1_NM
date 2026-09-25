import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { getPlanFeatures, savePlan, setPlanFeatures } from "@/modules/platform/commercial";
export async function GET(_: Request, context: { params: Promise<{ planId: string }> }) { try { const { planId } = await context.params; return NextResponse.json({ success: true, features: await getPlanFeatures(planId) }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, context: { params: Promise<{ planId: string }> }) { try { const user = await requireSession(); const { planId } = await context.params; return NextResponse.json({ success: true, plan: await savePlan(await request.json(), user.id, planId) }); } catch (error) { return errorResponse(error); } }
export async function PUT(request: Request, context: { params: Promise<{ planId: string }> }) { try { const user = await requireSession(); const { planId } = await context.params; const body = await request.json(); return NextResponse.json({ success: true, feature: await setPlanFeatures({ ...body, planId }, user.id) }); } catch (error) { return errorResponse(error); } }
