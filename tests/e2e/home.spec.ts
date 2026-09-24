import { test, expect } from "@playwright/test";
test("overview workspace renders", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading", { name: "Good morning, Alex." })).toBeVisible(); await expect(page.getByText("Platform foundation")).toBeVisible(); });
test("protected workspace redirects unauthenticated visitors", async ({ page }) => { await page.goto("/app"); await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(); });
