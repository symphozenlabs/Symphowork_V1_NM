import{desc,eq,sql}from'drizzle-orm';import{platformRead}from'$lib/server/platform-read';import{organizations,provisioningJobs,auditLogs}from'$lib/server/schema';import{hasPlatformPermission,PLATFORM_PERMISSIONS as p}from'$lib/auth/platform';import{legacyJSON}from'$lib/server/legacy';
export const load:import('./$types').PageServerLoad=async({locals,parent,request})=>{await parent();const context=(await locals.context)!;
const [counts,recent,jobs,activity]=await platformRead(context,p.organizationView,tx=>Promise.all([
tx.select({
  total: sql<number>`count(*)::int`,
  active: sql<number>`count(*) filter (where ${organizations.status} = 'active')::int`,
  pending: sql<number>`count(*) filter (where ${organizations.status} = 'pending')::int`,
  suspended: sql<number>`count(*) filter (where ${organizations.status} = 'suspended')::int`
}).from(organizations),
tx.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(5),
tx.select().from(provisioningJobs).orderBy(desc(provisioningJobs.createdAt)).limit(5),
tx.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5)]));
const orgCounts = counts[0] ?? { total: 0, active: 0, pending: 0, suspended: 0 };
let commercial:{total:number;active:number;overLimit:number;providerConfigured:boolean}|null=null;
// The legacy provider flag has a stricter API permission than its overview service.
// Never bypass that API permission or invent the provider state.
if([p.billingView,p.subscriptionView,p.usageView].every(permission=>hasPlatformPermission(context.user.platformRole,permission))){try{const[all,active,usage,billing]=await Promise.all([legacyJSON<{total:number}>(request,'/api/platform/subscriptions?pageSize=1'),legacyJSON<{total:number}>(request,'/api/platform/subscriptions?status=active&pageSize=1'),legacyJSON<{total:number}>(request,'/api/platform/usage?status=over_limit&pageSize=1'),legacyJSON<{providerConfigured:boolean}>(request,'/api/platform/billing')]);commercial={total:all.total,active:active.total,overLimit:usage.total,providerConfigured:billing.providerConfigured};}catch{/* No guessed values when the authoritative summary is unavailable. */}}
return{totalCount:Number(orgCounts.total??0),activeCount:Number(orgCounts.active??0),pendingCount:Number(orgCounts.pending??0),suspendedCount:Number(orgCounts.suspended??0),recent,jobs,activity,commercial};};
