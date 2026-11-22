import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { uploadChatAttachment } from "@/modules/collaboration/service";
import { conversationIdParamSchema } from "@/modules/collaboration/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    enforceRateLimit(`chat:att:${tenant.organization.id}:${tenant.user.id}`, 15, 60000);

    const { conversationId: rawId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawId);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      throw new AppError("VALIDATION_ERROR", "A valid file is required.", 400);
    }

    const content = formData.get("content")?.toString() || undefined;
    const clientIdempotencyKey = formData.get("clientIdempotencyKey")?.toString() || undefined;
    const fileName = (file as File).name || "attachment";
    const mimeType = file.type || "application/octet-stream";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const message = await uploadChatAttachment({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      conversationId,
      file: {
        buffer,
        fileName,
        mimeType,
      },
      content,
      clientIdempotencyKey,
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
