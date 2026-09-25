import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listPlatformAudit } from "@/modules/platform/operations";
export async function GET() { try { return NextResponse.json({ success: true, events: await listPlatformAudit() }); } catch (error) { return errorResponse(error); } }
