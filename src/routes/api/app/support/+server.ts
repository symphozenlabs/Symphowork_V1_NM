import * as service from "@/modules/platform/support-communication";
import {
  endpoint,
  staffIdentity,
  createFromForm,
} from "$lib/server/support-http";

export const GET = endpoint(async () =>
  service.listMySupportWorkspace(await staffIdentity()),
);
export const POST = endpoint(({ request }) => createFromForm(request));
