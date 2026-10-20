import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const inventory=JSON.parse(fs.readFileSync('docs/migration-checklist.json','utf8')) as {routes:{route:string}[]};
const publicPages=['/','/login','/register','/forgot-password','/reset-password','/verify-email','/invitations/accept','/platform/login','/jobs/synthetic-fixture/apply'];
for(const route of publicPages)test('public render '+route,async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto(route);
 expect(response?.status()).toBe(200);
 await expect(page.locator('h1:visible').first()).toBeVisible();
 expect(errors).toEqual([]);
});
test('all original protected paths reject anonymous access before data loading',async({request})=>{
 for(const {route}of inventory.routes){
  if(!(route==='/change-password'||route.startsWith('/app')||route.startsWith('/platform')&&route!=='/platform/login'))continue;
  const concrete=route.replace(/\[[^\]]+\]/g,'synthetic-id');
  const response=await request.get(concrete,{maxRedirects:0});
  expect(response.status(),route).toBe(303);
  expect(response.headers().location,route).toBe(route.startsWith('/platform')?'/platform/login':'/login');
 }
 // This test validates the central auth gate, NOT implementation of missing pages.
});
test('a cookie value alone cannot bypass session validation',async({request})=>{
 const response=await request.get('/app',{headers:{cookie:'symphowork_session=synthetic-invalid-session'},maxRedirects:0});
 expect(response.status()).toBe(503);
 expect(await response.text()).not.toContain('postgresql://');
});
test('API fails closed without infrastructure and rejects cross-origin writes',async({request})=>{
 const health=await request.get('/api/health');expect(health.status()).toBe(503);
 const unknown=await request.get('/api/not-an-endpoint');expect(unknown.status()).toBe(404);
 const method=await request.get('/api/auth/login');expect(method.status()).toBe(405);
 const cross=await request.post('/api/auth/login',{headers:{origin:'https://attacker.invalid'},data:{email:'synthetic@example.invalid',password:'synthetic-only'}});
 expect(cross.status()).toBe(403);
});
test('login preserves password visibility and reports real unconfigured-backend errors',async({page})=>{
 await page.goto('/login');
 const password=page.locator('#login-password');
 await expect(password).toHaveAttribute('type','password');
 await page.getByRole('button',{name:'Show password',exact:true}).click();
 await expect(password).toHaveAttribute('type','text');
 await page.locator('#login-email').fill('synthetic@example.invalid');
 await password.fill('SyntheticOnly123');
 await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'not configured'}).first()).toBeVisible();
 await expect(page).toHaveURL(/\/login$/);
});
test('login prevents duplicate submissions while a request is pending (mock transport only)',async({page})=>{
 let requests=0;let release:()=>void=()=>{};
 const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/auth/login',async route=>{requests++;await gate;await route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({success:false,error:{message:'Synthetic denial'}})});});
 await page.goto('/login');
 await page.locator('#login-email').fill('synthetic@example.invalid');
 await page.locator('#login-password').fill('SyntheticOnly123');
 await page.locator('.auth-card-front form').evaluate((form:HTMLFormElement)=>{form.requestSubmit();form.requestSubmit();});
 await expect(page.getByRole('button',{name:'Signing in…',exact:true})).toBeDisabled();
 await expect.poll(()=>requests).toBe(1);
 release();
 await expect(page.getByRole('alert').filter({hasText:'Synthetic denial'}).first()).toBeVisible();
 expect(requests).toBe(1);
});
test('capture target login viewports without claiming reference parity',async({page,browser},testInfo)=>{
 for(const [name,width,height]of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]as const){
  await page.setViewportSize({width,height});await page.goto('/login');await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:testInfo.outputPath('target-login-'+name+'.png'),fullPage:true,animations:'disabled'});
 }
 await testInfo.attach('browser-version',{body:browser.version(),contentType:'text/plain'});
});


test('production pages carry security headers and hydrate under CSP',async({page})=>{const response=await page.goto('/login');expect(response?.headers()['x-content-type-options']).toBe('nosniff');expect(response?.headers()['x-frame-options']).toBe('DENY');expect(response?.headers()['permissions-policy']).toContain('microphone=(self)');expect(response?.headers()['permissions-policy']).toContain('camera=()');expect(response?.headers()['permissions-policy']).toContain('geolocation=()');const csp=response?.headers()['content-security-policy']??'';expect(csp).toContain("script-src 'self'");expect(csp).not.toContain("'unsafe-eval'");await page.getByRole('button',{name:'Show password',exact:true}).click();await expect(page.locator('#login-password')).toHaveAttribute('type','text');});

test('records local target-only public navigation timings',async({page})=>{
 const samples=[];
 for(let i=0;i<3;i++){
  await page.goto('/login');await expect(page.getByRole('heading',{level:1}).first()).toBeVisible();
  samples.push(await page.evaluate(()=>{
   const n=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
   return {ttfbMs:n.responseStart-n.requestStart,domContentLoadedMs:n.domContentLoadedEventEnd-n.startTime,loadMs:n.loadEventEnd-n.startTime,transferBytes:n.transferSize};
  }));
 }
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/target-navigation-timings.json',JSON.stringify({scope:'Local target public login, three sequential samples; no original/backend comparison and no performance improvement claim',samples},null,2));
});

for(const malformed of [false,true])test(`tenant login rejects HTTP 200 ${malformed?'missing user':'failed envelope'} (mock transport)`,async({page})=>{
 await page.route('**/api/auth/login',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:malformed,...(!malformed?{error:{message:'Synthetic credential denial'}}:{})})}));
 await page.goto('/login');
 await page.locator('#login-email').fill('synthetic@example.invalid');
 await page.locator('#login-password').fill('SyntheticOnly123');
 await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();
 await expect(page.getByRole('alert').first()).toBeVisible();
 await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByRole('button',{name:'Sign in to workspace',exact:true})).toBeEnabled();
});

test('login inputs stay disabled until hydration so early typing cannot be discarded',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/_app/immutable/**/*.js',async route=>{await gate;await route.continue();});
 try{
  await page.goto('/login',{waitUntil:'commit'});
  await expect(page.locator('#login-email')).toBeDisabled();
  await expect(page.locator('#login-password')).toBeDisabled();
  await expect(page.getByRole('button',{name:'Sign in to workspace',exact:true})).toBeDisabled();
 }finally{release();}
 await expect(page.locator('#login-email')).toBeEnabled();
 await expect(page.locator('#login-password')).toBeEnabled();
 await page.locator('#login-email').fill('synthetic@example.invalid');
 await expect(page.locator('#login-email')).toHaveValue('synthetic@example.invalid');
});
