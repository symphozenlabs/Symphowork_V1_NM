import { NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/errors";
import { verifyEmail } from "@/modules/identity/auth";
export async function POST(request: Request) { try { const body = (await request.json()) as { token?: string }; if (!body.token) throw new AppError("VALIDATION_ERROR", "A verification token is required.", 400); await verifyEmail(body.token); return NextResponse.json({ success: true }); } catch (error) { return errorResponse(error); } }
