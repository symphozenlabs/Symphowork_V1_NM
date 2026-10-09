import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { emailVerificationTokens, passwordResetTokens, sessions, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { createOpaqueToken, hashPassword, hashToken } from "@/lib/crypto";
import { recordAudit } from "@/lib/audit";
import { authenticateUser, createUserSession, deleteUserSession, getUserBySessionToken, normalizeEmail, SESSION_COOKIE } from "@/modules/identity/session-core";
import { getRequestUser } from "@/modules/identity/request-context";

export { normalizeEmail, SESSION_COOKIE } from "@/modules/identity/session-core";
export function validatePassword(password: string) { return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password); }

async function nextCookies() {
  const { cookies } = await import("next/headers");
  return cookies();
}

export async function createSession(userId: string) {
  return createUserSession(userId);
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await nextCookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: expiresAt, path: " /".trim() });
}

export async function clearSessionCookie() { (await nextCookies()).delete(SESSION_COOKIE); }

export async function getSessionUser() {
  const requestUser = getRequestUser();
  if (requestUser) return requestUser;
  const token = (await nextCookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
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

export async function resendVerification(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizeEmail(email)) });
  if (!user || user.emailVerifiedAt) return undefined;
  const token = createOpaqueToken();
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));
  await db.insert(emailVerificationTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 86_400_000) });
  return { email: user.email, token };
}

export async function authenticate(input: { email: string; password: string }) {
  return authenticateUser(input);
}

export async function logout() {
  const token = (await nextCookies()).get(SESSION_COOKIE)?.value;
  if (token) await deleteUserSession(token);
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
  await db.transaction(async (tx) => { await tx.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, row.userId)); await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id)); await tx.delete(sessions).where(eq(sessions.userId, row.userId)); });
  await recordAudit({ actorUserId: row.userId, action: "password_change", resource: "user", resourceId: row.userId });
}

export async function changePassword(userId: string, password: string) {
  if (!validatePassword(password)) throw new AppError("VALIDATION_ERROR", "Password must be 12 characters with upper, lower, and numeric characters.", 400);
  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, userId));
  await recordAudit({ actorUserId: userId, action: "password_change", resource: "user", resourceId: userId, metadata: { reason: "required_bootstrap_password_change" } });
}
