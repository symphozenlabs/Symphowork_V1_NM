import{sql}from'drizzle-orm';import{database}from'./database';import type{Context}from'$lib/auth/policy';import{error,isHttpError}from'@sveltejs/kit';import{hasPlatformPermission,type PlatformPermission}from'$lib/auth/platform';
type Tx=Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];
export async function platformRead<T>(context:Context,permission:PlatformPermission,read:(tx:Tx)=>Promise<T>):Promise<T>{
if(!hasPlatformPermission(context.user.platformRole,permission))error(403,'Platform permission is required.');
try{return await database().transaction(async tx=>{await tx.execute(sql`set transaction read only`);await tx.execute(sql`select set_config('app.current_user_id',${context.user.id},true), set_config('app.is_platform_owner','true',true)`);return read(tx);});}catch(cause){if(isHttpError(cause))throw cause;error(503,'Platform data is unavailable.');}}
