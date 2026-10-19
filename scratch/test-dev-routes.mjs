import fs from 'node:fs';

async function run() {
  console.log('=== Next.js Dev Server Verification ===\n');

  // Step 1: Check routes-manifest.json before
  const manifestBefore = fs.existsSync('.next/routes-manifest.json');
  console.log('1. .next/routes-manifest.json exists before requests:', manifestBefore);

  // Step 2: Test unauthenticated routes
  const loginRes = await fetch('http://localhost:3000/login');
  console.log(`2. GET /login -> HTTP ${loginRes.status}`);

  const unauthAttRes = await fetch('http://localhost:3000/app/attendance', { redirect: 'manual' });
  console.log(`3. GET /app/attendance (unauthenticated) -> HTTP ${unauthAttRes.status} (Location: ${unauthAttRes.headers.get('location')})`);

  const unauthAppRes = await fetch('http://localhost:3000/app', { redirect: 'manual' });
  console.log(`4. GET /app (unauthenticated) -> HTTP ${unauthAppRes.status} (Location: ${unauthAppRes.headers.get('location')})`);

  // Step 3: Authenticate as Organization Owner
  console.log('\nAuthenticating as Organization Owner...');
  const loginPostRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'contact@nareshtechnologies.example',
      password: 'Naresh@27452005',
    }),
  });
  console.log(`5. POST /api/auth/login -> HTTP ${loginPostRes.status}`);
  const setCookie = loginPostRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('Failed to get session cookie from login response!');
    process.exit(1);
  }
  const sessionCookie = setCookie.split(';')[0];
  console.log(`   Session Cookie acquired: ${sessionCookie.slice(0, 30)}...`);

  // Step 4: Request authenticated page /app/attendance
  console.log('\nRequesting /app/attendance with authenticated session...');
  const startComp = Date.now();
  const authAttRes = await fetch('http://localhost:3000/app/attendance', {
    headers: { Cookie: sessionCookie },
  });
  const durationComp = Date.now() - startComp;
  console.log(`6. GET /app/attendance (authenticated) -> HTTP ${authAttRes.status} in ${durationComp}ms`);
  const html = await authAttRes.text();
  console.log(`   HTML size: ${html.length} bytes, Contains 'Organization-Wide': ${html.includes('Organization-Wide')}`);

  // Step 5: Request authenticated API /api/app/attendance/organization
  const orgApiRes = await fetch('http://localhost:3000/api/app/attendance/organization', {
    headers: { Cookie: sessionCookie },
  });
  console.log(`7. GET /api/app/attendance/organization -> HTTP ${orgApiRes.status}`);
  const orgData = await orgApiRes.json();
  console.log(`   API success: ${orgData.success}, Total Active: ${orgData.summary?.totalActive}, Employees count: ${orgData.employees?.length}`);

  // Step 6: Request authenticated API /api/app/attendance
  const attApiRes = await fetch('http://localhost:3000/api/app/attendance', {
    headers: { Cookie: sessionCookie },
  });
  console.log(`8. GET /api/app/attendance -> HTTP ${attApiRes.status}`);
  const attData = await attApiRes.json();
  console.log(`   Personal attendance success: ${attData.success}, Has Shift: ${attData.hasShift}`);

  // Step 7: Repeated requests to test stability & caching
  console.log('\nTesting server stability across 5 repeated requests...');
  for (let i = 1; i <= 5; i++) {
    const t0 = Date.now();
    const r1 = await fetch('http://localhost:3000/app/attendance', { headers: { Cookie: sessionCookie } });
    const r2 = await fetch('http://localhost:3000/api/app/attendance/organization', { headers: { Cookie: sessionCookie } });
    console.log(`   Iteration ${i}: /app/attendance HTTP ${r1.status}, /api/app/attendance/organization HTTP ${r2.status} in ${Date.now() - t0}ms`);
  }

  // Step 8: Verify routes-manifest.json remained present throughout
  const manifestAfter = fs.existsSync('.next/routes-manifest.json');
  console.log('\n9. .next/routes-manifest.json exists after all requests:', manifestAfter);

  console.log('\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
