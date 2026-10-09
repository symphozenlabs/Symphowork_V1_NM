import { AppError } from "@/lib/errors";
import { getUserBySessionToken, SESSION_COOKIE } from "@/modules/identity/session-core";
import { withRequestUser } from "@/modules/identity/request-context";
import { resolveTenantContextForUser } from "@/modules/tenancy/context-core";
import type { RequestEvent } from "@sveltejs/kit";

export async function requireSvelteUser(event: Pick<RequestEvent, "cookies">) {
  const token = event.cookies.get(SESSION_COOKIE);
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) throw new AppError("UNAUTHORIZED", "Please sign in.", 401);
  return user;
}

export async function withSvelteRequestUser<T>(event: Pick<RequestEvent, "cookies">, callback: (user: Awaited<ReturnType<typeof requireSvelteUser>>) => Promise<T>) {
  const user = await requireSvelteUser(event);
  return withRequestUser(user, () => callback(user));
}

export async function resolveSvelteTenant(event: Pick<RequestEvent, "cookies">, organizationId?: string) {
  const user = await requireSvelteUser(event);
  return { user, context: await resolveTenantContextForUser(user, organizationId) };
}
