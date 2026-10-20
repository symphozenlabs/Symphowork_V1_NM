import {describe,it,expect,vi} from 'vitest';
import manifest from './api-manifest.json';
import {allowsRequest,upstreamOrigin,sameOriginMutation,sessionCookie} from './proxy-policy';
import {relay} from './legacy';
describe('Legacy API inventory coverage',()=>{
 for(const endpoint of manifest)it(endpoint.route,()=>{
  const sample=endpoint.route.replace(/\[[^\]]+\]/g,'fixture-id');
  for(const method of endpoint.methods)expect(allowsRequest(sample,method)).toBe(true);
 });
 it('rejects unknown paths and unsupported methods',()=>{
  expect(allowsRequest('/api/not-an-endpoint','GET')).toBe(false);
  expect(allowsRequest('/api/auth/login','DELETE')).toBe(false);
  expect(allowsRequest('/api/app/employees/%2fother','GET')).toBe(false);
 });
 it('rejects insecure remote origins, credentials and a self-proxy loop',()=>{
  for(const value of ['http://remote.invalid','https://user:pass@backend.invalid','https://backend.invalid/path','https://app.invalid']){
   expect(()=>upstreamOrigin(value,'https://app.invalid')).toThrow();
  }
 });
 it('only forwards the session cookie, never unrelated local cookies',()=>{
  expect(sessionCookie(new Request('https://app.invalid',{headers:{cookie:'other=private; symphowork_session=synthetic-test; x=private'}}))).toBe('symphowork_session=synthetic-test');
 });
 it('rejects cross-site mutations',()=>{
  expect(sameOriginMutation(new Request('https://app.invalid',{method:'POST',headers:{origin:'https://attacker.invalid'}}),'https://app.invalid')).toBe(false);
 });
});
describe('single-owner relay',()=>{
 it('does not contact a transport for unknown or unconfigured paths',async()=>{
  const transport=vi.fn();
  expect((await relay(new Request('https://app.invalid/api/unknown'),transport, 'https://backend.invalid')).status).toBe(404);
  expect((await relay(new Request('https://app.invalid/api/health'),transport, '')).status).toBe(503);
  expect(transport).not.toHaveBeenCalled();
 });
 it('forwards a body once, preserves failure contracts and secure cookies, and disables caching',async()=>{
  const transport=vi.fn(async()=>new Response(JSON.stringify({success:false,error:{message:'Denied'}}),{
   status:403,headers:{'content-type':'application/json','set-cookie':'symphowork_session=synthetic-test; Path=/; HttpOnly; Secure; SameSite=Lax'}
  }));
  const response=await relay(new Request('https://app.invalid/api/auth/login',{method:'POST',headers:{origin:'https://app.invalid','content-type':'application/json'},body:JSON.stringify({email:'synthetic@example.invalid',password:'test-only'})}),transport,'https://backend.invalid',undefined,true);
  expect(transport).toHaveBeenCalledTimes(1);
  expect(response.status).toBe(403);expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Lax');
  expect(await response.json()).toEqual({success:false,error:{message:'Denied'}});
 });
 it('preserves query strings and streams binary range responses with download headers',async()=>{
  const bytes=new Uint8Array([0,1,2,127,255]);
  let upstreamUrl='';
  let upstreamRange='';
  let upstreamCookie='';
  const transport=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
   upstreamUrl=String(input);
   const headers=new Headers(init?.headers);
   upstreamRange=headers.get('range')??'';
   upstreamCookie=headers.get('cookie')??'';
   return new Response(bytes,{status:206,headers:{'content-type':'application/octet-stream','content-disposition':'attachment; filename="fixture.bin"','accept-ranges':'bytes','content-range':'bytes 0-4/10'}});
  });
  const response=await relay(new Request('https://app.invalid/api/health?probe=fixture&offset=0',{headers:{cookie:'unrelated=private; symphowork_session=synthetic-test','range':'bytes=0-4'}}),transport,'https://backend.invalid');
  expect(upstreamUrl).toBe('https://backend.invalid/api/health?probe=fixture&offset=0');
  expect(upstreamRange).toBe('bytes=0-4');
  expect(upstreamCookie).toBe('symphowork_session=synthetic-test');
  expect(response.status).toBe(206);
  expect(response.headers.get('content-type')).toBe('application/octet-stream');
  expect(response.headers.get('content-disposition')).toContain('fixture.bin');
  expect(response.headers.get('accept-ranges')).toBe('bytes');
  expect(response.headers.get('content-range')).toBe('bytes 0-4/10');
  expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([0,1,2,127,255]);
 });
 it('does not retry a side-effecting GET on failure',async()=>{
  const transport=vi.fn(async()=>{throw new Error('offline');});
  const response=await relay(new Request('https://app.invalid/api/app/attendance/reminder'),transport,'https://backend.invalid');
  expect(response.status).toBe(502);expect(transport).toHaveBeenCalledTimes(1);
 });
 it('rejects external upstream redirects',async()=>{
  const transport=vi.fn(async()=>new Response(null,{status:302,headers:{location:'https://attacker.invalid'}}));
  expect((await relay(new Request('https://app.invalid/api/health'),transport,'https://backend.invalid')).status).toBe(502);
 });
});


