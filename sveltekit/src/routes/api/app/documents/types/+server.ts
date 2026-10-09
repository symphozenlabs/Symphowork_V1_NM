import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { documentTypes } from "@/db/schema";
import { AppError, errorResponse } from "@/lib/errors";
import { authorize } from "@/modules/tenancy/authorization";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      await authorize({ organizationId: tenant.organization.id, permission: "document.read" });
      return { success: true, types: await db.select().from(documentTypes).where(and(eq(documentTypes.organizationId, tenant.organization.id), eq(documentTypes.active, true))) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    const body = await event.request.json() as { name?: string; code?: string; category?: string; required?: boolean; expiryApplicable?: boolean; verificationRequired?: boolean };
    if (!body.name || !body.code) throw new AppError("VALIDATION_ERROR", "Document type name and code are required.", 400);
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      await authorize({ organizationId: tenant.organization.id, permission: "document.manage" });
      const [type] = await db.insert(documentTypes).values({ organizationId: tenant.organization.id, name: body.name!.trim(), code: body.code!.trim().toUpperCase(), category: body.category ?? "other", required: Boolean(body.required), expiryApplicable: Boolean(body.expiryApplicable), verificationRequired: body.verificationRequired ?? true }).returning();
      return { success: true, type };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
