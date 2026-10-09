import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import { recordAudit } from "@/lib/audit";

export const SESSION_COOKIE = "symphowork_session";
const SESSION_DAYS = 14;

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export async function createUserSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string) {
  const session = await db.query.sessions.findFirst({ where: and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())) });
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  return user && user.status === "active" ? user : null;
}

export async function authenticateUser(input: { email: string; password: string }) {
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizeEmail(input.email)) });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    await recordAudit({ action: "failed_login", resource: "user", metadata: { email: normalizeEmail(input.email) } });
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
  }
  if (!user.emailVerifiedAt) throw new AppError("AUTH_EMAIL_NOT_VERIFIED", "Verify your email before signing in.", 403);
  const session = await createUserSession(user.id);
  await recordAudit({ actorUserId: user.id, action: "login", resource: "session", metadata: { expiresAt: session.expiresAt.toISOString() } });
  return { user, ...session };
}

export async function deleteUserSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function hashNewPassword(password: string) {
  return hashPassword(password);
}
