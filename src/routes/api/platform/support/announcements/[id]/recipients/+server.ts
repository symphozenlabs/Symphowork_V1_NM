import * as service from "@/modules/platform/support-communication";
import { endpoint } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(
  ({ params }) => service.listSupportAnnouncementRecipients(params.id!),
  p.supportAnnouncementView,
);
