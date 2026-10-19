const fs = require("fs");
const { performance } = require("perf_hooks");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  console.log("===============================================================================");
  console.log("SYMPHOWORK V1 — 5-SAMPLE WARM RUNTIME PERFORMANCE BENCHMARK");
  console.log("===============================================================================");

  const text = fs.readFileSync("crediantials.txt", "utf8");
  const email = text.match(/Org HR Admin Email:\s*([^\r\n]+)/i)[1].trim();
  const password = text.match(/Org HR Admin Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i)[1].trim();

  // Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status);
    process.exit(1);
  }

  const cookie = loginRes.headers.get("set-cookie").split(";")[0];
  console.log("Authenticated successfully as HR_ADMIN.");

  const routes = [
    { name: "Dashboard Page", path: "/app", type: "RSC/Page" },
    { name: "Employees Page", path: "/app/employees", type: "RSC/Page" },
    { name: "Employees API (limit=1)", path: "/api/app/employees?limit=1", type: "API" },
    { name: "Employees API (limit=25)", path: "/api/app/employees?limit=25", type: "API" },
    { name: "Departments Page", path: "/app/departments", type: "RSC/Page" },
    { name: "Departments API", path: "/api/app/departments", type: "API" },
    { name: "Attendance Page", path: "/app/attendance", type: "RSC/Page" },
    { name: "Attendance API", path: "/api/app/attendance", type: "API" },
    { name: "Leave Page", path: "/app/leave", type: "RSC/Page" },
    { name: "Approvals Page", path: "/app/approvals", type: "RSC/Page" },
    { name: "Approvals API", path: "/api/app/approvals", type: "API" },
    { name: "Notifications Page", path: "/app/notifications", type: "RSC/Page" },
    { name: "Notifications API", path: "/api/app/notifications?unread=true", type: "API" },
    { name: "Payroll Page", path: "/app/payroll", type: "RSC/Page" },
  ];

  const results = [];

  for (const r of routes) {
    process.stdout.write(`Testing ${r.name.padEnd(26)}: `);
    const samples = [];
    let lastStatus = 0;
    let lastSize = 0;

    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${r.path}`, {
          headers: { Cookie: cookie, Connection: "close" },
        });
        const duration = Math.round(performance.now() - t0);
        const text = await res.text();
        samples.push(duration);
        lastStatus = res.status;
        lastSize = text.length;
        process.stdout.write(`${duration}ms `);
      } catch (err) {
        process.stdout.write(`[ERR] `);
      }
    }

    if (samples.length > 0) {
      const sorted = [...samples].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = Math.round(sum / sorted.length);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      const range = max - min;

      console.log(`\n  => Median: ${median}ms | Min: ${min}ms | Max: ${max}ms | Range: Δ${range}ms | Mean: ${mean}ms | Status: ${lastStatus} | Size: ${lastSize}B`);

      results.push({
        name: r.name,
        path: r.path,
        type: r.type,
        status: lastStatus,
        size: lastSize,
        min,
        max,
        mean,
        median,
        range,
        samples,
      });
    } else {
      console.log(`\n  => FAILED ALL SAMPLES`);
    }
  }

  fs.writeFileSync("scratch/benchmark_5x_results.json", JSON.stringify(results, null, 2));
  console.log("\nSaved benchmark results to scratch/benchmark_5x_results.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
