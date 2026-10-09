import { withSvelteRequestUser } from "$lib/server/request-context";
import type { RequestEvent } from "@sveltejs/kit";

export function withPlatformRequest<T>(event: Pick<RequestEvent, "cookies">, callback: (user: Awaited<ReturnType<typeof import("$lib/server/request-context").requireSvelteUser>>) => Promise<T>) {
  return withSvelteRequestUser(event, callback);
}
