import postgres from 'postgres';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const match = envContent.match(/DATABASE_URL=([^\r\n]+)/);
const databaseUrl = match[1].replace(/"/g, '').trim();

const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });

async function run() {
  try {
    const roles = await sql`
      SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolbypassrls 
      FROM pg_roles 
      ORDER BY rolname
    `;
    console.log('Roles:');
    for (const r of roles) {
      console.log(`- ${r.rolname}: super=${r.rolsuper}, inherit=${r.rolinherit}, createrole=${r.rolcreaterole}, canlogin=${r.rolcanlogin}, bypassrls=${r.rolbypassrls}`);
    }

    const members = await sql`
      SELECT r.rolname as role, m.rolname as member, am.admin_option,
             am.inherit_option, am.set_option
      FROM pg_auth_members am 
      JOIN pg_roles r ON r.oid = am.roleid 
      JOIN pg_roles m ON m.oid = am.member
    `;
    console.log('Role memberships:');
    for (const m of members) {
      console.log(`- Role ${m.role} granted to Member ${m.member} (admin=${m.admin_option}, inherit=${m.inherit_option}, set=${m.set_option})`);
    }

    const version = await sql`SELECT version()`;
    console.log('PostgreSQL version:', version[0].version);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
