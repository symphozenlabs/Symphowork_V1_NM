import { chromium } from "@playwright/test";

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
  console.log("Navigating to /app/attendance with domcontentloaded...");
  await page.goto("http://localhost:3000/app/attendance", { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("DOM content loaded. Waiting for buttons...");
  await page.waitForSelector("button", { timeout: 30000 });
  await page.waitForTimeout(4000);

  const buttonStates = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons
      .filter((b) => ["Clock in", "Clock out", "Start break", "End break"].some((txt) => b.innerText.includes(txt)))
      .map((b) => ({
        text: b.innerText.trim(),
        disabled: b.disabled,
      }));
  });

  console.log("Button States in Real Browser:\n", JSON.stringify(buttonStates, null, 2));

  const screenshotPath = "C:/Users/nares/.gemini/antigravity-ide/brain/6596df01-e716-4c38-847f-7e0edd403350/arjun_attendance_button_states.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot saved:", screenshotPath);

  await browser.close();
}

main().catch(console.error);
