import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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
