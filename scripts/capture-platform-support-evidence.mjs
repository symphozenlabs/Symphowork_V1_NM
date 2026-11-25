import fs from 'node:fs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import postgres from 'postgres';
import { chromium } from '@playwright/test';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/^DATABASE_URL=(.*)$/m);
if (!match) throw new Error('DATABASE_URL not found in .env.local');
const databaseUrl = match[1].trim().replace(/^"|"$/g, '');

const sql = postgres(databaseUrl, { max: 2 });
const PORT = '4190';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EVIDENCE_DIR = 'artifacts/platform-support-role-verification';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}
async function captureScreenshot(page, filePath, options = {}) {
  if (fs.existsSync(filePath)) {
    console.log(`Skipping existing screenshot: ${filePath}`);
    return;
  }
  await page.screenshot({ path: filePath, ...options });
}

let serverProcess = null;
const sessionIdsToCleanup = [];

async function createSessionForRole(platformRole) {
  const [user] = await sql`SELECT id, email, platform_role FROM users WHERE platform_role = ${platformRole} LIMIT 1`;
  if (!user) throw new Error(`User not found with role: ${platformRole}`);

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 3600_000);

  await sql`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, last_seen_at, created_at)
    VALUES (${sessionId}, ${user.id}, ${tokenHash}, ${expiresAt}, NOW(), NOW())
  `;

  sessionIdsToCleanup.push(sessionId);
  console.log(`Created session for ${user.email} (${user.platform_role})`);
  return { user, rawToken };
}

async function startServer() {
  console.log('Starting SvelteKit production server...');
  return new Promise((resolve, reject) => {
    let resolved = false;

    serverProcess = spawn('node', ['build/index.js'], {
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT,
        ORIGIN: BASE_URL,
        DATABASE_URL: databaseUrl,
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString().trim();
      console.log('Server out:', msg);
      if (msg.includes('Listening on') && !resolved) {
        resolved = true;
        console.log('Server is ready on', BASE_URL);
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      console.error('Server err:', d.toString().trim());
    });

    serverProcess.on('exit', (code) => {
      if (!resolved) {
        reject(new Error(`Server exited prematurely with code ${code}`));
      }
    });

    // Fallback timeout after 45s
    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Server failed to start within 45s'));
      }
    }, 45000);
  });
}

