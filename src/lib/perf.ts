/**
 * Minimal, safe development-only performance instrumentation.
 *
 * Rules:
 * 1. Zero overhead and zero logging in production (NODE_ENV === "production").
 * 2. Never log credentials, SQL parameters, personal data, or tenant-sensitive payloads.
 * 3. Log sanitized operational timing only when DEBUG_PERF === "true".
 */

const isDev = process.env.NODE_ENV !== "production";

export async function timeOperation<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!isDev || process.env.DEBUG_PERF !== "true") {
    return fn();
  }

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const elapsed = performance.now() - start;
    console.log(`[Perf] operation="${label}" duration_ms=${elapsed.toFixed(1)}`);
  }
}

export function measureDuration(start: number): number {
  return performance.now() - start;
}
