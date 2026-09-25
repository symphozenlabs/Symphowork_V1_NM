import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { getPlatformConfiguration, setPlatformConfiguration } from "@/modules/platform/configuration";
export async function GET() { try { return NextResponse.json({ success: true, configuration: await getPlatformConfiguration() }); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request) { try { const user = await requireSession(); return NextResponse.json({ success: true, setting: await setPlatformConfiguration(await request.json(), user.id) }); } catch (error) { return errorResponse(error); } }
