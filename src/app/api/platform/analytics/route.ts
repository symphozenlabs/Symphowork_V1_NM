import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { getPlatformAnalytics, type AnalyticsWindow } from "@/modules/platform/analytics";
export async function GET(request: Request) { try { const days = Number(new URL(request.url).searchParams.get("days") ?? "30"); const window = ([1, 7, 30, 90] as number[]).includes(days) ? days as AnalyticsWindow : 30; return NextResponse.json({ success: true, analytics: await getPlatformAnalytics(window) }); } catch (error) { return errorResponse(error); } }
