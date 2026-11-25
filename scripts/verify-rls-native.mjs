import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import postgres from 'postgres';

// This harness creates its own password-protected loopback cluster. It accepts
// no database URL. Fixture DDL uses the bootstrap login. Assertions use a
// separate direct, unprivileged runtime login on physical connections.
test('native PostgreSQL tenant isolation', async (t) => {
  const bin = resolve('scratch/rls-native/node_modules/@embedded-postgres/windows-x64/native/bin');
  await mkdir('scratch', { recursive: true });
  const cluster = await mkdtemp(resolve('scratch/native-cluster-'));
  const data = join(cluster, 'data');
  const password = () => randomBytes(32).toString('hex');
  const adminPassword = password();
  const appPassword = password();
  const reservation = createServer();
  await new Promise((ok, fail) => reservation.once('error', fail).listen(0, '127.0.0.1', ok));
  const port = reservation.address().port;
  await new Promise(ok => reservation.close(ok));
  function command(name, args, input) {
    const result = spawnSync(join(bin, name), args, { input, stdio: name === 'pg_ctl.exe' ? 'ignore' : 'pipe', encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
  }
  const pwfile = join(cluster, 'bootstrap.pw');
  await writeFile(pwfile, adminPassword, { mode: 0o600, flag: 'wx' });
  try { command('initdb.exe', ['-D', data, '-U', 'fixture_admin', '-A', 'scram-sha-256', '--pwfile', pwfile, '--encoding=UTF8', '--locale=C']); } finally { await unlink(pwfile); }
  command('pg_ctl.exe', ['-D', data, '-l', join(cluster, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  const opts = { host: '127.0.0.1', port, database: 'postgres', prepare: false, onnotice() {} };
  const admin = postgres({ ...opts, username: 'fixture_admin', password: adminPassword, max: 1 });
  const app = postgres({ ...opts, username: 'sympowork_app', password: appPassword, max: 2 });
  const file = name => readFile(resolve('docs/security', name), 'utf8');
  const orgs = [randomUUID(), randomUUID()];
  const tokens = orgs.map(() => randomBytes(32).toString('base64url'));
  try {
    await admin.unsafe(`
      CREATE EXTENSION pgcrypto;
      CREATE ROLE sympowork_app LOGIN PASSWORD '${appPassword}';
      CREATE TABLE organizations(id uuid PRIMARY KEY, status text);
      CREATE TABLE users(id uuid PRIMARY KEY, status text, platform_role text, email text, full_name text, must_change_password boolean);
      CREATE TABLE sessions(id uuid PRIMARY KEY, user_id uuid, token_hash text UNIQUE, expires_at timestamptz);
      CREATE TABLE memberships(user_id uuid, organization_id uuid, status text);
      CREATE TABLE employees(organization_id uuid);
      ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
      ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
      GRANT SELECT,INSERT,UPDATE,DELETE ON employees TO sympowork_app;
    `).simple();
    // Reconstruct the documented policy shapes on synthetic tables, including
    // the archived membership candidate. This does not assert migration history.
    const matrix = (await file('request-context-policy-map.csv')).trim().split(/\r?\n/).slice(1);
    const tables = [];
    for (const line of matrix) {
      const fields = [...line.matchAll(/"((?:[^"]|"")*)"(?=,|$)/g)].map(match => match[1].replaceAll('""', '"'));
      const [table, policy, , condition] = fields;
      assert.match(table, /^[a-z_]+$/);
      assert.match(policy, /^[a-z_]+$/);
      assert.match(condition, /^USING \(/);
      assert.ok(!condition.includes(';'));
      if (!['employees', 'memberships'].includes(table)) {
        await admin.unsafe(`CREATE TABLE "${table}" (organization_id uuid, token_hash text); ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`).simple();
      }
      await admin.unsafe(`CREATE POLICY "${policy}" ON "${table}" ${condition}`);
      tables.push(table);
    }
    assert.equal(new Set(tables).size, 129);
    for (const [i, org] of orgs.entries()) {
      const user = randomUUID();
      await admin`insert into organizations values (${org},'active')`;
      await admin`insert into users(id,status,platform_role) values (${user},'active','NONE')`;
      await admin`insert into sessions values (${randomUUID()},${user},${createHash('sha256').update(tokens[i]).digest('hex')},now()+interval '1 hour')`;
      await admin`insert into memberships values (${user},${org},'active')`;
      await admin`insert into employees values (${org})`;
    }
    await admin.unsafe(await file('request-context-stage.sql')).simple();
    const inventory = await admin.unsafe(await file('request-context-policy-review.sql')).simple();
    const policies = inventory.flat().filter(row => row.restricted_proposal);
    assert.equal(policies.length, tables.length);
    for (const row of policies) await admin.unsafe(row.restricted_proposal).simple();
    await t.test('generated rollback restores all 129 fixture policy definitions', async () => {
      for (const row of policies) await admin.unsafe(row.captured_rollback).simple();
      const restored = await admin.unsafe(await file('request-context-policy-review.sql')).simple();
      assert.deepEqual(restored.flat().filter(row => row.restricted_proposal), policies);
      for (const row of policies) await admin.unsafe(row.restricted_proposal).simple();
    });
    await admin.unsafe('GRANT USAGE ON SCHEMA app_private TO sympowork_app; GRANT EXECUTE ON FUNCTION app_private.begin_request_context(text), app_private.current_organization_id(), app_private.current_user_id() TO sympowork_app').simple();
    await t.test('simultaneous read-only transactions see only their own tenant on different backends', async () => {
      const ready = Promise.withResolvers();
      const pids = new Set();
      await Promise.all(tokens.map((token, i) => app.begin('read only', async tx => {
        const [role] = await tx`select current_user, session_user, rolsuper, rolbypassrls, pg_backend_pid() as pid from pg_roles where rolname=current_user`;
        assert.equal(role.current_user, 'sympowork_app');
        assert.equal(role.session_user, role.current_user);
        assert.equal(role.rolsuper || role.rolbypassrls, false);
        await tx`select app_private.begin_request_context(${token})`;
        pids.add(role.pid);
        if (pids.size === 2) ready.resolve();
        await Promise.race([ready.promise, new Promise((_, reject) => setTimeout(() => reject(new Error('second backend unavailable')), 5000).unref())]);
        assert.deepEqual((await tx`select organization_id from employees`).map(r => r.organization_id), [orgs[i]]);
      })));
    });
    await t.test('foreign writes fail in both directions and rolled-back connections return clean', async () => {
      for (const [i, token] of tokens.entries()) {
        await assert.rejects(app.begin(async tx => {
          await tx`select app_private.begin_request_context(${token})`;
          assert.equal((await tx`update employees set organization_id=${orgs[i]} where organization_id=${orgs[1-i]}`).count, 0);
          assert.equal((await tx`delete from employees where organization_id=${orgs[1-i]}`).count, 0);
          await tx`insert into employees values (${orgs[1-i]})`;
        }), { code: '42501' });
      }
      const connections = await Promise.all([app.reserve(), app.reserve()]);
      try {
        for (const conn of connections) assert.equal((await conn`select * from employees`).count, 0);
      } finally { for (const conn of connections) conn.release(); }
    });
  } finally {
    await Promise.all([admin.end(), app.end()]);
    command('pg_ctl.exe', ['-D', data, '-m', 'fast', '-w', 'stop']);
  }
});
