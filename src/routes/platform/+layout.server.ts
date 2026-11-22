import{error}from'@sveltejs/kit';import{hasPlatformPermission,PLATFORM_PERMISSIONS as p,type PlatformPermission}from'$lib/auth/platform';
const access:Record<string,PlatformPermission>={analytics:p.analyticsView,audit:p.auditView,configuration:p.configurationView,features:p.featureView,health:p.systemHealthView,organizations:p.organizationView,plans:p.planView,provisioning:p.provisioningView,subscriptions:p.subscriptionView,support:p.supportView,usage:p.usageView,users:p.userView};
export const load:import('./$types').LayoutServerLoad=async({locals,url})=>{
 if(url.pathname==='/platform/login')return{context:null};
 const context=await locals.context;const segment=url.pathname.split('/')[2];
 const permission=url.pathname==='/platform/organizations/new'?p.organizationCreate:access[segment]??p.organizationView;
 if(!context||!hasPlatformPermission(context.user.platformRole,permission))error(403,'Platform permission is required.');
 return{context};
};

