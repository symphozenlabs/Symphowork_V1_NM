import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { resolveContext } from '$lib/server/context';
import { SESSION_COOKIE, sameOriginMutation } from '$lib/server/proxy-policy';
export const handle: Handle = async ({ event, resolve }) => {
 if (!sameOriginMutation(event.request,event.url.origin)) return Response.json({ success:false,error:{code:'FORBIDDEN',message:'Cross-origin mutation requests are not allowed.'} },{status:403});
 const path = event.url.pathname;
 const security={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(self), geolocation=()','x-request-id':crypto.randomUUID()};
 event.setHeaders(security);
 const protectedPage = path === '/change-password' || path === '/app' || path.startsWith('/app/') ||
    (path === '/platform' || path.startsWith('/platform/')) && path !== '/platform/login';
 if(protectedPage||path.startsWith('/api/'))event.setHeaders({'cache-control':'no-store'});
 if (protectedPage) {
  event.locals.context = resolveContext(event.cookies.get(SESSION_COOKIE));
  const context = await event.locals.context;
  if (!context) redirect(303,path.startsWith('/platform') ? '/platform/login' : '/login');
  if (path.startsWith('/platform') && context.user.platformRole === 'NONE') redirect(303,'/app');
  if (path.startsWith('/app') && !context.organization) redirect(303,'/platform');
 }
 const response = await resolve(event);
 for(const[name,value]of Object.entries(security))response.headers.set(name,value);
 if(event.url.protocol==='https:')response.headers.set('strict-transport-security','max-age=31536000; includeSubDomains');
 response.headers.set('x-content-type-options','nosniff');
 response.headers.set('referrer-policy','strict-origin-when-cross-origin');
 response.headers.set('x-frame-options','DENY');
 if (protectedPage || path.startsWith('/api/')) response.headers.set('cache-control','no-store');
 return response;
};

