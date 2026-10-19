import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const outDir = "C:\\Users\\nares\\.gemini\\antigravity\\brain\\674eb36d-c46b-4963-829f-2fc374a10531";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true,
  });

  const mockPreviewResponse = {
    success: true,
    invitation: {
      organization: { name: "Acme Enterprise Corp", slug: "acme-enterprise" },
      invitedEmail: "jane.vance@acme.com",
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      fullName: "Dr. Jane Vance",
    },
  };

  // Helper to setup route interception
  async function setupMock(page, previewData = mockPreviewResponse) {
    await page.route("**/api/auth/invitations/accept/preview*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(previewData),
      });
    });
  }

  console.log("1. Desktop 1440x900 - Full form with populated owner name & Strong password");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForSelector("#invitation-fullname");
    // Fill password to show 'Strong'
    await page.fill("#invitation-password", "Enterprise2026!Secure");
    await page.fill("#invitation-confirmpassword", "Enterprise2026!Secure");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "desktop_1440x900_strong.png") });
    await page.close();
  }

  console.log("2. Laptop 1280x800 - Full form with populated owner name & Good password");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForSelector("#invitation-fullname");
    await page.fill("#invitation-password", "Enterprise2026");
    await page.fill("#invitation-confirmpassword", "Enterprise2026");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "laptop_1280x800_good.png") });
    await page.close();
  }

  console.log("3. Tablet 768x1024 - Full form");
  {
    const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForSelector("#invitation-fullname");
    await page.fill("#invitation-password", "Enterprise2026");
    await page.fill("#invitation-confirmpassword", "Enterprise2026");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "tablet_768x1024.png") });
    await page.close();
  }

  console.log("4. Mobile 390x844 - Full form");
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForSelector("#invitation-fullname");
    await page.fill("#invitation-password", "Enterprise2026");
    await page.fill("#invitation-confirmpassword", "Enterprise2026");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "mobile_390x844.png") });
    await page.close();
  }

  console.log("5. Password strength levels verification (Weak, Fair, Good, Strong) & Confirm password no strength meter");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForSelector("#invitation-fullname");

    // Weak
    await page.fill("#invitation-password", "weak1");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, "strength_weak.png") });

    // Fair
    await page.fill("#invitation-password", "fairpassword1");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, "strength_fair.png") });

    // Mismatched confirm password
    await page.fill("#invitation-confirmpassword", "mismatch");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, "confirm_password_mismatch_no_meter.png") });

    await page.close();
  }

  console.log("6. Short invitation form (Missing token or error state)");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await page.goto("http://localhost:3000/invitations/accept", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "short_form_missing_token.png") });
    await page.close();
  }

  console.log("7. Animation progression (Frames at 0s, 2s, 4s)");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, "animation_frame_0s.png") });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, "animation_frame_2s.png") });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, "animation_frame_4s.png") });
    await page.close();
  }

  console.log("8. Reduced Motion Emulation");
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    await setupMock(page);
    await page.goto("http://localhost:3000/invitations/accept?token=valid-test-token", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "reduced_motion.png") });
    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
