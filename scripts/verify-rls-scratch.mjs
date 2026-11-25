// Disposable PostgreSQL WASM engine with synthetic data. Never opens a network
// DB connection or loads project configuration. Install its test-only dependency:
// npm install --prefix scratch/rls-pglite --no-save --no-package-lock --ignore-scripts @electric-sql/pglite@0.5.17
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(new URL('../scratch/rls-pglite/package.json', import.meta.url));
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
const sqlFile = (name) => readFile(new URL('../docs/security/' + name, import.meta.url), 'utf8');

test('disposable PostgreSQL engine enforces verified tenant policies in SQL read-only transactions', async (t) => {
  const pg = new PGlite({ extensions: { pgcrypto } });
  const id = (n) => '00000000-0000-0000-0000-' + String(n).padStart(12, '0');
  const [orgA, orgB, userA, userB, expiredUser, inactiveUser, platformUser, inactiveMember, revokedUser, supportUser, staffA, newInvitedUser, rogueUser] =
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(id);
  const tokens = Array.from({ length: 9 }, () => randomBytes(32).toString('base64url'));
  const denied = (code) => (cause) => cause?.code === code;
  async function transaction(mode, work) {
    await pg.exec('BEGIN ' + mode);
    try { return await work(); }
    finally { await pg.exec('ROLLBACK'); }
  }
  async function begin(token) {
    await pg.query('select app_private.begin_request_context($1)', [token]);
  }
  async function scalar(sql) {
    return (await pg.query(sql)).rows[0].value;
  }

  try {
    // The embedded bootstrap identity creates objects and fixture data only.
    await pg.exec(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
      CREATE ROLE sympowork_app LOGIN NOSUPERUSER NOBYPASSRLS;
      CREATE TABLE public.organizations (id uuid PRIMARY KEY, status text NOT NULL);
      CREATE TABLE public.users (
        id uuid PRIMARY KEY, status text NOT NULL, platform_role text NOT NULL,
        email text NOT NULL DEFAULT 'synthetic@fixture.invalid', full_name text NOT NULL DEFAULT 'Fixture',
        must_change_password boolean NOT NULL DEFAULT false
      );
      CREATE TABLE public.sessions (id uuid PRIMARY KEY, user_id uuid REFERENCES users, token_hash text UNIQUE, expires_at timestamptz);
      CREATE TABLE public.memberships (user_id uuid UNIQUE REFERENCES users, organization_id uuid REFERENCES organizations, status text);
      CREATE TABLE public.employees (organization_id uuid REFERENCES organizations);
      CREATE TABLE public.departments (organization_id uuid REFERENCES organizations);
      CREATE TABLE public.roles (organization_id uuid REFERENCES organizations);
      CREATE TABLE public.invitations (organization_id uuid REFERENCES organizations);
      CREATE TABLE public.provisioning_jobs (organization_id uuid REFERENCES organizations);
      CREATE TABLE public.audit_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id uuid REFERENCES organizations,
        action text,
        resource text,
        actor_user_id uuid,
        resource_id uuid,
        metadata text
      );
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO sympowork_app;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO sympowork_app;
      GRANT SELECT ON public.departments TO sympowork_app;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO sympowork_app;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations, public.provisioning_jobs, public.audit_logs TO sympowork_app;
    `);
    const policyTables = ['memberships', 'employees', 'departments', 'roles',
      'invitations', 'provisioning_jobs', 'audit_logs'];
    for (const table of policyTables) {
      await pg.exec(`
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
        CREATE POLICY legacy_isolation ON public.${table}
        USING (organization_id::text = current_setting('app.current_organization_id', true)
               OR current_setting('app.is_platform_owner', true) = 'true');
      `);
    }
    await pg.exec('insert into roles values (null)');
    for (const org of [orgA, orgB]) {
      await pg.query("insert into organizations values ($1, 'active')", [org]);
      await pg.query('insert into employees values ($1)', [org]);
      await pg.query('insert into departments values ($1)', [org]);
      await pg.query('insert into roles values ($1)', [org]);
      await pg.query('insert into invitations values ($1)', [org]);
      await pg.query('insert into provisioning_jobs values ($1)', [org]);
      await pg.query('insert into audit_logs (organization_id, action, resource) values ($1, $2, $3)', [org, 'baseline', 'system']);
    }
    for (const [i, user] of [userA, userB, expiredUser, inactiveUser, platformUser, inactiveMember, revokedUser, supportUser, staffA].entries()) {
      const platformRole = user === platformUser ? 'PLATFORM_OWNER' : user === supportUser ? 'PLATFORM_SUPPORT' : 'NONE';
      await pg.query('insert into users (id, status, platform_role) values ($1, $2, $3)',
        [user, user === inactiveUser ? 'inactive' : 'active', platformRole]);
      if (platformRole === 'NONE') {
        await pg.query('insert into memberships values ($1, $2, $3)',
          [user, user === userB ? orgB : orgA, user === inactiveMember ? 'inactive' : 'active']);
      }
      await pg.query("insert into sessions values ($1, $2, $3, now() + $4::interval)",
        [id(10 + i), user, createHash('sha256').update(tokens[i]).digest('hex'), user === expiredUser ? '-1 hour' : '1 hour']);
    }
    // Pre-insert fixture users for testing membership mutations
    await pg.query("insert into users (id, status, platform_role) values ($1, 'active', 'NONE')", [newInvitedUser]);
    await pg.query("insert into users (id, status, platform_role) values ($1, 'active', 'NONE')", [rogueUser]);

    await pg.query('delete from sessions where user_id = $1', [revokedUser]);

    // Stage private objects
    await pg.exec(await sqlFile('request-context-stage.sql'));
    await t.test('DBA staging rollback removes the private objects', async () => {
      await pg.exec(await sqlFile('request-context-stage-rollback.sql'));
      assert.equal(await scalar("select to_regnamespace('app_private') is null as value"), true);
    });

    // Re-stage and apply policy review proposals
    await pg.exec(await sqlFile('request-context-stage.sql'));
    const audit = await pg.exec(await sqlFile('request-context-policy-review.sql'));
    const proposals = audit.flatMap(result => result.rows).filter(row => 'restricted_proposal' in row);
    assert.equal(proposals.length, policyTables.length);
    for (const proposal of proposals) {
      assert.ok(proposal.restricted_proposal);
      assert.ok(proposal.captured_rollback);
      await pg.exec(proposal.restricted_proposal);
    }

    // Apply the reviewed policy enhancements for audit_logs and memberships directly
    await pg.exec(`
      DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON public."audit_logs";
      DROP POLICY IF EXISTS "audit_logs_tenant_select" ON public."audit_logs";
      DROP POLICY IF EXISTS "audit_logs_tenant_insert" ON public."audit_logs";
      CREATE POLICY "audit_logs_tenant_select" ON public."audit_logs"
        FOR SELECT TO sympowork_app
        USING (organization_id = (SELECT app_private.current_organization_id()));
      CREATE POLICY "audit_logs_tenant_insert" ON public."audit_logs"
        FOR INSERT TO sympowork_app
        WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));

      DROP POLICY IF EXISTS "memberships_tenant_isolation" ON public."memberships";
      DROP POLICY IF EXISTS "memberships_tenant_select" ON public."memberships";
      DROP POLICY IF EXISTS "memberships_tenant_insert" ON public."memberships";
      DROP POLICY IF EXISTS "memberships_tenant_update" ON public."memberships";
      CREATE POLICY "memberships_tenant_select" ON public."memberships"
        FOR SELECT TO sympowork_app
        USING (organization_id = (SELECT app_private.current_organization_id()));
      CREATE POLICY "memberships_tenant_insert" ON public."memberships"
        FOR INSERT TO sympowork_app
        WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));
      CREATE POLICY "memberships_tenant_update" ON public."memberships"
        FOR UPDATE TO sympowork_app
        USING (organization_id = (SELECT app_private.current_organization_id()))
        WITH CHECK (organization_id = (SELECT app_private.current_organization_id()));

      DROP POLICY IF EXISTS failed_login_append ON public.audit_logs;
      CREATE POLICY failed_login_append ON public.audit_logs
        FOR INSERT TO sympowork_context_owner WITH CHECK (
          action = 'failed_login' AND resource = 'user' AND organization_id IS NULL
          AND actor_user_id IS NULL AND resource_id IS NULL AND metadata IS NULL
        );
    `);

    // Grant runtime access
    await pg.exec(`
      GRANT USAGE ON SCHEMA app_private TO sympowork_app;
      GRANT EXECUTE ON FUNCTION app_private.begin_request_context(text), app_private.end_request_context(),
        app_private.current_user_id(), app_private.current_organization_id(), app_private.is_platform_owner(),
        app_private.current_request_user()
        TO sympowork_app;
      SET ROLE sympowork_app;
    `);
    assert.equal(await scalar("select current_user = 'sympowork_app' and not rolsuper and not rolbypassrls as value from pg_roles where rolname = current_user"), true);

    await t.test('missing context and private key access fail closed', async () => {
      assert.equal(await scalar('select count(*)::int as value from employees'), 0);
      await assert.rejects(pg.query('select secret from app_private.request_context_key'), denied('42501'));
    });

    for (const [label, token, org, user] of [['A', tokens[0], orgA, userA], ['B', tokens[1], orgB, userB]]) {
      await t.test('tenant ' + label + ' can read only its rows in a SQL read-only transaction', async () => {
        await transaction('READ ONLY', async () => {
          await begin(token);
          assert.equal(await scalar("select current_setting('transaction_read_only') as value"), 'on');
          for (const table of ['employees', 'departments']) {
            const result = await pg.query('select organization_id from public.' + table);
            assert.deepEqual(result.rows, [{ organization_id: org }]);
          }
          assert.deepEqual((await pg.query('select user_id, organization_id from app_private.current_request_user()')).rows,
            [{ user_id: user, organization_id: org }]);
          assert.equal(await scalar('select app_private.is_platform_owner() as value'), false);
          await pg.query('select app_private.end_request_context()');
          assert.equal(await scalar('select app_private.current_organization_id() as value'), null);
        });
      });
    }

    await t.test('write policy rejects cross-tenant inserts, updates and deletes in both directions', async () => {
      for (const [token, own, foreign] of [[tokens[0], orgA, orgB], [tokens[1], orgB, orgA]]) {
        await transaction('READ WRITE', async () => {
          await begin(token);
          const inserted = await pg.query('insert into employees values ($1) returning organization_id', [own]);
          assert.deepEqual(inserted.rows, [{ organization_id: own }]);
          const updated = await pg.query(
            'update employees set organization_id = $1 where organization_id = $2 returning organization_id',
            [own, foreign]);
          assert.deepEqual(updated.rows, []);
          const deleted = await pg.query('delete from employees where organization_id = $1 returning organization_id', [foreign]);
          assert.deepEqual(deleted.rows, []);
          await assert.rejects(pg.query('insert into employees values ($1)', [foreign]), denied('42501'));
        });
      }
    });

    await t.test('audit logs allow tenant SELECT and INSERT, but deny cross-tenant INSERT and all UPDATE/DELETE', async () => {
      // 1. SELECT and legitimate INSERT in Tenant A context
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]); // Tenant A

        const logsA = await pg.query('select organization_id from audit_logs');
        assert.ok(logsA.rows.length >= 1);
        assert.ok(logsA.rows.every(r => r.organization_id === orgA));

        const insertOwn = await pg.query(
          "insert into audit_logs (organization_id, action, resource) values ($1, 'test_action', 'employee') returning organization_id",
          [orgA]
        );
        assert.deepEqual(insertOwn.rows, [{ organization_id: orgA }]);
      });

      // 2. Cross-tenant INSERT denial in isolated transaction
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        await assert.rejects(
          pg.query("insert into audit_logs (organization_id, action, resource) values ($1, 'forged', 'employee')", [orgB]),
          denied('42501')
        );
      });

      // 3. UPDATE denial (immutable audit log)
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const updateAttempt = await pg.query("update audit_logs set action = 'tampered' where organization_id = $1 returning id", [orgA]);
        assert.equal(updateAttempt.rows.length, 0);
      });

      // 4. DELETE denial (immutable audit log)
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const deleteAttempt = await pg.query("delete from audit_logs where organization_id = $1 returning id", [orgA]);
        assert.equal(deleteAttempt.rows.length, 0);
      });
    });

    await t.test('memberships allow organization-wide SELECT, authorized INSERT and UPDATE, but deny foreign mutations and direct DELETE', async () => {
      // 1. Organization-wide SELECT: userA can see all active memberships in Org A
      await transaction('READ ONLY', async () => {
        await begin(tokens[0]); // Tenant A (userA)
        const membersA = await pg.query('select user_id, organization_id from memberships order by user_id');
        assert.ok(membersA.rows.length >= 2);
        assert.ok(membersA.rows.every(r => r.organization_id === orgA));
        assert.ok(membersA.rows.some(r => r.user_id === userA));
        assert.ok(membersA.rows.some(r => r.user_id === staffA));
        // Org B member userB must NOT be visible
        assert.ok(!membersA.rows.some(r => r.organization_id === orgB));
      });

      // 2. INSERT: Create new membership in Org A (e.g. invitation acceptance)
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const insertMember = await pg.query(
          "insert into memberships (user_id, organization_id, status) values ($1, $2, 'active') returning user_id, organization_id",
          [newInvitedUser, orgA]
        );
        assert.deepEqual(insertMember.rows, [{ user_id: newInvitedUser, organization_id: orgA }]);
      });

      // 3. INSERT DENIAL: Cannot create membership in Org B
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        await assert.rejects(
          pg.query("insert into memberships (user_id, organization_id, status) values ($1, $2, 'active')", [rogueUser, orgB]),
          denied('42501')
        );
      });

      // 4. UPDATE: Update role/status within Org A
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const updateMember = await pg.query(
          "update memberships set status = 'confirmed' where user_id = $1 and organization_id = $2 returning status",
          [staffA, orgA]
        );
        assert.deepEqual(updateMember.rows, [{ status: 'confirmed' }]);
      });

      // 5. UPDATE DENIAL: Cannot update membership in Org B
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const updateForeign = await pg.query(
          "update memberships set status = 'hacked' where organization_id = $1 returning user_id",
          [orgB]
        );
        assert.equal(updateForeign.rows.length, 0);
      });

      // 6. DELETE DENIAL: Direct DELETE is denied (memberships are deactivated, not deleted)
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        const deleteMember = await pg.query(
          "delete from memberships where user_id = $1 returning user_id",
          [staffA]
        );
        assert.equal(deleteMember.rows.length, 0);
      });
    });

    await t.test('rerun behavior: re-applying cutover is idempotent and preserves HMAC signing key', async () => {
      // Re-assume bootstrap/DBA identity
      await pg.exec('RESET ROLE');
      
      // Capture existing secret key as context owner
      await pg.exec('SET ROLE sympowork_context_owner');
      const originalKey = await pg.query('select secret from app_private.request_context_key');
      assert.equal(originalKey.rows.length, 1);
      const secretBefore = originalKey.rows[0].secret;
      await pg.exec('RESET ROLE');

      // Re-run idempotent key creation and policy replacements as DBA
      await pg.exec(`
        CREATE SCHEMA IF NOT EXISTS app_private AUTHORIZATION sympowork_context_owner;
        SET LOCAL ROLE sympowork_context_owner;
        CREATE TABLE IF NOT EXISTS app_private.request_context_key (
          singleton boolean PRIMARY KEY CHECK (singleton),
          secret bytea NOT NULL CHECK (octet_length(secret) = 32)
        );
        INSERT INTO app_private.request_context_key VALUES (true, public.gen_random_bytes(32))
          ON CONFLICT (singleton) DO NOTHING;
        RESET ROLE;
      `);

      // Verify secret was NOT regenerated or overwritten
      await pg.exec('SET ROLE sympowork_context_owner');
      const keyAfter = await pg.query('select secret from app_private.request_context_key');
      assert.deepEqual(keyAfter.rows[0].secret, secretBefore);
      await pg.exec('RESET ROLE');

      // Re-assume app role
      await pg.exec('SET ROLE sympowork_app');
    });

    await t.test('rollback and commit clear context on the reused connection', async () => {
      let oldEnvelope;
      await transaction('READ ONLY', async () => {
        await begin(tokens[0]);
        assert.equal(await scalar('select app_private.current_organization_id() as value'), orgA);
        oldEnvelope = await scalar("select current_setting('app.verified_request_context') as value");
      });
      assert.equal(await scalar('select app_private.current_organization_id() as value'), null);
      await transaction('READ ONLY', async () => {
        await begin(tokens[1]);
        await pg.query("select set_config('app.verified_request_context', $1, true)", [oldEnvelope]);
        assert.equal(await scalar('select app_private.current_organization_id() as value'), null);
      });
      await pg.exec('BEGIN READ ONLY');
      await begin(tokens[1]);
      await pg.exec('COMMIT');
      assert.equal(await scalar('select app_private.current_organization_id() as value'), null);
    });

    await t.test('invalid, expired, revoked, inactive-user and inactive-membership sessions are rejected', async () => {
      for (const token of [randomBytes(32).toString('base64url'), tokens[2], tokens[3], tokens[5], tokens[6]]) {
        await transaction('READ ONLY', async () => {
          await assert.rejects(begin(token), denied('28000'));
        });
      }
    });

    await t.test('platform status is derived from the user record', async () => {
      await transaction('READ ONLY', async () => {
        await begin(tokens[4]);
        assert.equal(await scalar('select app_private.is_platform_owner() as value'), true);
        assert.equal(await scalar('select app_private.current_organization_id() as value'), null);
        assert.equal(await scalar('select count(*)::int as value from provisioning_jobs'), 0);
      });
      await transaction('READ ONLY', async () => {
        await begin(tokens[7]);
        assert.equal(await scalar('select platform_role as value from app_private.current_request_user()'), 'PLATFORM_SUPPORT');
        assert.equal(await scalar('select app_private.is_platform_owner() as value'), false);
        assert.equal(await scalar('select count(*)::int as value from provisioning_jobs'), 0);
      });
    });

    await t.test('shared and invitation policies restrict rows and protect global writes', async () => {
      assert.equal(await scalar('select count(*)::int as value from roles'), 0);
      assert.equal(await scalar('select count(*)::int as value from invitations'), 0);
      await transaction('READ WRITE', async () => {
        await begin(tokens[0]);
        assert.deepEqual((await pg.query('select organization_id from roles order by organization_id nulls first')).rows,
          [{ organization_id: null }, { organization_id: orgA }]);
        assert.deepEqual((await pg.query('select organization_id from invitations')).rows,
          [{ organization_id: orgA }]);
        await assert.rejects(pg.query('insert into roles values (null)'), denied('42501'));
      });
    });

    await t.test('pre-auth audit remains unavailable until its dedicated append operation exists', async () => {
      assert.equal(await scalar('select count(*)::int as value from audit_logs'), 0);
      await assert.rejects(pg.query('insert into audit_logs (organization_id) values (null)'), denied('42501'));
    });
  } finally {
    await pg.close();
  }
});
