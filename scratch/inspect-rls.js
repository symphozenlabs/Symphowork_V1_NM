const { db } = require("./src/db/client.ts");
const { sql } = require("drizzle-orm");

async function check() {
  const tables = await db.execute(sql`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
    WHERE nspname = 'public' AND relkind = 'r' AND relname IN ('memberships', 'roles', 'users', 'organizations', 'departments', 'employees');
  `);
  console.log("Tables RLS:", tables);

  const policies = await db.execute(sql`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('memberships', 'roles', 'users', 'organizations', 'departments', 'employees');
  `);
  console.log("Policies:", policies);
}

check().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
