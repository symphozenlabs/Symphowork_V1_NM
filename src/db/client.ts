import postgres from "postgres";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL ?? "postgresql://localhost/symphowork", { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { sql };

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

