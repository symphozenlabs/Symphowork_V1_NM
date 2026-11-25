import type { Context } from '$lib/auth/policy';
declare global {
 namespace App { interface Locals { requestCache?: import("$lib/server/request-cache").RequestCacheStore; context?: Promise<Context | null>; } }
}
export {};

