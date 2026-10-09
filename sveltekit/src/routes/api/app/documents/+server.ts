import { AppError, errorResponse } from "@/lib/errors";
import { createEmployeeDocument, listEmployeeDocuments } from "@/modules/documents/service";
import { omitStorageKey } from "@/lib/storage";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      return { success: true, documents: await listEmployeeDocuments({ organizationId: tenant.organization.id, userId: user.id }) };
    }));
  } catch (cause) { return errorResponse(cause); }
};

export const POST: RequestHandler = async (event) => {
  try {
    return Response.json(await withSvelteRequestUser(event, async (user) => {
      const tenant = await resolveTenantContextForUser(user);
      if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
      const form = await event.request.formData();
      const file = form.get("file");
      const documentTypeId = String(form.get("documentTypeId") ?? "");
      if (!(file instanceof File) || !documentTypeId) throw new AppError("VALIDATION_ERROR", "A document type and file are required.", 400);
      const document = await createEmployeeDocument({
        organizationId: tenant.organization.id,
        userId: user.id,
        documentTypeId,
        fileName: file.name,
        mimeType: file.type,
        bytes: new Uint8Array(await file.arrayBuffer()),
        expiresAt: form.get("expiresAt")?.toString() || undefined,
        replacedDocumentId: form.get("replacedDocumentId")?.toString() || undefined
      });
      return { success: true, document: omitStorageKey(document) };
    }), { status: 201 });
  } catch (cause) { return errorResponse(cause); }
};
