import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { registerUser } from "@/modules/identity/auth";
import { registrationInputSchema } from "@/modules/platform/validation";

export async function POST(request: Request) {
  try { const input = registrationInputSchema.parse(await request.json()); const result = await registerUser(input); return NextResponse.json({ success: true, user: { id: result.user.id, email: result.user.email }, verificationRequired: true }); } catch (error) { return errorResponse(error); }
}
