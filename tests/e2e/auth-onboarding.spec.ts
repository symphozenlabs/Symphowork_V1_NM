import { expect, test } from "@playwright/test";

test.describe("authentication and onboarding entry points", () => {
  test("registration exposes validation and verification state", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByText(/12\+ characters/)).toBeVisible();
  });

  test("password recovery and invitation routes are discoverable", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password" })).toBeVisible();
    await page.goto("/verify-email");
    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
    await page.goto("/invitations/accept");
    await expect(page.getByText(/invitation link is missing/i)).toBeVisible();
  });
});
