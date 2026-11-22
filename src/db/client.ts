import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import postgres from "postgres";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { isRuntimeDatabaseUrlAllowed, runtimeDatabaseRoleError } from './runtime-role';

export class DatabaseConfigurationError extends Error {
  constructor(message = "DATABASE_URL is required for database-backed application features.") {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  for (const envFile of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), envFile);
    if (existsSync(p)) {
      try {
        const parsed = parseEnv(readFileSync(p, "utf8"));
        if (parsed.DATABASE_URL?.trim()) {
          process.env.DATABASE_URL = parsed.DATABASE_URL.trim();
          return parsed.DATABASE_URL.trim();
        }
      } catch {
        throw new DatabaseConfigurationError();
      }
    }
  }
  return undefined;
}

export function isDatabaseConfigured(): boolean {
  try {
    const url = resolveDatabaseUrl();
    return Boolean(url && isRuntimeDatabaseUrlAllowed(url));
  } catch {
    return false;
  }
}

type SqlClient = ReturnType<typeof postgres>;
function createDrizzleClient(client: SqlClient) {
  return drizzle(client, { schema });
}
type DrizzleClient = ReturnType<typeof createDrizzleClient>;
type DatabaseClients = { url: string; sql: SqlClient; db: DrizzleClient };

const globalForDb = globalThis as unknown as { clients?: DatabaseClients };
let localClients: DatabaseClients | undefined;

function clients(): DatabaseClients {
  const url = resolveDatabaseUrl();
  if (!url) throw new DatabaseConfigurationError();
  if (!isRuntimeDatabaseUrlAllowed(url)) throw new DatabaseConfigurationError(runtimeDatabaseRoleError());
  if (localClients?.url === url) return localClients;
  if (globalForDb.clients?.url === url) {
    localClients = globalForDb.clients;
    return localClients;
  }

  const sqlClient = postgres(url, { max: 10, prepare: false, idle_timeout: 30, connect_timeout: 30 });
  const next: DatabaseClients = { url, sql: sqlClient, db: createDrizzleClient(sqlClient) };
  localClients = next;
  if (process.env.NODE_ENV !== "production") globalForDb.clients = next;
  return next;
}

// Defer pool creation until a database operation is actually requested. This
// lets public pages and production builds work without credentials while
// database-backed features fail closed instead of targeting localhost.
export const db = new Proxy({} as DrizzleClient, {
  get(_target, property) {
    const instance = clients().db;
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  }
});

export const sql = new Proxy(function () {} as unknown as SqlClient, {
  apply(_target, thisArg, args) {
    const instance = clients().sql;
    return Reflect.apply(instance as unknown as (...values: unknown[]) => unknown, thisArg, args);
  },
  get(_target, property) {
    const instance = clients().sql;
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  }
});

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const isDev = process.env.NODE_ENV !== "production";

/**
 * Driver Measurement Capabilities & Limitations (postgres.js ^3.4.7 + Drizzle ORM):
 * - Connection acquisition time: When db.transaction() is invoked, postgres.js checks out
 *   a pooled connection and sends `BEGIN`. The interval between calling db.transaction()
 *   and callback execution start reliably captures connection acquisition latency + BEGIN RTT.
 * - Transaction execution duration: Measured from callback entry through completion (covering
 *   all queries within the transaction and COMMIT/ROLLBACK).
 * - Limitation: For standalone individual queries, postgres.js pipelines requests across
 *   the connection pool without exposing pre-query acquisition hooks.
 * - Safety: In dev mode (DEBUG_PERF="true"), only sanitized execution latencies are logged.
 *   No credentials, SQL parameters, tenant IDs, user IDs, or personal data are ever logged.
 */
export async function withUserTransaction<T>(userId: string, callback: (transaction: DbTransaction) => Promise<T>) {

  const acquireStart = isDev ? performance.now() : 0;
  return db.transaction(async (transaction) => {
    const acquireMs = isDev ? performance.now() - acquireStart : 0;
    const txStart = isDev ? performance.now() : 0;
    try {
      await transaction.execute(drizzleSql`select set_config('app.current_user_id', ${userId}, true)`);
      return await callback(transaction);
    } finally {
      if (isDev && process.env.DEBUG_PERF === "true") {
        const durationMs = performance.now() - txStart;
        console.log(`[DB Perf] withUserTransaction acquire_ms=${acquireMs.toFixed(1)} duration_ms=${durationMs.toFixed(1)}`);
      }
    }
  });
}

export async function withInvitationTokenTransaction<T>(tokenHash: string, callback: (transaction: DbTransaction) => Promise<T>) {
  const acquireStart = isDev ? performance.now() : 0;
  return db.transaction(async (transaction) => {
    const acquireMs = isDev ? performance.now() - acquireStart : 0;
    const txStart = isDev ? performance.now() : 0;
    try {
      await transaction.execute(drizzleSql`select set_config('app.current_invitation_token_hash', ${tokenHash}, true)`);
      return await callback(transaction);
    } finally {
      if (isDev && process.env.DEBUG_PERF === "true") {
        const durationMs = performance.now() - txStart;
        console.log(`[DB Perf] withInvitationTokenTransaction acquire_ms=${acquireMs.toFixed(1)} duration_ms=${durationMs.toFixed(1)}`);
      }
    }
  });
}

export async function withTenantTransaction<T>(organizationId: string, callback: (transaction: DbTransaction) => Promise<T>) {
  const acquireStart = isDev ? performance.now() : 0;
  return db.transaction(async (transaction) => {
    const acquireMs = isDev ? performance.now() - acquireStart : 0;
    const txStart = isDev ? performance.now() : 0;
    try {
      await transaction.execute(drizzleSql`select set_config('app.current_organization_id', ${organizationId}, true)`);
      return await callback(transaction);
    } finally {
      if (isDev && process.env.DEBUG_PERF === "true") {
        const durationMs = performance.now() - txStart;
        console.log(`[DB Perf] withTenantTransaction acquire_ms=${acquireMs.toFixed(1)} duration_ms=${durationMs.toFixed(1)}`);
      }
    }
  });
}

export async function withPlatformTransaction<T>(callback: (transaction: DbTransaction) => Promise<T>) {
  const acquireStart = isDev ? performance.now() : 0;
  return db.transaction(async (transaction) => {
    const acquireMs = isDev ? performance.now() - acquireStart : 0;
    const txStart = isDev ? performance.now() : 0;
    try {
      await transaction.execute(drizzleSql`select set_config('app.is_platform_owner', 'true', true)`);
      return await callback(transaction);
    } finally {
      if (isDev && process.env.DEBUG_PERF === "true") {
        const durationMs = performance.now() - txStart;
        console.log(`[DB Perf] withPlatformTransaction acquire_ms=${acquireMs.toFixed(1)} duration_ms=${durationMs.toFixed(1)}`);
      }
    }
  });
}

