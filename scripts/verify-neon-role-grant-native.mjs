import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile, unlink } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve, sep } from 'node:path';
import postgres from 'postgres';
import { test } from 'node:test';

// Reproduces the recorded PostgreSQL 18.7 role-creation behavior on an isolated
// loopback cluster. No project or Neon DATABASE_URL is read by this test.
test('Neon PG18.7 CREATEROLE deployment can set, but not inherit, its created owner role', async () => {
  const bin = resolve('scratch/rls-native/node_modules/@embedded-postgres/windows-x64/native/bin');
  const scratchRoot = resolve('scratch');
  await mkdir(scratchRoot, { recursive: true });
  const cluster = await mkdtemp(join(scratchRoot, 'role-grant-pg18-'));
  assert.ok(cluster.startsWith(scratchRoot + sep));
  const data = join(cluster, 'data');
  const adminPassword = randomBytes(32).toString('hex');
  const dbaPassword = randomBytes(32).toString('hex');
  const appPassword = randomBytes(32).toString('hex');
  const reservation = createServer();
  await new Promise((ok, fail) => reservation.once('error', fail).listen(0, '127.0.0.1', ok));
  const port = reservation.address().port;
  await new Promise(ok => reservation.close(ok));

  function command(name, args, input) {
    const result = spawnSync(join(bin, name), args, {
      input,
      stdio: name === 'pg_ctl.exe' ? 'ignore' : 'pipe',
      encoding: 'utf8',
      windowsHide: true,
      timeout: 60000
    });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  }

  const pwfile = join(cluster, 'bootstrap.pw');
  await writeFile(pwfile, adminPassword, { mode: 0o600, flag: 'wx' });
  try {
    command('initdb.exe', ['-D', data, '-U', 'fixture_admin', '-A', 'scram-sha-256', '--pwfile', pwfile, '--encoding=UTF8', '--locale=C']);
  } finally {
    await unlink(pwfile);
  }
  command('pg_ctl.exe', ['-D', data, '-l', join(cluster, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);

  const options = { host: '127.0.0.1', port, database: 'postgres', prepare: false, max: 1, onnotice() {} };
  const admin = postgres({ ...options, username: 'fixture_admin', password: adminPassword });
  let dba;
  let app;
  try {
    await admin.unsafe(`
      CREATE ROLE neondb_owner LOGIN CREATEROLE NOSUPERUSER NOBYPASSRLS PASSWORD '${dbaPassword}';
      CREATE ROLE sympowork_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${appPassword}';
      GRANT CONNECT, CREATE ON DATABASE postgres TO neondb_owner;
    `).simple();
    dba = postgres({ ...options, username: 'neondb_owner', password: dbaPassword });
    app = postgres({ ...options, username: 'sympowork_app', password: appPassword });

    await dba.unsafe('CREATE ROLE sympowork_context_owner NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION').simple();
    const [defaultMembership] = await dba`
      SELECT member.rolname AS member, granted.rolname AS granted,
             membership.admin_option, membership.set_option, membership.inherit_option
      FROM pg_auth_members AS membership
      JOIN pg_roles AS member ON member.oid = membership.member
      JOIN pg_roles AS granted ON granted.oid = membership.roleid
      WHERE member.rolname = current_user AND granted.rolname = 'sympowork_context_owner'
    `;
    assert.deepEqual(defaultMembership, {
      member: 'neondb_owner', granted: 'sympowork_context_owner',
      admin_option: true, set_option: false, inherit_option: false
    });

    await assert.rejects(
      dba.unsafe('GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE, ADMIN TRUE').simple(),
      { code: '0LP01' }
    );
    await dba.unsafe('GRANT sympowork_context_owner TO CURRENT_USER WITH SET TRUE, INHERIT FALSE').simple();
    const enabledMemberships = await dba`
      SELECT member.rolname AS member, granted.rolname AS granted, grantor.rolname AS grantor,
             membership.admin_option, membership.set_option, membership.inherit_option
      FROM pg_auth_members AS membership
      JOIN pg_roles AS member ON member.oid = membership.member
      JOIN pg_roles AS granted ON granted.oid = membership.roleid
      JOIN pg_roles AS grantor ON grantor.oid = membership.grantor
      WHERE member.rolname = current_user AND granted.rolname = 'sympowork_context_owner'
      ORDER BY membership.set_option DESC
    `;
    assert.ok(enabledMemberships.some(membership =>
      membership.member === 'neondb_owner' && membership.granted === 'sympowork_context_owner' &&
      membership.admin_option === false && membership.set_option === true && membership.inherit_option === false
    ), JSON.stringify(enabledMemberships));
    assert.ok(enabledMemberships.some(membership =>
      membership.admin_option === true && membership.set_option === false && membership.inherit_option === false
    ), JSON.stringify(enabledMemberships));
    const [{ can_set_role: canSetRole }] = await dba`SELECT pg_has_role(current_user, 'sympowork_context_owner', 'SET') AS can_set_role`;
    assert.equal(canSetRole, true);

    await dba.unsafe('CREATE SCHEMA app_private AUTHORIZATION sympowork_context_owner').simple();
    await dba.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE sympowork_context_owner');
      const [{ current_user: currentUser }] = await tx`SELECT current_user`;
      assert.equal(currentUser, 'sympowork_context_owner');
      await tx.unsafe("CREATE FUNCTION app_private.test_owner() RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS 'SELECT current_user::text'");
    });

    const [owner] = await admin`
      SELECT n.nspname AS schema_name, r.rolname AS schema_owner,
             p.proname AS function_name, function_owner.rolname AS function_owner
      FROM pg_namespace AS n
      JOIN pg_roles AS r ON r.oid = n.nspowner
      JOIN pg_proc AS p ON p.pronamespace = n.oid
      JOIN pg_roles AS function_owner ON function_owner.oid = p.proowner
      WHERE n.nspname = 'app_private' AND p.proname = 'test_owner'
    `;
    assert.deepEqual(owner, {
      schema_name: 'app_private', schema_owner: 'sympowork_context_owner',
      function_name: 'test_owner', function_owner: 'sympowork_context_owner'
    });

    await assert.rejects(app.unsafe('SET ROLE sympowork_context_owner').simple(), { code: '42501' });
    const [runtime] = await admin`
      SELECT r.rolsuper AS superuser, r.rolbypassrls AS bypass_rls,
             pg_has_role('sympowork_app', 'sympowork_context_owner', 'MEMBER') AS context_owner_member
      FROM pg_roles AS r WHERE r.rolname = 'sympowork_app'
    `;
    assert.deepEqual(runtime, { superuser: false, bypass_rls: false, context_owner_member: false });

    console.log('PG18.7 role bootstrap passed: creator default SET=false; explicit non-inheriting SET grant enables owner DDL; runtime remains non-member, non-superuser and NOBYPASSRLS.');
  } finally {
    await Promise.all([admin.end(), dba?.end(), app?.end()].filter(Boolean));
    command('pg_ctl.exe', ['-D', data, '-m', 'fast', '-w', 'stop']);
    assert.ok(cluster.startsWith(scratchRoot + sep));
    await rm(cluster, { recursive: true, force: true });
  }
});
