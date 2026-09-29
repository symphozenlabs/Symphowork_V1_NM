import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { changePassword, getSessionUser } from "@/modules/identity/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError("UNAUTHORIZED", "Please sign in.", 401);
    const body = (await request.json()) as { password?: string; confirmPassword?: string };
    if (!body.password || body.password !== body.confirmPassword) throw new AppError("VALIDATION_ERROR", "Passwords do not match.", 400);
    await changePassword(user.id, body.password);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
