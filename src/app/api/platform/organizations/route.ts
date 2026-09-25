import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listPlatformOrganizations } from "@/modules/platform/operations";
import { createOrganization } from "@/modules/platform/provisioning";
import { organizationInputSchema } from "@/modules/platform/validation";
export async function GET(request: Request) { try { const url = new URL(request.url); const result = await listPlatformOrganizations({ page: Number(url.searchParams.get("page") ?? "1"), pageSize: Number(url.searchParams.get("pageSize") ?? "20"), query: url.searchParams.get("query") ?? undefined, status: url.searchParams.get("status") ?? undefined }); return NextResponse.json({ success: true, ...result, organizations: result.rows }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await authorizePlatform(PLATFORM_PERMISSIONS.organizationCreate); const result = await createOrganization(organizationInputSchema.parse(await request.json()), user.id); return NextResponse.json({ success: true, organization: result.organization, provisioningJob: result.job }, { status: 201 }); } catch (error) { return errorResponse(error); } }
