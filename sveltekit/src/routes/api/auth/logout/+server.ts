import { SESSION_COOKIE, deleteUserSession } from "@/modules/identity/session-core";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE);
  if (token) await deleteUserSession(token);
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return Response.json({ success: true });
};
