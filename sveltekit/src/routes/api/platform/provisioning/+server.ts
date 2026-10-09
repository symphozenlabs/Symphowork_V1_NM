import { errorResponse } from "@/lib/errors";
import { listProvisioningJobs } from "@/modules/platform/operations";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try { return Response.json(await withSvelteRequestUser(event, async () => ({ success: true, jobs: await listProvisioningJobs() }))); }
  catch (cause) { return errorResponse(cause); }
};
