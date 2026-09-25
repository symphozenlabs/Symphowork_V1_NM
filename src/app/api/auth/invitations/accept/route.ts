import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { acceptInvitation } from "@/modules/platform/invitations";
import { createSession, getSessionUser, setSessionCookie } from "@/modules/identity/auth";
export async function POST(request: Request) { try { const currentUser = await getSessionUser(); const result = await acceptInvitation({ ...(await request.json()), currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null }); if (!currentUser) { const session = await createSession(result.user.id); await setSessionCookie(session.token, session.expiresAt); } return NextResponse.json({ success: true, userId: result.user.id, organizationId: result.membership.organizationId }); } catch (error) { return errorResponse(error); } }
