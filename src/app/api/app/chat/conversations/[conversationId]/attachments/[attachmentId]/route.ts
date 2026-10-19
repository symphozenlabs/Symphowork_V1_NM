import { NextResponse } from "next/server";
import { errorResponse, AppError } from "@/lib/errors";
import { resolveTenantContext } from "@/modules/tenancy/context";
import { getChatAttachment } from "@/modules/collaboration/service";
import { attachmentIdParamSchema, conversationIdParamSchema } from "@/modules/collaboration/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string; attachmentId: string }> }
) {
  try {
    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);

    const { conversationId: rawConvId, attachmentId: rawAttId } = await context.params;
    const conversationId = conversationIdParamSchema.parse(rawConvId);
    const attachmentId = attachmentIdParamSchema.parse(rawAttId);

    const { attachment, buffer } = await getChatAttachment({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      conversationId,
      attachmentId,
    });

    const isImage = attachment.mimeType.startsWith("image/");
    const isAudio = attachment.mimeType.startsWith("audio/");
    const isPdf = attachment.mimeType === "application/pdf";

    // For images, inline display; for documents/audio, inline or attachment with safe filename
    const disposition = isImage || isAudio || isPdf ? "inline" : "attachment";
    const encodedFileName = encodeURIComponent(attachment.fileName);

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": attachment.fileSize.toString(),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedFileName}`,
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
