import{and,eq}from'drizzle-orm';import{error}from'@sveltejs/kit';import{tenantRead}from'$lib/server/tenant-read';import{employees}from'$lib/server/schema';
export const load:import('./$types').PageServerLoad=async({locals})=>{
 const ctx=await locals.context;if(!ctx?.organization)error(403,'Organization access is required.');
 try{return await tenantRead(ctx,async tx=>{const[employee]=await tx.select({firstName:employees.firstName,middleName:employees.middleName,lastName:employees.lastName,personalEmail:employees.personalEmail,phone:employees.phone}).from(employees).where(and(eq(employees.userId,ctx.user.id),eq(employees.organizationId,ctx.organization!.id))).limit(1);return{employee:employee??null};});}catch{error(503,'Your employee profile could not be loaded.');}
};

