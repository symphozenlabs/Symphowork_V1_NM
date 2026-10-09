import { errorResponse } from "@/lib/errors";
import { createSupportNote, getSupportSummary, listSupportNotes, searchSupportOrganizations } from "@/modules/platform/support";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { const url = new URL(event.request.url); const organizationId = url.searchParams.get("organizationId"); return Response.json(await withPlatformRequest(event, async () => organizationId ? { success: true, summary: await getSupportSummary(organizationId), notes: await listSupportNotes(organizationId) } : { success: true, organizations: await searchSupportOrganizations(url.searchParams.get("query") ?? undefined) })); } catch (cause) { return errorResponse(cause); } };
export const POST: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, note: await createSupportNote(input, user.id) })), { status: 201 }); } catch (cause) { return errorResponse(cause); } };
