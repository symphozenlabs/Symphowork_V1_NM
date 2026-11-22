import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { listPlatformAudit } from "@/modules/platform/operations";
export async function GET(request: Request) { try { const url = new URL(request.url); const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined; const pageSize = url.searchParams.get("pageSize") ? Number(url.searchParams.get("pageSize")) : undefined; const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? undefined; const result = await listPlatformAudit({ query, page, pageSize }); return NextResponse.json({ success: true, ...result, events: result.rows }); } catch (error) { return errorResponse(error); } }
