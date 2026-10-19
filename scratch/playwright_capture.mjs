import { chromium } from "@playwright/test";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const outDir = "C:\\Users\\nares\\.gemini\\antigravity-ide\\brain\\b6fad419-776e-4706-93b5-c8c9a5e8157b";

  // Check 390px mobile viewport first
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Find any elements causing overflow
  const overflows = await page.evaluate(() => {
    const docWidth = document.documentElement.offsetWidth;
    const bodyWidth = document.body.offsetWidth;
    const results = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > 390.5) {
        results.push({
          tag: el.tagName,
          id: el.id,
          className: (el.className || "").toString().slice(0, 100),
          rect: { left: rect.left, right: rect.right, width: rect.width },
        });
      }
    });
    return { docWidth, bodyWidth, count: results.length, topOverflows: results.slice(0, 10) };
  });

  console.log("Overflow check at 390px:", JSON.stringify(overflows, null, 2));

  await page.screenshot({ path: `${outDir}\\mobile_390px.png` });
  await page.close();

  // Tablet: 768px
  const tabletPage = await browser.newPage({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 });
  await tabletPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await tabletPage.screenshot({ path: `${outDir}\\tablet_768px.png` });
  await tabletPage.close();

  // Laptop: 1280px
  const laptopPage = await browser.newPage({ viewport: { width: 1280, height: 850 }, deviceScaleFactor: 2 });
  await laptopPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await laptopPage.screenshot({ path: `${outDir}\\laptop_1280px.png` });
  await laptopPage.close();

  // Desktop: 1440px
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
  await desktopPage.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${outDir}\\desktop_1440px.png` });
  await desktopPage.close();

  await browser.close();
  console.log("Playwright capture complete!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
