# QA restricted connection verification

A live read-only probe used NM's effective DATABASE_URL and the same postgres.js driver and runtime-role guard as the application. The shell supplied no override. NM loaded the value from its ignored .env.local. The configured pooled endpoint matched the operator-confirmed Neon SymphoWork_NM / naresh-dev baseline after normalizing the pooler suffix. PostgreSQL independently returned neondb. Branch identity comes from the recorded endpoint mapping, since the database name alone cannot identify a Neon branch.

| Check | Observed result |
|---|---|
| Neon project and branch | SymphoWork_NM / naresh-dev, matched to the recorded QA endpoint |
| Database | neondb |
| Connection | Pooled |
| current_user | sympowork_app |
| session_user | sympowork_app |
| SUPERUSER | false |
| BYPASSRLS | false |
| Membership in a superuser or BYPASSRLS role | false |
| Probe transaction read-only | true |

The connection passed the restricted-role preflight for tenant-isolation testing. Passing the isolation suite still requires the reviewed policies, signed context and independent QA fixtures.

## Repeat the read-only check

From the NM root, paste this PowerShell block. It refuses a connection whose role or endpoint fails preflight. The output contains only database and role names and privilege flags.

```powershell
@'
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import postgres from 'postgres';
import { isRuntimeDatabaseUrlAllowed } from './src/db/runtime-role.ts';

try {
  const url = process.env.DATABASE_URL?.trim() || ['.env.local', '.env']
    .filter(file => existsSync(file))
    .map(file => parseEnv(readFileSync(file, 'utf8')).DATABASE_URL?.trim())
    .find(Boolean);
  if (!url || !isRuntimeDatabaseUrlAllowed(url)) throw new Error();

  const target = new URL(url);
  const { identity } = JSON.parse(readFileSync('docs/security/neon-qa-readonly-baseline.json', 'utf8'));
  const normalize = host => host.toLowerCase().replace(/-pooler(?=\.)/, '');
  if (normalize(target.hostname) !== normalize(identity.endpoint_host) ||
      target.pathname !== '/neondb' || identity.database !== 'neondb') throw new Error();

  const db = postgres(url, { max: 1, prepare: false, connect_timeout: 8 });
  try {
    const [result] = await db.begin('read only', tx => tx`
      select current_database() as database,
             current_user as effective_role,
             session_user as login_role,
             r.rolsuper as superuser,
             r.rolbypassrls as bypass_rls,
             current_setting('transaction_read_only') = 'on' as read_only
      from pg_catalog.pg_roles r where r.rolname = current_user
    `);
    if (result?.database !== 'neondb' || result.effective_role !== 'sympowork_app' ||
        result.login_role !== 'sympowork_app' || result.superuser !== false ||
        result.bypass_rls !== false || result.read_only !== true) throw new Error();
    console.log(result);
  } finally {
    await db.end({ timeout: 2 });
  }
} catch {
  console.error('Restricted QA probe failed; details withheld.');
  process.exitCode = 1;
}
'@ | node --input-type=module
```

The application resolves DATABASE_URL before constructing its lazy Drizzle and postgres.js clients. Its legacy tenant helper sets organization context transaction-locally. Verified mode instead requires the signed request context. Those controls scope data within the runtime connection. The identity probe checks the login outside a tenant operation.

## Neon SQL Editor

The reported SQL Editor session authenticated as neondb_owner with BYPASSRLS. The Connect dialog supplies connection details for an application or client. The editor's identity comes from the connection it actually opened. The reported identity establishes that the editor did not use NM's application connection. The specific editor configuration was not inspected.

Use the local probe above or open a new SQL client connection with the existing restricted QA connection. Confirm that both current_user and session_user are sympowork_app and that both privilege flags are false before running isolation checks. If the editor continues to report neondb_owner, leave that session out of application-security verification. No role, grant, environment, or database changes are required for this connection check.
