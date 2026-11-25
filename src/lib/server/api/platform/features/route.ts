import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { listFeatureFlags, saveFeatureFlag } from "@/modules/platform/features";
export async function GET(request: Request) { try { return Response.json({ success: true, features: await listFeatureFlags(new URL(request.url).searchParams.get("query") ?? undefined) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await requireSession(); return Response.json({ success: true, feature: await saveFeatureFlag(await request.json(), user.id) }, { status: 201 }); } catch (error) { return errorResponse(error); } }
