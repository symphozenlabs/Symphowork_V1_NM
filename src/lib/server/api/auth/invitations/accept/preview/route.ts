import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { getInvitationPreview } from "@/modules/platform/invitations";

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const result = await getInvitationPreview(token);
    return NextResponse.json({ success: true, invitation: result });
  } catch (error) { return errorResponse(error); }
}
