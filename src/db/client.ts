import postgres from "postgres";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(process.env.DATABASE_URL ?? "postgresql://localhost/symphowork", { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { sql };

export async function withTenantTransaction<T>(organizationId: string, callback: (transaction: unknown) => Promise<T>) {
  return db.transaction(async (transaction) => {
    await transaction.execute(drizzleSql`select set_config('app.current_organization_id', ${organizationId}, true)`);
    return callback(transaction);
  });
}

export async function withPlatformTransaction<T>(callback: (transaction: unknown) => Promise<T>) {
  return db.transaction(async (transaction) => {
    await transaction.execute(drizzleSql`select set_config('app.is_platform_owner', 'true', true)`);
    return callback(transaction);
  });
}
