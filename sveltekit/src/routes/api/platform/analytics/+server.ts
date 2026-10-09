import { errorResponse } from "@/lib/errors";
import { getPlatformAnalytics, type AnalyticsWindow } from "@/modules/platform/analytics";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { const days = Number(new URL(event.request.url).searchParams.get("days") ?? "30"); const window = ([1, 7, 30, 90] as number[]).includes(days) ? days as AnalyticsWindow : 30; return Response.json(await withPlatformRequest(event, async () => ({ success: true, analytics: await getPlatformAnalytics(window) }))); } catch (cause) { return errorResponse(cause); } };
