import type { Context } from '$lib/auth/policy';
declare global {
 namespace App { interface Locals { context?: Promise<Context | null>; } }
}
export {};

