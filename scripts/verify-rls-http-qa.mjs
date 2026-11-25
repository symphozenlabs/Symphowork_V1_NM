import assert from 'node:assert/strict';
import { test } from 'node:test';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Missing QA setting ' + name);
  return value;
}

test('concurrent QA employee requests retain their authenticated tenant', {
  skip: process.env.RUN_RLS_HTTP_QA !== '1'
}, async () => {
  const origin = new URL(required('RLS_QA_APPROVED_HTTP_ORIGIN'));
  assert.ok(origin.protocol === 'https:' && origin.href === origin.origin + '/');
  const tenants = ['A', 'B'].map(suffix => ({
    org: required('RLS_QA_ORGANIZATION_' + suffix + '_ID'),
    employee: required('RLS_QA_EMPLOYEE_' + suffix + '_ID'),
    token: required('RLS_QA_SESSION_TOKEN_' + suffix)
  }));
  for (const field of ['org', 'employee', 'token']) assert.ok(tenants[0][field] !== tenants[1][field]);
  for (const tenant of tenants) assert.ok(/^[A-Za-z0-9_-]{43}$/.test(tenant.token));

  async function read(actor, target) {
    const url = new URL('/api/app/employees/' + encodeURIComponent(target.employee), origin);
    const response = await fetch(url, {
      redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { cookie: 'symphowork_session=' + actor.token }
    });
    if (actor === target) {
      assert.equal(response.status, 200);
      const { employee } = await response.json();
      assert.ok(employee?.id === actor.employee && employee.organizationId === actor.org);
    } else {
      assert.equal(response.status, 404);
      const body = await response.json();
      assert.ok(!body.success && !body.employee);
    }
  }
  for (let round = 0; round < 5; round++) {
    await Promise.all(tenants.flatMap(actor => tenants.map(target => read(actor, target))));
  }
});
