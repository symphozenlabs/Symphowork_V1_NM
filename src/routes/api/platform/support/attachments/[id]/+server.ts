import * as service from "@/modules/platform/support-communication";
import { endpoint, download } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(
  async ({ params }) =>
    download(await service.downloadPlatformSupportAttachment(params.id!)),
  p.supportAttachmentAccess,
);
