import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { resetPassword } from "@/modules/identity/auth";
export async function POST(request: Request) { try { const body = (await request.json()) as { token?: string; password?: string }; if (!body.token || !body.password) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Token and password are required." } }, { status: 400 }); await resetPassword(body.token, body.password); return NextResponse.json({ success: true }); } catch (error) { return errorResponse(error); } }
