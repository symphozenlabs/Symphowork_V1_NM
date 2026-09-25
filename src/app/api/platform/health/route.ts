import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { getPlatformHealth } from "@/modules/platform/health";
export async function GET() { try { return NextResponse.json({ success: true, health: await getPlatformHealth() }); } catch (error) { return errorResponse(error); } }
