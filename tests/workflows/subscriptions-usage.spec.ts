import { expect, test } from '@playwright/test';

test('subscriptions usage details open in an accessible modal and preserve table state', async ({ page }) => {
  await page.goto('/?view=subscriptions-usage');
  const shell = page.getByText('Persistent platform shell');
  await expect(shell).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);

  await page.getByRole('button', { name: 'Details' }).click();
  const dialog = page.getByRole('dialog', { name: 'Organization Subscription Details' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.locator('body').evaluate((body) => (body as HTMLElement).style.overflow)).toBe('hidden');
  await expect(dialog.getByText('Acme Example')).toBeVisible();
  await expect(dialog.getByText('Growth Plan')).toBeVisible();
  await expect(dialog.getByText('monthly', { exact: true })).toBeVisible();
  await expect(dialog.getByText('12', { exact: true })).toBeVisible();
  await expect(dialog.getByText('100', { exact: true })).toBeVisible();
  await expect(dialog.getByText('2025-01-31')).toBeVisible();
  await expect(dialog.getByText('2025-02-28')).toBeVisible();
  await expect(dialog.getByText('0 days', { exact: true })).toBeVisible();
  await expect(dialog.getByText('End Date Passed')).toBeVisible();
  await expect(dialog.getByText(/private-customer-id|private-subscription-id/)).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.locator('body').evaluate((body) => (body as HTMLElement).style.overflow)).toBe('');
  await expect(shell).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);

  await page.getByRole('button', { name: 'Details' }).click();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(dialog).toBeHidden();
});

test('subscription filters fetch table rows without reloading the page shell', async ({ page }) => {
  let requestedUrl = '';
  await page.route('**/api/platform/subscriptions-usage**', async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, rows: [], total: 0, page: 1, pageSize: 10, pageCount: 1, availablePlans: [] }),
    });
  });
  await page.goto('/?view=subscriptions-usage');
  const shell = page.getByText('Persistent platform shell');
  await page.getByLabel('Filter by subscription or usage status').selectOption('active');
  await expect.poll(() => requestedUrl).toContain('status=active');
  await expect(page).toHaveURL(/\/platform\/subscriptions\?status=active$/);
  await expect(shell).toBeVisible();
  await expect(page.getByText('No organizations found')).toBeVisible();
});
