import { requireSession } from "@/modules/identity/auth";
import { withPlatformTransaction } from "@/db/client";
import { recordAuditInTransaction } from "@/lib/audit";
import { ZodError } from "zod";
import type { RequestEvent, RequestHandler } from "@sveltejs/kit";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import {
  authorizeSupportCommunication,
  PLATFORM_COMMUNICATION_PERMISSIONS,
} from "@/modules/platform/authorization";

export async function staffIdentity() {
  const { user, organization, role } = await resolveTenantContext();
  if (!organization || !role)
    throw new AppError(
      "FORBIDDEN",
      "Organization membership is required.",
      403,
    );
  return {
    userId: user.id,
    submitterUserId: user.id,
    submitterName: user.fullName,
    submitterEmail: user.email,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationRole: role.key,
    userRole: role.key,
  };
}
export function endpoint(
  operation: (event: RequestEvent) => Promise<unknown>,
  permission?: (typeof PLATFORM_COMMUNICATION_PERMISSIONS)[number],
): RequestHandler {
  return async (event) => {
    try {
      if (permission) {
        try {
          await authorizeSupportCommunication(permission);
        } catch (cause) {
          if (cause instanceof AppError && cause.status === 403) {
            const actor = await requireSession();
            await withPlatformTransaction((tx) =>
              recordAuditInTransaction(tx, {
                actorUserId: actor.id,
                action: "support_communication_access_denied",
                resource: "support_communication",
                metadata: { actorRole: actor.platformRole, permission },
              }),
            );
          }
          throw cause;
        }
      }
      const result = await operation(event);
      return result instanceof Response ? result : Response.json(result);
    } catch (error) {
      return errorResponse(
        error instanceof ZodError || error instanceof SyntaxError
          ? new AppError(
              "VALIDATION_ERROR",
              "Check the required fields and selected audience.",
              400,
            )
          : error,
      );
    }
  };
}
export function download(file: {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
}) {
  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition":
        "attachment; filename*=UTF-8''" + encodeURIComponent(file.fileName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function createFromForm(request: Request) {
  const actor = await staffIdentity();
  const form = await request.formData();
  const file = form.get("file");
  if (file instanceof File && file.size > 2097152)
    throw new AppError(
      "VALIDATION_ERROR",
      "Attachments must be 2 MB or smaller.",
      400,
    );
  const { createSupportSubmission } =
    await import("@/modules/platform/support-communication");
  return createSupportSubmission({
    ...actor,
    query: {
      queryType: form.get("queryType"),
      subject: form.get("subject"),
      description: form.get("description"),
    },
    file:
      file instanceof File && file.name
        ? {
            bytes: new Uint8Array(await file.arrayBuffer()),
            fileName: file.name,
            mimeType: file.type,
          }
        : undefined,
  });
}
