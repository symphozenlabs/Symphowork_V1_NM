import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

if (existsSync(".env.local")) {
  try {
    const env = parseEnv(readFileSync(".env.local", "utf8"));
    for (const [k, v] of Object.entries(env)) {
      if (v !== undefined && !process.env[k]) process.env[k] = v;
    }
  } catch {}
}

async function main() {
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { db, sql } = await import("@/db/client");
  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
