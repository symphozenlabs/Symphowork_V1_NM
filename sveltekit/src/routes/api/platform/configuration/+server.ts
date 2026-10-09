import { errorResponse } from "@/lib/errors";
import { getPlatformConfiguration, setPlatformConfiguration } from "@/modules/platform/configuration";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async (event) => { try { return Response.json(await withPlatformRequest(event, async () => ({ success: true, configuration: await getPlatformConfiguration() }))); } catch (cause) { return errorResponse(cause); } };
export const PATCH: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, setting: await setPlatformConfiguration(input, user.id) }))); } catch (cause) { return errorResponse(cause); } };
