import * as service from "@/modules/platform/support-communication";
import { endpoint, staffIdentity } from "$lib/server/support-http";

export const GET = endpoint(async ({ params }) =>
  service.getMySupportAnnouncement({
    ...(await staffIdentity()),
    announcementId: params.id!,
  }),
);