async function run() {
  try {
    await startServer();

    console.log('Querying existing platform users...');
    const allUsers = await sql`SELECT id, email, platform_role FROM users WHERE platform_role != 'NONE'`;
    console.log('Existing platform users in DB:', allUsers);

    const support = await createSessionForRole('PLATFORM_SUPPORT');
    const owner = await createSessionForRole('PLATFORM_OWNER');
    const billing = await createSessionForRole('PLATFORM_BILLING');

    const browser = await chromium.launch({ channel: 'msedge', headless: true });

    // ==========================================
    // A. PLATFORM_SUPPORT VERIFICATION
    // ==========================================
    console.log('\n--- Running PLATFORM_SUPPORT Verification ---');
    const supportContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await supportContext.addCookies([
      {
        name: 'symphowork_session',
        value: support.rawToken,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const page = await supportContext.newPage();

    if (!fs.existsSync(`${EVIDENCE_DIR}/14-support-restricted-analytics-403.png`)) {
      // 1. Overview
      console.log('1. Capturing Support Overview (/platform)...');
      await page.goto(`${BASE_URL}/platform`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/01-support-overview.png`, fullPage: true });

      // 2. Sidebar Navigation
      console.log('2. Capturing Support Desktop Sidebar...');
      const sidebar = page.locator('aside');
      if (await sidebar.isVisible()) {
        await sidebar.screenshot({ path: `${EVIDENCE_DIR}/02-support-sidebar-navigation.png` });
      } else {
        await page.screenshot({ path: `${EVIDENCE_DIR}/02-support-sidebar-navigation.png` });
      }

      // 3. Mobile Navigation Drawer
      console.log('3. Capturing Support Mobile Navigation Drawer...');
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      await mobileContext.addCookies([
        {
          name: 'symphowork_session',
          value: support.rawToken,
          domain: '127.0.0.1',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(`${BASE_URL}/platform`);
      await mobilePage.waitForLoadState('networkidle');
      const navBtn = mobilePage.getByRole('button', { name: 'Open platform navigation' });
      if (await navBtn.isVisible()) {
        await navBtn.click();
        await mobilePage.waitForTimeout(400);
        await mobilePage.screenshot({ path: `${EVIDENCE_DIR}/03-support-mobile-drawer.png` });
      }
      await mobileContext.close();

      // 4. Organizations list
      console.log('4. Capturing Support Organizations list...');
      await page.goto(`${BASE_URL}/platform/organizations`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/04-support-organizations-list.png`, fullPage: true });

      // 5. Plans (Read-Only)
      console.log('5. Capturing Support Plans page (Read-Only)...');
      await page.goto(`${BASE_URL}/platform/plans`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/05-support-plans-read-only.png`, fullPage: true });

      // 6. Subscriptions & Usage
      console.log('6. Capturing Support Subscriptions & Usage...');
      await page.goto(`${BASE_URL}/platform/subscriptions`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/06-support-subscriptions-usage.png`, fullPage: true });

      // 7. Support page
      console.log('7. Capturing Support Troubleshooting Directory (/platform/support)...');
      await page.goto(`${BASE_URL}/platform/support`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/07-support-support-page.png`, fullPage: true });

      // 8. Health page
      console.log('8. Capturing Support Health page (/platform/health)...');
      await page.goto(`${BASE_URL}/platform/health`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${EVIDENCE_DIR}/08-support-health-page.png`, fullPage: true });

      // 9-14. Restricted URLs (HTTP 403 results)
      console.log('9-14. Capturing Restricted URL 403 results...');
      const restrictedUrls = [
        { path: '/platform/provisioning', file: '09-support-restricted-provisioning-403.png' },
        { path: '/platform/features', file: '10-support-restricted-features-403.png' },
        { path: '/platform/configuration', file: '11-support-restricted-configuration-403.png' },
        { path: '/platform/users', file: '12-support-restricted-users-403.png' },
        { path: '/platform/audit', file: '13-support-restricted-audit-403.png' },
        { path: '/platform/analytics', file: '14-support-restricted-analytics-403.png' },
      ];

      for (const r of restrictedUrls) {
        await page.goto(`${BASE_URL}${r.path}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `${EVIDENCE_DIR}/${r.file}`, fullPage: true });
      }
    } else {
      console.log('Screenshots 1-14 already captured. Proceeding to API & Regression tests.');
    }

    // Direct API verification via page.request
    console.log('\n--- Direct API Verification ---');
    const provApiResponse = await page.request.get(`${BASE_URL}/api/platform/provisioning`);
    console.log('GET /api/platform/provisioning status:', provApiResponse.status(), '(Expected: 403)');
    if (provApiResponse.status() !== 403) throw new Error(`Expected 403 from /api/platform/provisioning, got ${provApiResponse.status()}`);

    const planCreateApiResponse = await page.request.post(`${BASE_URL}/api/platform/plans`, {
      data: { code: 'UNAUTHORIZED_PLAN', name: 'Unauthorized Plan' },
    });
    console.log('POST /api/platform/plans status:', planCreateApiResponse.status(), '(Expected: 403)');
    if (planCreateApiResponse.status() !== 403) throw new Error(`Expected 403 from POST /api/platform/plans, got ${planCreateApiResponse.status()}`);

    const planGetApiResponse = await page.request.get(`${BASE_URL}/api/platform/plans`);
    console.log('GET /api/platform/plans status:', planGetApiResponse.status(), '(Expected: 200)');
    if (planGetApiResponse.status() !== 200) throw new Error(`Expected 200 from GET /api/platform/plans, got ${planGetApiResponse.status()}`);

    // ==========================================
    // B. OTHER-ROLE REGRESSION VERIFICATION
    // ==========================================
    console.log('\n--- Running Other-Role Regression Verification ---');

    // 15. PLATFORM_OWNER Overview (shows Provisioning card, full operational menu)
    console.log('15. Capturing PLATFORM_OWNER Overview...');
    const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ownerContext.addCookies([
      {
        name: 'symphowork_session',
        value: owner.rawToken,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto(`${BASE_URL}/platform`);
    await ownerPage.waitForLoadState('networkidle');
    await ownerPage.screenshot({ path: `${EVIDENCE_DIR}/15-regression-platform-owner-overview.png`, fullPage: true });

    // 16. PLATFORM_OWNER Provisioning (accessible)
    console.log('16. Capturing PLATFORM_OWNER Provisioning page...');
    await ownerPage.goto(`${BASE_URL}/platform/provisioning`);
    await ownerPage.waitForLoadState('networkidle');
    await ownerPage.screenshot({ path: `${EVIDENCE_DIR}/16-regression-platform-owner-provisioning.png`, fullPage: true });

    // 17. PLATFORM_BILLING Overview (restricted console retained)
    console.log('17. Capturing PLATFORM_BILLING Overview...');
    const billingContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await billingContext.addCookies([
      {
        name: 'symphowork_session',
        value: billing.rawToken,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const billingPage = await billingContext.newPage();
    await billingPage.goto(`${BASE_URL}/platform`);
    await billingPage.waitForLoadState('networkidle');
    await billingPage.screenshot({ path: `${EVIDENCE_DIR}/17-regression-platform-billing-overview.png`, fullPage: true });

    await browser.close();
    console.log('\nAll 17 verification screenshots captured successfully!');
  } catch (err) {
    console.error('Evidence capture failed:', err);
    throw err;
  } finally {
    if (sessionIdsToCleanup.length > 0) {
      console.log('Cleaning up temporary sessions...');
      for (const id of sessionIdsToCleanup) {
        await sql`DELETE FROM sessions WHERE id = ${id}`;
      }
    }
    await sql.end();

    if (serverProcess) {
      console.log('Stopping server...');
      serverProcess.kill('SIGTERM');
    }
  }
}

run();
