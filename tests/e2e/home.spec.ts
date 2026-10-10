import { test, expect } from "@playwright/test";
test("root renders landing page with login CTA for unauthenticated visitors", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible(); });
test("protected workspace redirects unauthenticated visitors", async ({ page }) => { await page.goto("/app"); await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(); });

