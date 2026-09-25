import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listProvisioningJobs } from "@/modules/platform/operations";
export async function GET() { try { return NextResponse.json({ success: true, jobs: await listProvisioningJobs() }); } catch (error) { return errorResponse(error); } }
