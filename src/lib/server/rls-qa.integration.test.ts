import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isRuntimeDatabaseUrlAllowed } from '../../db/runtime-role';

/*
 * QA-only, opt-in integration checks for the proposed protected RLS context.
 * The suite never loads .env files, logs credentials, or runs by default.
 * It expects the reviewed context functions/policies to be installed first.
 */
const enabled = process.env.RUN_RLS_QA_TESTS === '1';
const qaSuite = enabled ? describe : describe.skip;
const expectedHost = 'ep-twilight-dawn-b50sv5nz-pooler.c-7.us-east-2.aws.neon.tech';
const rollbackSignal = new Error('intentional rollback sentinel');

type SqlClient = ReturnType<typeof postgres>;
let sql: SqlClient | undefined;
let fixture: {
  orgA: string;
  orgB: string;
  employeeA: string;
  employeeB: string;
  departmentA: string;
  departmentB: string;
  sessionA: string;
  sessionB: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required protected QA setting is missing: ${name}`);
  return value;
}

async function rollbackOnly(work: (tx: any) => Promise<void>): Promise<void> {
  if (!sql) throw new Error('QA database client is unavailable.');
  try {
    await sql.begin(async (tx) => {
      await work(tx);
      throw rollbackSignal;
    });
  } catch (cause) {
    if (cause === rollbackSignal) return;
    throw cause;
  }
  throw new Error('Rollback sentinel did not abort the transaction.');
}

async function beginContext(tx: any, token: string): Promise<void> {
  await tx`select app_private.begin_request_context(${token})`;
}

qaSuite('PostgreSQL tenant RLS acceptance (isolated QA only)', () => {
  beforeAll(async () => {
    const connection = required('RLS_QA_DATABASE_URL');
    if (!isRuntimeDatabaseUrlAllowed(connection)) throw new Error('RLS QA requires a direct runtime-role URL.');
    const url = new URL(connection);
    if (url.hostname !== expectedHost) throw new Error('RLS QA endpoint does not match the approved isolated endpoint.');

    fixture = {
      orgA: required('RLS_QA_ORGANIZATION_A_ID'),
      orgB: required('RLS_QA_ORGANIZATION_B_ID'),
      employeeA: required('RLS_QA_EMPLOYEE_A_ID'),
      employeeB: required('RLS_QA_EMPLOYEE_B_ID'),
      departmentA: required('RLS_QA_DEPARTMENT_A_ID'),
      departmentB: required('RLS_QA_DEPARTMENT_B_ID'),
      sessionA: required('RLS_QA_SESSION_TOKEN_A'),
      sessionB: required('RLS_QA_SESSION_TOKEN_B')
    };
    if (fixture.orgA === fixture.orgB || fixture.employeeA === fixture.employeeB ||
        fixture.departmentA === fixture.departmentB || fixture.sessionA === fixture.sessionB) {
      throw new Error('Two distinct approved QA fixture sets are required.');
    }

    sql = postgres(url.toString(), { max: 1, prepare: false, connect_timeout: 8, idle_timeout: 1 });
    const [identity] = await sql`
      select current_database() as database, current_user as role, session_user as login,
             rolsuper as superuser, rolbypassrls as bypass_rls
      from pg_roles where rolname = current_user`;
    if (identity?.database !== 'neondb' || identity.role !== 'sympowork_app' ||
        identity.login !== identity.role || identity.superuser || identity.bypass_rls) {
      await sql.end({ timeout: 2 });
      sql = undefined;
      throw new Error('RLS QA tests require database neondb and role sympowork_app.');
    }
  }, 15_000);

  afterAll(async () => {
    if (sql) await sql.end({ timeout: 2 });
  });

  it('enables RLS for every public table with organization_id', async () => {
    const [row] = await sql!`
      select count(*)::int as total,
        count(*) filter (where row_security_active(c.oid))::int as active
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and exists (
          select 1 from information_schema.columns i
          where i.table_schema = n.nspname and i.table_name = c.relname
            and i.column_name = 'organization_id'
        )`;
    expect(row.total).toBe(129);
    expect(row.active).toBe(row.total);
  });

  it('derives tenant A from its verified session and hides tenant B employee', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      expect(context.organization_id).toBe(fixture.orgA);
      const own = await tx`select id::text from public.employees where id = ${fixture.employeeA}::uuid`;
      const foreign = await tx`select id::text from public.employees where id = ${fixture.employeeB}::uuid`;
      expect(own).toHaveLength(1);
      expect(foreign).toHaveLength(0);
    });
  });

  it('derives tenant B from its verified session and hides tenant A employee', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionB);
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      expect(context.organization_id).toBe(fixture.orgB);
      const own = await tx`select id::text from public.employees where id = ${fixture.employeeB}::uuid`;
      const foreign = await tx`select id::text from public.employees where id = ${fixture.employeeA}::uuid`;
      expect(own).toHaveLength(1);
      expect(foreign).toHaveLength(0);
    });
  });

  it('does not let freely settable legacy GUCs override the verified tenant context', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      await tx`select set_config('app.current_organization_id', ${fixture.orgB}, true), set_config('app.is_platform_owner', 'true', true)`;
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      expect(context.organization_id).toBe(fixture.orgA);
      const foreign = await tx`select id::text from public.employees where id = ${fixture.employeeB}::uuid`;
      expect(foreign).toHaveLength(0);
    });
  });

  it('fails closed with no context', async () => {
    await rollbackOnly(async (tx) => {
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      const rows = await tx`select id::text from public.employees where id = ${fixture.employeeA}::uuid`;
      expect(context.organization_id).toBeNull();
      expect(rows).toHaveLength(0);
    });
  });

  it('rejects cross-tenant inserts and tenant reassignment', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      let insertDenied = false;
      try {
        await tx`
          insert into public.employees (organization_id, employee_id, first_name, last_name, display_name)
          values (${fixture.orgB}::uuid, ${`RLS-${randomUUID()}`}, 'QA', 'Isolation', 'QA Isolation')`;
      } catch (cause) {
        insertDenied = (cause as { code?: string })?.code === '42501';
      }
      expect(insertDenied).toBe(true);
    });

    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      let moveDenied = false;
      try {
        await tx`update public.employees set organization_id = ${fixture.orgB}::uuid where id = ${fixture.employeeA}::uuid`;
      } catch (cause) {
        moveDenied = (cause as { code?: string })?.code === '42501';
      }
      expect(moveDenied).toBe(true);
    });
  });

  it('does not update or delete another tenant employee', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      const updated = await tx`update public.employees set first_name = 'RLS QA' where id = ${fixture.employeeB}::uuid returning id`;
      const deleted = await tx`delete from public.employees where id = ${fixture.employeeB}::uuid returning id`;
      expect(updated).toHaveLength(0);
      expect(deleted).toHaveLength(0);
    });
  });

  it('does not carry tenant A context into a reused pooled connection', async () => {
    await sql!.begin(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      await tx`select app_private.end_request_context()`;
    });
    const [empty] = await sql!`select app_private.current_organization_id()::text as organization_id`;
    expect(empty.organization_id).toBeNull();
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionB);
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      expect(context.organization_id).toBe(fixture.orgB);
    });
  });

  it('rejects expired, revoked, inactive-user and inactive-membership sessions', async () => {
    const fixtureKeys = [
      'RLS_QA_EXPIRED_SESSION_TOKEN',
      'RLS_QA_REVOKED_SESSION_TOKEN',
      'RLS_QA_INACTIVE_USER_SESSION_TOKEN',
      'RLS_QA_INACTIVE_MEMBERSHIP_SESSION_TOKEN'
    ];
    for (const key of fixtureKeys) {
      await expect(rollbackOnly((tx) => beginContext(tx, required(key))))
        .rejects.toMatchObject({ code: '28000' });
    }
  });

  it('clears verified context after rollback on a reused connection', async () => {
    await rollbackOnly(async (tx) => {
      await beginContext(tx, fixture.sessionA);
      const [context] = await tx`select app_private.current_organization_id()::text as organization_id`;
      expect(context.organization_id).toBe(fixture.orgA);
    });
    const [context] = await sql!`select app_private.current_organization_id()::text as organization_id`;
    expect(context.organization_id).toBeNull();
  });

  it('allows each tenant to read its department and hides the other tenant department', async () => {
    for (const [token, own, foreign] of [
      [fixture.sessionA, fixture.departmentA, fixture.departmentB],
      [fixture.sessionB, fixture.departmentB, fixture.departmentA]
    ]) {
      await rollbackOnly(async (tx) => {
        await beginContext(tx, token);
        const ownRows = await tx`select id from public.departments where id = ${own}::uuid`;
        const foreignRows = await tx`select id from public.departments where id = ${foreign}::uuid`;
        expect(ownRows).toHaveLength(1);
        expect(foreignRows).toHaveLength(0);
      });
    }
  });
});
