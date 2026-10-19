const fs = require("fs");

async function main() {
  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Testing live application on ${baseUrl}...`);

  // Read credentials safely from local file without printing secrets
  const creds = fs.readFileSync("crediantials.txt", "utf8");
  const emailMatch = creds.match(/Org HR Admin Email:\s*([^\r\n]+)/);
  const passMatch = creds.match(/Org HR Admin Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/);

  if (!emailMatch || !passMatch) {
    console.error("Failed to parse test credentials from crediantials.txt");
    process.exit(1);
  }

  const email = emailMatch[1].trim();
  const password = passMatch[1].trim();

  console.log(`Authenticating as: ${email}`);

  const loginStart = performance.now();
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginDuration = Math.round(performance.now() - loginStart);

  if (!loginRes.ok) {
    console.error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    process.exit(1);
  }

  const cookieHeader = loginRes.headers.get("set-cookie");
  const loginData = await loginRes.json();
  console.log(`Login SUCCESS in ${loginDuration}ms. Status: ${loginRes.status}`);

  if (!cookieHeader) {
    console.error("No set-cookie received from login!");
    process.exit(1);
  }

  const cookie = cookieHeader.split(";")[0];

  const routesToTest = [
    { name: "Dashboard Page", path: "/app", type: "RSC/Page" },
    { name: "Employees Page", path: "/app/employees", type: "RSC/Page" },
    { name: "Employees API (limit=1)", path: "/api/app/employees?limit=1", type: "API" },
    { name: "Employees API (limit=25)", path: "/api/app/employees?limit=25", type: "API" },
    { name: "Departments Page", path: "/app/departments", type: "RSC/Page" },
    { name: "Departments API", path: "/api/app/departments", type: "API" },
    { name: "Attendance Page", path: "/app/attendance", type: "RSC/Page" },
    { name: "Leave Page", path: "/app/leave", type: "RSC/Page" },
    { name: "Approvals Page", path: "/app/approvals", type: "RSC/Page" },
    { name: "Approvals API", path: "/api/app/approvals", type: "API" },
    { name: "Notifications Page", path: "/app/notifications", type: "RSC/Page" },
    { name: "Notifications API", path: "/api/app/notifications?unread=true", type: "API" },
    { name: "Payroll Page", path: "/app/payroll", type: "RSC/Page" },
  ];

  console.log("\n--- WARMING UP ROUTES (First compilation pass in dev mode) ---");
  for (const route of routesToTest) {
    const t0 = performance.now();
    try {
      const res = await fetch(`${baseUrl}${route.path}`, {
        headers: { Cookie: cookie, Accept: "text/html,application/json,*/*" },
      });
      const t1 = performance.now();
      const body = await res.text();
      console.log(`[Compile/Cold] ${route.name.padEnd(25)}: Status ${res.status} | Time: ${Math.round(t1 - t0)}ms | Size: ${body.length} bytes`);
    } catch (err) {
      console.error(`[Compile/Cold] ${route.name} failed:`, err.message);
    }
  }

  console.log("\n--- MEASURING WARM RUNTIME PERFORMANCE (Warm request pass) ---");
  const results = [];
  for (const route of routesToTest) {
    const samples = [];
    let lastStatus = 0;
    let lastSize = 0;

    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}${route.path}`, {
        headers: { Cookie: cookie, Accept: "text/html,application/json,*/*" },
      });
      const t1 = performance.now();
      const body = await res.text();
      lastStatus = res.status;
      lastSize = body.length;
      samples.push(Math.round(t1 - t0));
    }

    const minTime = Math.min(...samples);
    const avgTime = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    results.push({
      name: route.name,
      path: route.path,
      type: route.type,
      status: lastStatus,
      size: lastSize,
      minTime,
      avgTime,
      samples,
    });

    console.log(`[Warm] ${route.name.padEnd(25)}: Status ${lastStatus} | Avg: ${avgTime}ms | Min: ${minTime}ms | Size: ${lastSize} bytes | Samples: [${samples.join(", ")}]ms`);
  }

  console.log("\n--- SUMMARY OF MEASURED RESULTS ---");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
