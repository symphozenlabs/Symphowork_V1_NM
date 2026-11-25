import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execute, transaction } = vi.hoisted(() => {
  const execute = vi.fn().mockResolvedValue([]);
  const transaction = vi.fn(async (cb: (tx: { execute: typeof execute }) => Promise<unknown>) => cb({ execute }));
  return { execute, transaction };
});

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: () => ({ transaction }),
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => Object.assign(vi.fn(), {})),
}));

import {
  withInvitationTokenTransaction,
  withPlatformTransaction,
  withTenantTransaction,
  withUserTransaction,
} from './client';

describe('legacy GUC transaction entry points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DATABASE_URL', 'postgresql://sympowork_app:secret@localhost:5432/neondb');
  });

  it('sets transaction-local GUCs without requiring SvelteKit request cookies or SYMPHOWORK_TENANT_READ_CONTEXT', async () => {
    await expect(withUserTransaction('user-1', async () => 'u-ok')).resolves.toBe('u-ok');
    await expect(withInvitationTokenTransaction('tok-hash', async () => 'i-ok')).resolves.toBe('i-ok');
    await expect(withTenantTransaction('org-1', async () => 't-ok')).resolves.toBe('t-ok');
    await expect(withPlatformTransaction(async () => 'p-ok')).resolves.toBe('p-ok');

    expect(transaction).toHaveBeenCalledTimes(4);
    expect(execute).toHaveBeenCalledTimes(4);
  });
});
