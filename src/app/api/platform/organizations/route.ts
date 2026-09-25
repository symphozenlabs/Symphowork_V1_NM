import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { errorResponse } from "@/lib/errors";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { createOrganization } from "@/modules/platform/provisioning";
import { organizationInputSchema } from "@/modules/platform/validation";
export async function GET() { try { await authorizePlatform(PLATFORM_PERMISSIONS.organizationView); return NextResponse.json({ success: true, organizations: await db.select().from(organizations).orderBy(desc(organizations.createdAt)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await authorizePlatform(PLATFORM_PERMISSIONS.organizationCreate); const result = await createOrganization(organizationInputSchema.parse(await request.json()), user.id); return NextResponse.json({ success: true, organization: result.organization, provisioningJob: result.job }, { status: 201 }); } catch (error) { return errorResponse(error); } }
