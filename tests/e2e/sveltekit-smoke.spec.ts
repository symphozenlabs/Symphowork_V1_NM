import { expect, test } from "@playwright/test";

test.describe("SvelteKit transition surface", () => {
  test("public entry points render and link into authentication", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "People operations, connected." })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("public authentication routes expose safe validation states", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    await page.goto("/invitations/accept");
    await expect(page.getByText(/invitation link is missing/i)).toBeVisible();
  });

  test("transition pages are reachable without leaking server configuration", async ({ page }) => {
    const response = await page.goto("/app/settings");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Organization settings" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("DATABASE_URL");
    await expect(page.locator("body")).not.toContainText("LEGACY_API_ORIGIN");
  });

  test("server security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
    expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
