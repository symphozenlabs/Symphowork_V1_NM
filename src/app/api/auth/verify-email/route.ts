import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { verifyEmail } from "@/modules/identity/auth";
export async function POST(request: Request) { try { const body = (await request.json()) as { token?: string }; if (!body.token) throw new Error("missing token"); await verifyEmail(body.token); return NextResponse.json({ success: true }); } catch (error) { return errorResponse(error); } }
