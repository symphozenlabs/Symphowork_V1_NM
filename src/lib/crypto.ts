import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, HASH_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, encoded] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !encoded) return false;
  const derived = (await scrypt(password, salt, HASH_LENGTH)) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function createOpaqueToken() { return randomBytes(32).toString("base64url"); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
