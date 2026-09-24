import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/config/env";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? postgres(env.DATABASE_URL, { max: 10, prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { sql };
