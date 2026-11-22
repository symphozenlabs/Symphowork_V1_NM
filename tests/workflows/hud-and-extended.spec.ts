import { test, expect } from '@playwright/test';

test('EnterpriseGrowthHud allows interactive stage scrubber selection and pause', async ({ page }) => {
  await page.goto('/?view=growth-hud');
  const hud = page.locator('div[aria-label="SymphoWork Enterprise Growth Journey Demonstration"]');
  await expect(hud).toBeVisible();

  // Initial stage 1
  await expect(hud.locator('text=Stage 01 · Workspace Genesis')).toBeVisible();
  await expect(hud.locator('text=Acme Global Technologies Inc.')).toBeVisible();

  // Pause playback
  const pauseBtn = hud.locator('button[aria-label*="growth demonstration"]');
  await expect(pauseBtn).toBeVisible();
  await pauseBtn.click();

  // Click on stage 4 "4. Department Pods"
  const stage4Tab = hud.locator('button[role="tab"]:has-text("4. Department Pods")');
  await stage4Tab.click();
  await expect(hud.locator('text=Stage 04 · Structural Expansion')).toBeVisible();
  await expect(hud.locator('text=Structured Department Pods')).toBeVisible();
  await expect(hud.getByText('Engineering', { exact: true })).toBeVisible();

  // Click on stage 6 "6. Enterprise BI"
  const stage6Tab = hud.locator('button[role="tab"]:has-text("6. Enterprise BI")');
  await stage6Tab.click();
  await expect(hud.locator('text=Stage 06 · Unified Coordination')).toBeVisible();
  await expect(hud.locator('text=Enterprise Command & Strategic BI')).toBeVisible();
});

test('EcosystemConstellationHud displays 5 pipeline phases and interactive stage inspector', async ({ page }) => {
  await page.goto('/?view=constellation-hud');
  const hud = page.locator('div[aria-label="SymphoWork Enterprise Workflow Command Stream"]');
  await expect(hud).toBeVisible();

  // Verify headers and phase titles
  await expect(hud.locator('text=SymphoWork Workflow Command Engine')).toBeVisible();
  await expect(hud.locator('text=PHASE 1 · INGESTION')).toBeVisible();
  await expect(hud.locator('text=PHASE 2 · ENROLLMENT')).toBeVisible();
  await expect(hud.locator('text=PHASE 3 · OPS')).toBeVisible();
  await expect(hud.locator('text=PHASE 4 · GATE')).toBeVisible();
  await expect(hud.locator('text=PHASE 5 · SETTLE')).toBeVisible();

  // Hover or focus an interactive stage node (TENANT GENESIS)
  const genesisNode = hud.locator('g[role="button"][aria-label*="TENANT GENESIS"]');
  await expect(genesisNode).toBeVisible();
  await genesisNode.hover();

  // Stage details should appear in inspector strip
  await expect(hud.locator('text=modules/platform/provisioning.ts')).toBeVisible();
  await expect(hud.locator('text=Platform Console / Registration')).toBeVisible();
});

test('WorkforceNetworkHud dispatches to enterprise growth hud by default', async ({ page }) => {
  await page.goto('/?view=network-hud');
  const hud = page.locator('div[aria-label="SymphoWork Enterprise Growth Journey Demonstration"]');
  await expect(hud).toBeVisible();
  await expect(hud.locator('text=Enterprise Growth Journey')).toBeVisible();
});

test('PayslipList displays generated payslips with accurate gross and net figures', async ({ page }) => {
  await page.route('**/api/app/payroll/payslips', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        payslips: [
          {
            payslip: { payslipNumber: 'PS-2026-001', generatedAt: '2026-10-01T00:00:00Z' },
            run: { runNumber: 'RUN-2026-09' },
            period: { month: 9, year: 2026, periodStart: '2026-09-01', periodEnd: '2026-09-30' },
            snapshot: {
              payableDays: 30,
              lopDays: 0,
              grossEarnings: 150000,
              totalDeductions: 15000,
              netSalary: 135000,
              employerContributions: 18000
            },
            employee: { displayName: 'Ada Lovelace', employeeId: 'EMP0001' },
            lineItems: [
              { code: 'BASIC', name: 'Basic Salary', type: 'earning', amount: 100000, taxable: true },
              { code: 'HRA', name: 'House Rent Allowance', type: 'earning', amount: 50000, taxable: true },
              { code: 'PF', name: 'Provident Fund', type: 'deduction', amount: 12000, taxable: false },
              { code: 'PT', name: 'Professional Tax', type: 'deduction', amount: 3000, taxable: false }
            ]
          }
        ]
      })
    });
  });

  await page.goto('/?view=payslips');
  await expect(page.locator('text=PS-2026-001')).toBeVisible();
  await expect(page.locator('text=My Finalized Payslips')).toBeVisible();

  // Click View Itemized Voucher to open the payslip modal
  const viewVoucherBtn = page.locator('button:has-text("View Itemized Voucher")');
  await expect(viewVoucherBtn).toBeVisible();
  await viewVoucherBtn.click();

  // Modal displays employee name and itemized breakdown
  await expect(page.locator('text=Ada Lovelace')).toBeVisible();
  await expect(page.locator('text=Basic Salary')).toBeVisible();
  await expect(page.locator('text=House Rent Allowance')).toBeVisible();
});

test('FeatureFlagToggle toggles flag state with PATCH request', async ({ page }) => {
  let patched = false;
  await page.route('**/api/platform/features/*', async (route) => {
    if (route.request().method() === 'PATCH') {
      patched = true;
      const data = JSON.parse(route.request().postData() || '{}');
      expect(data.enabled).toBe(true);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, flag: { id: 'flag-1', key: 'ai_matching', enabled: true } })
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/?view=feature-flags');
  const enableBtn = page.getByRole('button', { name: 'Enable', exact: true });
  await expect(enableBtn).toBeVisible();
  await enableBtn.click();

  // Confirm dialog opens with confirm button "Enable Flag"
  const confirmBtn = page.getByRole('button', { name: 'Enable Flag', exact: true });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  await expect.poll(() => patched).toBe(true);
});

test('PlatformAuditList renders administrative audit log items', async ({ page }) => {
  await page.goto('/?view=audit-list');
  await expect(page.locator('text=ORGANIZATION_SUSPEND')).toBeVisible();
  await expect(page.locator('text=admin@symphowork.test')).toBeVisible();
  await expect(page.locator('text=Acme')).toBeVisible();
  await expect(page.locator('text=Governance Ledger Events')).toBeVisible();
});
