import { sql } from 'drizzle-orm';
import { isHttpError } from '@sveltejs/kit';
import { AppError } from '@/lib/errors';
import type { TenantContext } from '@/modules/tenancy/context';
import { database } from './database';

export type TenantTransaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];

export async function tenantApiRead<T>(
  tenant: TenantContext,
  read: (tx?: TenantTransaction) => Promise<T>
): Promise<T> {
  try {
    if (!tenant.organization || !tenant.membership || tenant.membership.status !== 'active' ||
        tenant.membership.organizationId !== tenant.organization.id) {
      throw new AppError('FORBIDDEN', 'Organization access is required.', 403);
    }
    return await database().transaction(async (tx) => {
      await tx.execute(sql`set transaction read only`);
      await tx.execute(sql`select set_config('app.current_user_id', ${tenant.user.id}, true), set_config('app.current_organization_id', ${tenant.organization!.id}, true)`);
      return read(tx);
    });
  } catch (cause) {
    if (isHttpError(cause, 401)) throw new AppError('UNAUTHORIZED', cause.body.message, 401);
    if (isHttpError(cause, 403)) throw new AppError('FORBIDDEN', cause.body.message, 403);
    if (isHttpError(cause, 503)) throw new AppError('SERVICE_UNAVAILABLE', cause.body.message, 503);
    throw cause;
  }
}
