import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { emailVerificationTokens, passwordResetTokens, sessions, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { createOpaqueToken, hashPassword, hashToken, verifyPassword } from "@/lib/crypto";
import { recordAudit } from "@/lib/audit";

export const SESSION_COOKIE = "symphowork_session";
const SESSION_DAYS = 14;

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function validatePassword(password: string) { return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password); }

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: expiresAt, path: " /".trim() });
}

export async function clearSessionCookie() { (await cookies()).delete(SESSION_COOKIE); }

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.query.sessions.findFirst({ where: and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())) });
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireSession() { const user = await getSessionUser(); if (!user) throw new AppError("UNAUTHORIZED", "Please sign in.", 401); return user; }

export async function registerUser(input: { email: string; fullName: string; password: string }) {
  const email = normalizeEmail(input.email);
  if (!validatePassword(input.password)) throw new AppError("VALIDATION_ERROR", "Password must be 12 characters with upper, lower, and numeric characters.", 400);
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) throw new AppError("AUTH_INVALID_CREDENTIALS", "Unable to create an account with those details.", 400);
  const [user] = await db.insert(users).values({ email, fullName: input.fullName.trim(), passwordHash: await hashPassword(input.password) }).returning();
  const token = createOpaqueToken();
  await db.insert(emailVerificationTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 86_400_000) });
  await recordAudit({ actorUserId: user.id, action: "registration", resource: "user", resourceId: user.id });
  return { user, verificationToken: token };
}

export async function authenticate(input: { email: string; password: string }) {
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizeEmail(input.email)) });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) { await recordAudit({ action: "failed_login", resource: "user", metadata: { email: normalizeEmail(input.email) } }); throw new AppError("AUTH_INVALID_CREDENTIALS", "Email or password is incorrect.", 401); }
  if (!user.emailVerifiedAt) throw new AppError("AUTH_EMAIL_NOT_VERIFIED", "Verify your email before signing in.", 403);
  const session = await createSession(user.id);
  await recordAudit({ actorUserId: user.id, action: "login", resource: "session", metadata: { expiresAt: session.expiresAt.toISOString() } });
  return { user, ...session };
}

export async function logout() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  await clearSessionCookie();
}

export async function verifyEmail(token: string) {
  const row = await db.query.emailVerificationTokens.findFirst({ where: and(eq(emailVerificationTokens.tokenHash, hashToken(token)), isNull(emailVerificationTokens.usedAt), gt(emailVerificationTokens.expiresAt, new Date())) });
  if (!row) throw new AppError("AUTH_SESSION_EXPIRED", "This verification link is invalid or expired.", 400);
  await db.transaction(async (tx) => { await tx.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, row.userId)); await tx.update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, row.id)); });
  await recordAudit({ actorUserId: row.userId, action: "email_verification", resource: "user", resourceId: row.userId });
}

export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizeEmail(email)) });
  if (!user) return;
  const token = createOpaqueToken();
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  await recordAudit({ actorUserId: user.id, action: "password_reset_request", resource: "user", resourceId: user.id });
  return token;
}

export async function resetPassword(token: string, password: string) {
  if (!validatePassword(password)) throw new AppError("VALIDATION_ERROR", "Password must be 12 characters with upper, lower, and numeric characters.", 400);
  const row = await db.query.passwordResetTokens.findFirst({ where: and(eq(passwordResetTokens.tokenHash, hashToken(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())) });
  if (!row) throw new AppError("AUTH_SESSION_EXPIRED", "This reset link is invalid or expired.", 400);
  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => { await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId)); await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id)); await tx.delete(sessions).where(eq(sessions.userId, row.userId)); });
  await recordAudit({ actorUserId: row.userId, action: "password_change", resource: "user", resourceId: row.userId });
}
