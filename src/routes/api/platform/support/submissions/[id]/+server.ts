import * as service from "@/modules/platform/support-communication";
import { endpoint } from "$lib/server/support-http";
import { PLATFORM_PERMISSIONS as p } from "@/modules/platform/authorization";

export const GET = endpoint(
  ({ params }) => service.getPlatformSupportSubmission(params.id!),
  p.supportSubmissionView,
);
export const POST = endpoint(
  async ({ params, request }) =>
    service.sendPlatformSupportReply(params.id!, await request.json()),
  p.supportReplySend,
);
