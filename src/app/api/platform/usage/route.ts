import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listOrganizationUsage } from "@/modules/platform/commercial";
export async function GET() { try { return NextResponse.json({ success: true, usage: await listOrganizationUsage() }); } catch (error) { return errorResponse(error); } }
