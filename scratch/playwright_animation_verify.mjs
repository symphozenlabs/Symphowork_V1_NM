import { chromium } from "@playwright/test";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const outDir = "C:\\Users\\nares\\.gemini\\antigravity-ide\\brain\\b6fad419-776e-4706-93b5-c8c9a5e8157b";

  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1.5,
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Capture Stage 1 active (at t ~ 1s)
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}\\anim_stage_01.png` });

  // Wait until Stage 2 is active (~ 3.8s)
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${outDir}\\anim_stage_02.png` });

  // Wait until Stage 3 is active (~ 7.4s)
  await page.waitForTimeout(3600);
  await page.screenshot({ path: `${outDir}\\anim_stage_03.png` });

  // Wait until Stage 4 is active (~ 11.0s)
  await page.waitForTimeout(3600);
  await page.screenshot({ path: `${outDir}\\anim_stage_04.png` });

  // Test hover interaction on Stage 2 while Stage 4 is active
  const stage2Marker = page.locator('div[role="region"]:has-text("2")');
  await stage2Marker.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}\\anim_hover_stage_02.png` });

  await browser.close();
  console.log("Animation and hover frames captured!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
