import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { errorResponse, AppError } from "@/lib/errors";
import { requireSession } from "@/modules/identity/auth";
import { createOrganization } from "@/modules/platform/provisioning";
import { organizationInputSchema } from "@/modules/platform/validation";
import { desc } from "drizzle-orm";

export async function GET() { try { const user = await requireSession(); if (user.platformRole !== "PLATFORM_OWNER") throw new AppError("FORBIDDEN", "Platform Owner access is required.", 403); return NextResponse.json({ success: true, organizations: await db.select().from(organizations).orderBy(desc(organizations.createdAt)) }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request) { try { const user = await requireSession(); if (user.platformRole !== "PLATFORM_OWNER") throw new AppError("FORBIDDEN", "Platform Owner access is required.", 403); const input = organizationInputSchema.parse(await request.json()); const result = await createOrganization(input, user.id); return NextResponse.json({ success: true, organization: result.organization, provisioningJob: result.job }, { status: 201 }); } catch (error) { return errorResponse(error); } }
