import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors";

export const MAX_LOCAL_DOWNLOAD_TTL_SECONDS = 900;

function signatureFor(key: string, expiresAt: number, secret: string) {
  return createHmac("sha256", secret).update(`${expiresAt}\n${key}`).digest("base64url");
}

export function signLocalStorageUrl(key: string, expiresAt: number, secret = process.env.AUTH_SECRET) {
  if (!secret) throw new AppError("PROVISIONING_FAILED", "Local file delivery is not configured.", 503);
  return signatureFor(key, expiresAt, secret);
}

export function verifyLocalStorageUrl(input: {
  key: string;
  expiresAt: number;
  signature: string;
  secret?: string;
  nowSeconds?: number;
}) {
  const secret = input.secret ?? process.env.AUTH_SECRET;
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!secret || !Number.isSafeInteger(input.expiresAt) || input.expiresAt <= nowSeconds) return false;
  if (input.expiresAt - nowSeconds > MAX_LOCAL_DOWNLOAD_TTL_SECONDS) return false;
  if (!/^[A-Za-z0-9_-]{43}$/.test(input.signature)) return false;

  const expected = Buffer.from(signatureFor(input.key, input.expiresAt, secret));
  const actual = Buffer.from(input.signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
