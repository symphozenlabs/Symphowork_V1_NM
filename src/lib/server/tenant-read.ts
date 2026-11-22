import {sql} from 'drizzle-orm';import {database} from './database';import type {Context} from '$lib/auth/policy';import {error} from '@sveltejs/kit';
type Tx=Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];
export async function tenantRead<T>(context:Context,read:(tx:Tx)=>Promise<T>):Promise<T>{
 if(!context.organization||!context.membership||context.membership.status!=='active'||context.membership.organizationId!==context.organization.id)error(403,'Organization access is required.');
 return database().transaction(async tx=>{
  await tx.execute(sql`set transaction read only`);
  await tx.execute(sql`select set_config('app.current_user_id',${context.user.id},true), set_config('app.current_organization_id',${context.organization!.id},true)`);
  return read(tx);
 });
}

