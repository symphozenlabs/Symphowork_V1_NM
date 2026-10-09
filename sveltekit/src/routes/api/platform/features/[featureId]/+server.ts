import { errorResponse } from "@/lib/errors";
import { saveFeatureFlag } from "@/modules/platform/features";
import { withPlatformRequest } from "$lib/server/platform-context";
import type { RequestHandler } from "./$types";
export const PATCH: RequestHandler = async (event) => { try { const input = await event.request.json(); return Response.json(await withPlatformRequest(event, async (user) => ({ success: true, feature: await saveFeatureFlag(input, user.id, event.params.featureId) }))); } catch (cause) { return errorResponse(cause); } };
