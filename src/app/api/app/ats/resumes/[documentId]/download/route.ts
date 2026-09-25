import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getResumeDownload } from "@/modules/resume-intelligence/service";
export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }) { try { const tenant = await resolveTenantContext(); if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403); const { documentId } = await context.params; const result = await getResumeDownload({ organizationId: tenant.organization.id, userId: tenant.user.id, documentId }); return NextResponse.json({ success: true, url: result.url, document: { id: result.document.id, fileName: result.document.fileName, parsingStatus: result.document.parsingStatus } }); } catch (error) { return errorResponse(error); } }
