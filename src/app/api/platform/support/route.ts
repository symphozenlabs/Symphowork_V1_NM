import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { createSupportNote, getSupportSummary, listSupportNotes, searchSupportOrganizations } from "@/modules/platform/support";
export async function GET(request: Request) { try { const url = new URL(request.url); const organizationId = url.searchParams.get("organizationId"); if (organizationId) return NextResponse.json({ success: true, summary: await getSupportSummary(organizationId), notes: await listSupportNotes(organizationId) }); return NextResponse.json({ success: true, organizations: await searchSupportOrganizations(url.searchParams.get("query") ?? undefined) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await requireSession(); return NextResponse.json({ success: true, note: await createSupportNote(await request.json(), user.id) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
