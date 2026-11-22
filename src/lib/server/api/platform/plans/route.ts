import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { listPlans, savePlan } from "@/modules/platform/commercial";
export async function GET() { try { return NextResponse.json({ success: true, plans: await listPlans() }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await requireSession(); return NextResponse.json({ success: true, plan: await savePlan(await request.json(), user.id) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
