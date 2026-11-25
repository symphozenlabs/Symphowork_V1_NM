import postgres from 'postgres';
import fs from 'fs';

let databaseUrl = '';
const envContent = fs.readFileSync('.env.local', 'utf-8');
for (const line of envContent.split(/\r?\n/)) {
  if (line.startsWith('DATABASE_URL=')) {
    databaseUrl = line.substring('DATABASE_URL='.length).trim();
    if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
      databaseUrl = databaseUrl.slice(1, -1);
    }
  }
}

console.log('Database URL host:', databaseUrl.split('@')[1]?.split('/')[0]);

const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });

async function check() {
  try {
    const resSchema = await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app_private'`;
    console.log('app_private schema count:', resSchema.length);

    const resFunc = await sql`SELECT proname FROM pg_proc WHERE proname = 'begin_request_context'`;
    console.log('begin_request_context proc count:', resFunc.length);

    const resAllFuncs = await sql`SELECT proname, nspname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'app_private'`;
    console.log('app_private functions:', resAllFuncs.map(r => r.proname));

    const resPolicies = await sql`SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public' LIMIT 5`;
    console.log('Sample policies:', resPolicies);
  } catch (err) {
    console.error('DB query error:', err.message);
  } finally {
    await sql.end();
  }
}

check();
