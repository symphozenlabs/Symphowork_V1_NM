import { test, expect } from "@playwright/test";
test("root routes unauthenticated visitors to sign in", async ({ page }) => { await page.goto("/"); await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(); });
test("protected workspace redirects unauthenticated visitors", async ({ page }) => { await page.goto("/app"); await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(); });
