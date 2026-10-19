import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err));

  console.log("Logging in...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  console.log("Filling login credentials...");
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', "kavita.hr.exec@dev.local");
  await page.fill('#login-password', "TestUser@2026#Sympho");

  console.log("Submitting login form...");
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/auth/login")),
    page.locator('button:has-text("Sign in to workspace")').click(),
  ]);
  console.log("Login response status:", res.status());

  await page.waitForTimeout(2000);
  const targetUrl = "http://localhost:3000/app/employees/da738474-39fa-4d7b-ad54-ae472b6ab0a4";
  console.log("Navigating to employee details:", targetUrl);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Click Edit Employee button
  console.log("Clicking Edit Employee button...");
  const editButton = page.locator('button:has-text("Edit Employee")');
  await editButton.click();

  // Wait for dialog to open
  console.log("Waiting for dialog to open...");
  await page.waitForSelector('text=Edit Employee Profile', { timeout: 5000 });
  console.log("Dialog is open!");

  const outDir = "C:\\Users\\nares\\.gemini\\antigravity-ide\\brain\\6596df01-e716-4c38-847f-7e0edd403350";
  await page.screenshot({ path: path.join(outDir, "edit_modal_open.png") });
  console.log("Edit modal screenshot captured!");

  await browser.close();
}

main().catch((err) => {
  console.error("Error in test-modal:", err);
  process.exit(1);
});
