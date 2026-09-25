import { AppError } from "@/lib/errors";
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();
export function enforceRateLimit(key: string, limit: number, windowMs: number) { const now = Date.now(); const current = buckets.get(key); const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current; entry.count += 1; buckets.set(key, entry); if (entry.count > limit) throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429, { retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }); }
export function clientRateLimitKey(request: Request, scope: string) { return `${scope}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"}`; }
