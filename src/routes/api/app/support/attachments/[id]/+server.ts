import * as service from "@/modules/platform/support-communication";
import { endpoint, staffIdentity, download } from "$lib/server/support-http";

export const GET = endpoint(async ({ params }) =>
  download(
    await service.downloadMySupportAttachment({
      ...(await staffIdentity()),
      attachmentId: params.id!,
    }),
  ),
);
