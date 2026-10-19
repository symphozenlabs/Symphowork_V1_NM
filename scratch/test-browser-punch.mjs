import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "arjunsharma@gmail.com",
      password: "Naresh@27452005",
    }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  const sessionToken = cookieHeader?.match(/symphowork_session=([^;]+)/)?.[1];
  if (!sessionToken) throw new Error("No session token");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  });

  await context.addCookies([
    {
      name: "symphowork_session",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.goto("http://localhost:3000/app/attendance", { waitUntil: "domcontentloaded" });

  // Wait for client-side attendance state to load
  console.log("Waiting for attendance data to hydrate...");
  await page.waitForFunction(() => !document.body.innerText.includes("Loading…") || document.body.innerText.includes("First In:"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const outDir = "C:\\Users\\nares\\.gemini\antigravity-ide\\brain\\6596df01-e716-4c38-847f-7e0edd403350";
  const screenshotPath = path.join(outDir, "arjun_attendance_page_loaded.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot saved:", screenshotPath);

  const clockInBtn = page.locator('button:has-text("Clock in")');
  console.log("Clock in disabled:", await clockInBtn.isDisabled());

  const clockOutBtn = page.locator('button:has-text("Clock out")');
  console.log("Clock out enabled:", await clockOutBtn.isEnabled());

  // Test clicking Clock Out live in browser
  if (await clockOutBtn.isEnabled()) {
    console.log("Clicking Clock out in real browser...");
    await clockOutBtn.click();
    await page.waitForTimeout(3000);
    const screenshotAfterOut = path.join(outDir, "arjun_clock_out_success.png");
    await page.screenshot({ path: screenshotAfterOut, fullPage: true });
    console.log("Screenshot after Clock out saved:", screenshotAfterOut);
  }

  await browser.close();
  console.log("Browser test finished successfully!");
}

main().catch((err) => {
  console.error("Browser test error:", err);
  process.exit(1);
});
