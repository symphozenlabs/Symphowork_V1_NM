import * as service from "@/modules/platform/support-communication";
import { endpoint } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(
  () => service.listPlatformSupportAnnouncements(),
  p.supportAnnouncementView,
);
export const POST = endpoint(
  async ({ request }) =>
    service.publishSupportAnnouncement(await request.json()),
  p.supportAnnouncementPublish,
);
