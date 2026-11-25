import { errorResponse } from "@/lib/errors";
import { listProvisioningJobs } from "@/modules/platform/operations";
export async function GET() { try { return Response.json({ success: true, jobs: await listProvisioningJobs() }); } catch (error) { return errorResponse(error); } }
