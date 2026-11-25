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

const sql = postgres(databaseUrl, { ssl: 'require', max: 1 });

async function verify() {
  console.log('=== LIVE DATABASE CUTOVER VERIFICATION ===');
  let allPassed = true;

  try {
    // 1. Check runtime role flags
    const [role] = await sql`
      SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb 
      FROM pg_roles WHERE rolname = 'sympowork_app'
    `;
    console.log(`[1] Runtime role: ${role.rolname} (super: ${role.rolsuper}, bypassrls: ${role.rolbypassrls})`);
    if (role.rolsuper || role.rolbypassrls) {
      console.error('FAIL: sympowork_app has privileged role flags');
      allPassed = false;
    }

    // 2. Check app_private schema
    const schemas = await sql`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'app_private'
    `;
    const schemaExists = schemas.length === 1;
    console.log(`[2] app_private schema exists: ${schemaExists}`);
    if (!schemaExists) allPassed = false;

    // 3. Check required functions
    const requiredFuncs = [
      'begin_request_context',
      'valid_request_context',
      'current_user_id',
      'current_organization_id',
      'is_platform_owner',
      'current_request_user',
      'end_request_context',
      'append_failed_login',
      'revoke_presented_session',
      'read_platform_configuration'
    ];
    const funcs = await sql`
      SELECT p.proname, r.rolname as owner, p.prosecdef
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE n.nspname = 'app_private'
    `;
    const foundFuncs = new Set(funcs.map(f => f.proname));
    const missingFuncs = requiredFuncs.filter(fn => !foundFuncs.has(fn));
    console.log(`[3] Functions in app_private: ${funcs.length}/${requiredFuncs.length} present (missing: ${missingFuncs.length ? missingFuncs.join(', ') : 'none'})`);
    if (missingFuncs.length > 0) allPassed = false;

    // 4. Check function owner
    const invalidOwners = funcs.filter(f => f.owner !== 'sympowork_context_owner');
    if (invalidOwners.length > 0) {
      console.error(`FAIL: Functions not owned by sympowork_context_owner:`, invalidOwners.map(f => f.proname));
      allPassed = false;
    } else if (funcs.length > 0) {
      console.log(`[4] All app_private functions owned by sympowork_context_owner`);
    }

    // 5. Check private key table protection (runtime role must be denied access)
    try {
      await sql`SELECT * FROM app_private.request_context_key LIMIT 1`;
      console.error('FAIL: sympowork_app was able to SELECT from app_private.request_context_key!');
      allPassed = false;
    } catch (e) {
      if (e.message.includes('permission denied') || e.code === '42501') {
        console.log(`[5] Secret table protection: Access correctly denied to sympowork_app (42501)`);
      } else if (e.message.includes('does not exist')) {
        console.log(`[5] Secret table: app_private.request_context_key does not exist yet`);
        allPassed = false;
      } else {
        console.log(`[5] Secret table query error:`, e.message);
      }
    }

    // 6. Check tenant policies
    const policies = await sql`
      SELECT tablename, policyname, qual
      FROM pg_policies
      WHERE schemaname = 'public'
    `;
    const verifiedPolicies = policies.filter(p => p.qual?.includes('current_organization_id()'));
    const legacyGucPolicies = policies.filter(p => p.qual?.includes("current_setting('app."));
    console.log(`[6] Public RLS policies: ${policies.length} total`);
    console.log(`    - Using verified context: ${verifiedPolicies.length}`);
    console.log(`    - Using legacy mutable GUCs: ${legacyGucPolicies.length}`);
    if (legacyGucPolicies.length > 0) {
      console.log(`    Legacy GUC policies remaining:`, legacyGucPolicies.map(p => `${p.tablename}.${p.policyname}`));
    }

    // Summary
    console.log('\n=== VERIFICATION RESULT ===');
    if (allPassed && schemaExists && funcs.length >= 9 && legacyGucPolicies.length === 0) {
      console.log('STATUS: FULLY VERIFIED — Cutover is complete and live in PostgreSQL.');
    } else {
      console.log('STATUS: NOT COMPLETE — Cutover DDL has not been applied yet or is incomplete.');
    }
  } catch (err) {
    console.error('Live verification error:', err.message);
  } finally {
    await sql.end();
  }
}

verify();
