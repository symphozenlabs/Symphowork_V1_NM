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

  const mockEmployeeCreated = {
    success: true,
    employee: {
      id: "emp-mock-uuid-001",
      employeeId: "EMP0004",
      firstName: "Aarav",
      lastName: "Sharma",
      displayName: "Aarav Sharma",
      personalEmail: "aarav.sharma@example.com",
      status: "invited",
    },
    targetRole: "HR_ADMIN",
  };

  const mockInviteSent = {
    success: true,
    invitation: {
      id: "inv-mock-001",
      status: "pending",
      intendedRole: "HR_ADMIN",
      delivery: "sent",
    },
    invitationUrl: "http://localhost:3000/invitations/accept?token=mock-secure-invitation-token-123456",
  };

  async function setupMocks(page) {
    await page.route("**/api/app/master-data/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          items: [
            { id: "1", name: "Engineering" },
            { id: "2", name: "Human Resources" },
          ],
        }),
      });
    });

    await page.route("**/api/app/employees?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          employees: [
            { id: "m1", employeeId: "EMP0001", firstName: "Vikram", lastName: "Mehta" },
          ],
        }),
      });
    });

    await page.route("**/api/app/employees", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockEmployeeCreated),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/app/employees/*/invite", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockInviteSent),
      });
    });
  }

  console.log("1. Desktop 1440x900 - Step 1: Role Selection");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_desktop_step1.png") });
    await page.close();
  }

  console.log("2. Laptop 1280x800 - Step 2: Role Details");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    // Click Next to advance to Step 2
    await page.click("button:has-text('Next: Profile Details')");
    await page.waitForSelector("input[placeholder*='Arjun']");
    // Fill sample values
    await page.fill("input[placeholder*='Arjun']", "Aarav");
    await page.fill("input[placeholder*='Sharma']", "Sharma");
    await page.fill("input[placeholder*='arjun.sharma@example.com']", "aarav.sharma@example.com");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_laptop_step2.png") });
    await page.close();
  }

  console.log("3. Tablet 768x1024 - Step 3: Review & Confirm");
  {
    const page = await browser.newPage({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    await page.click("button:has-text('Next: Profile Details')");
    await page.waitForSelector("input[placeholder*='Arjun']");
    await page.fill("input[placeholder*='Arjun']", "Aarav");
    await page.fill("input[placeholder*='Sharma']", "Sharma");
    await page.fill("input[placeholder*='arjun.sharma@example.com']", "aarav.sharma@example.com");
    await page.click("button:has-text('Next: Review & Confirm')");
    await page.waitForSelector("button:has-text('Create Employee Profile')");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_tablet_step3.png") });
    await page.close();
  }

  console.log("4. Mobile 390x844 - Step 1: Responsive Layout");
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_mobile_step1.png") });
    await page.close();
  }

  console.log("5. Desktop 1440x900 - Step 4: Profile Created");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    await page.click("button:has-text('Next: Profile Details')");
    await page.waitForSelector("input[placeholder*='Arjun']");
    await page.fill("input[placeholder*='Arjun']", "Aarav");
    await page.fill("input[placeholder*='Sharma']", "Sharma");
    await page.fill("input[placeholder*='arjun.sharma@example.com']", "aarav.sharma@example.com");
    await page.click("button:has-text('Next: Review & Confirm')");
    await page.waitForSelector("button:has-text('Create Employee Profile')");
    await page.click("button:has-text('Create Employee Profile')");
    await page.waitForSelector("button:has-text('Send Account Invitation')");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_desktop_step4.png") });
    await page.close();
  }

  console.log("6. Desktop 1440x900 - Step 5: Invitation Sent & Lifecycle Tracker");
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await setupMocks(page);
    await page.goto("http://localhost:3000/preview/onboarding-wizard", { waitUntil: "networkidle" });
    await page.click("button:has-text('Next: Profile Details')");
    await page.waitForSelector("input[placeholder*='Arjun']");
    await page.fill("input[placeholder*='Arjun']", "Aarav");
    await page.fill("input[placeholder*='Sharma']", "Sharma");
    await page.fill("input[placeholder*='arjun.sharma@example.com']", "aarav.sharma@example.com");
    await page.click("button:has-text('Next: Review & Confirm')");
    await page.waitForSelector("button:has-text('Create Employee Profile')");
    await page.click("button:has-text('Create Employee Profile')");
    await page.waitForSelector("button:has-text('Send Account Invitation')");
    await page.click("button:has-text('Send Account Invitation')");
    await page.waitForSelector("h2:has-text('Invitation Dispatched')");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "onboarding_wizard_desktop_step5.png") });
    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
