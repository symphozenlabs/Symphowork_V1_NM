import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { listSubscriptions, updateSubscription } from "@/modules/platform/commercial";
export async function GET(request: Request) { try { const url = new URL(request.url); return NextResponse.json({ success: true, subscriptions: await listSubscriptions({ query: url.searchParams.get("query") ?? undefined, status: url.searchParams.get("status") ?? undefined }) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await requireSession(); return NextResponse.json({ success: true, subscription: await updateSubscription(await request.json(), user.id) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
