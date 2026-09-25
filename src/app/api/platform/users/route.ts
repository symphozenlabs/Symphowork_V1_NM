import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { changePlatformRole, listPlatformUsers } from "@/modules/platform/operations";
import { requireSession } from "@/modules/identity/auth";
export async function GET() { try { return NextResponse.json({ success: true, users: await listPlatformUsers() }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request) { try { const actor = await requireSession(); const body = (await request.json()) as { userId?: string; platformRole?: string }; if (!body.userId || !body.platformRole) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "userId and platformRole are required." } }, { status: 400 }); return NextResponse.json({ success: true, user: await changePlatformRole(body.userId, body.platformRole, actor.id) }); } catch (error) { return errorResponse(error); } }
