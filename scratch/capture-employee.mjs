import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err));
  page.on("response", async (res) => {
    if (res.url().includes("/api/auth/login")) {
      console.log("LOGIN RESPONSE STATUS:", res.status());
      console.log("LOGIN RESPONSE BODY:", await res.text().catch(() => ""));
    }
  });

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });

  console.log("Filling login credentials...");
  await page.fill('#login-email', "kavita.hr.exec@dev.local");
  await page.fill('#login-password', "TestUser@2026#Sympho");

  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/login") && res.status() === 200),
    page.click('button[type="submit"]'),
  ]);
  console.log("Login completed with status:", response.status());

  await page.waitForTimeout(2000);
  console.log("Current URL after login:", page.url());

  const targetUrl = "http://localhost:3000/app/employees/da738474-39fa-4d7b-ad54-ae472b6ab0a4";
  console.log("Navigating to employee details:", targetUrl);
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  console.log("Employee detail page loaded:", page.url());

  const outDir = "C:\\Users\\nares\\.gemini\\antigravity-ide\\brain\\6596df01-e716-4c38-847f-7e0edd403350";

    // 1440px Desktop
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.screenshot({ path: path.join(outDir, "redesigned_1440px.png"), fullPage: true });

    // 1280px Laptop
    await page.setViewportSize({ width: 1280, height: 850 });
    await page.screenshot({ path: path.join(outDir, "redesigned_1280px.png"), fullPage: true });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(outDir, "redesigned_768px.png"), fullPage: true });

    // 390px Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(outDir, "redesigned_390px.png"), fullPage: true });

    console.log("Redesigned screenshots captured successfully!");

  await browser.close();
}

main().catch((err) => {
  console.error("Error running script:", err);
  process.exit(1);
});
