import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { acceptInvitation } from "@/modules/platform/invitations";
export async function POST(request: Request) { try { const result = await acceptInvitation(await request.json()); return NextResponse.json({ success: true, userId: result.user.id, organizationId: result.membership.organizationId }); } catch (error) { return errorResponse(error); } }
