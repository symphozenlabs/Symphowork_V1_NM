import { errorResponse, AppError } from "@/lib/errors";
import { validateStorageKey } from "@/lib/storage/local";
import { verifyLocalStorageUrl } from "@/lib/storage/local-signature";
import { readAuthorizedLocalFile } from "@/modules/files/private-download";
import { resolveTenantContext } from "@/modules/tenancy/context";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key") ?? "";
    const expiresAt = Number(url.searchParams.get("expires"));
    const signature = url.searchParams.get("signature") ?? "";
    validateStorageKey(key);
    if (!verifyLocalStorageUrl({ key, expiresAt, signature })) {
      throw new AppError("FORBIDDEN", "The file link is invalid or expired.", 403);
    }

    const tenant = await resolveTenantContext();
    if (!tenant.organization) throw new AppError("FORBIDDEN", "Organization context is required.", 403);
    const file = await readAuthorizedLocalFile({
      organizationId: tenant.organization.id,
      userId: tenant.user.id,
      storageKey: key
    });
    return new Response(Buffer.from(file.bytes), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.bytes.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