describe('login prerequisites and session-cookie continuity (synthetic transport)',()=>{
 it.each(['/api/auth/login','/api/platform/auth/login'])('fails before session creation without a session DB: %s',async path=>{
  const transport=vi.fn();const res=await relay(new Request('https://app.invalid'+path,{method:'POST',body:'{}'}),transport,'https://backend.invalid',undefined,false);
  expect(res.status).toBe(503);expect((await res.json()).error.code).toBe('SESSION_DATABASE_NOT_CONFIGURED');expect(transport).not.toHaveBeenCalled();
 });
 it('rebases a session cookie, forwards it on next request, and preserves logout expiration',async()=>{
  const login=await relay(new Request('https://app.invalid/api/auth/login',{method:'POST',body:'{}'}),vi.fn(async()=>new Response('{"success":true}',{headers:{'set-cookie':'symphowork_session=synthetic-session; Domain=backend.invalid; Path=/; HttpOnly; Secure; SameSite=Lax'}})),'https://backend.invalid',undefined,true);
  const cookie=login.headers.get('set-cookie')!;expect(cookie).not.toContain('Domain=');expect(cookie).toContain('Secure');
  const transport=vi.fn(async(_input:RequestInfo|URL,init?:RequestInit)=>{expect(new Headers(init?.headers).get('cookie')).toBe('symphowork_session=synthetic-session');return new Response('{"success":true}',{headers:{'set-cookie':'symphowork_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'}});});
  const logout=await relay(new Request('https://app.invalid/api/auth/logout',{method:'POST',headers:{cookie:cookie.split(';')[0]+'; unrelated=synthetic'}}),transport,'https://backend.invalid');expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');expect(transport).toHaveBeenCalledTimes(1);
 });
 it('streams multipart request bytes exactly once without buffering/retrying them',async()=>{
  const form=new FormData();form.set('file',new File(['synthetic-receipt'],'receipt.pdf',{type:'application/pdf'}));
  const req=new Request('https://app.invalid/api/app/documents',{method:'POST',body:form});const contentType=req.headers.get('content-type');
  const transport=vi.fn(async(_input:RequestInfo|URL,init?:RequestInit)=>{expect(new Headers(init?.headers).get('content-type')).toBe(contentType);const received=await new Response(init?.body).text();expect(received).toContain('synthetic-receipt');expect(received).toContain('receipt.pdf');return Response.json({success:true});});
  expect((await relay(req,transport,'https://backend.invalid')).status).toBe(200);expect(transport).toHaveBeenCalledTimes(1);
 });
});
