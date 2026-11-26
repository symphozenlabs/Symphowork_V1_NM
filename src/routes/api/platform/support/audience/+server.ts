import * as service from "@/modules/platform/support-communication";
import { endpoint } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(({ url }) => {
  const org = url.searchParams.get("organization");
  const q = url.searchParams.get("q") ?? "";
  return org
    ? service.listSupportOrganizationMembers(org, q)
    : service.listSupportRecipientOrganizations(q);
}, p.supportRecipientSelect);
export const POST = endpoint(
  async ({ request }) =>
    service.previewSupportAnnouncementRecipients(await request.json()),
  p.supportRecipientSelect,
);
