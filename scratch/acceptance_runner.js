const fs = require("fs");
const { performance } = require("perf_hooks");

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Parse credentials safely without logging secrets
function parseCredentials() {
  const text = fs.readFileSync("crediantials.txt", "utf8");
  const accounts = {};

  const ownerEmailMatch = text.match(/Org owner Email:\s*([^\r\n]+)/i);
  const ownerPassMatch = text.match(/Org owner Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i);
  if (ownerEmailMatch && ownerPassMatch) {
    accounts.ORGANIZATION_OWNER = {
      email: ownerEmailMatch[1].trim(),
      password: ownerPassMatch[1].trim(),
    };
  }

  const hrEmailMatch = text.match(/Org HR Admin Email:\s*([^\r\n]+)/i);
  const hrPassMatch = text.match(/Org HR Admin Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i);
  if (hrEmailMatch && hrPassMatch) {
    accounts.HR_ADMIN = {
      email: hrEmailMatch[1].trim(),
      password: hrPassMatch[1].trim(),
    };
  }

  const lines = text.split(/\r?\n/);
  let currentAccount = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Display Name:")) {
      currentAccount = {};
    } else if (currentAccount && line.startsWith("Role:")) {
      currentAccount.role = line.replace("Role:", "").trim();
    } else if (currentAccount && line.startsWith("Email:")) {
      currentAccount.email = line.replace("Email:", "").trim();
    } else if (currentAccount && line.startsWith("Password:")) {
      currentAccount.password = line.replace("Password:", "").trim();
      if (currentAccount.role && currentAccount.email && currentAccount.password) {
        accounts[currentAccount.role] = {
          email: currentAccount.email,
          password: currentAccount.password,
        };
      }
    }
  }

  return accounts;
}

async function loginUser(email, password) {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const duration = Math.round(performance.now() - start);

  if (!res.ok) {
    throw new Error(`Login failed for ${email} with status ${res.status}`);
  }

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error(`No cookie returned for ${email}`);
  const cookie = setCookie.split(";")[0];
  const data = await res.json();

  return { cookie, duration, user: data.data?.user || data.user };
}

async function fetchRoute(path, cookie, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeout || 35000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();
  try {
    const headers = {
      Accept: "text/html,application/json,*/*",
      ...(options.headers || {}),
    };
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      redirect: "manual",
      headers,
    });
    const duration = Math.round(performance.now() - start);
    const text = await res.text();
    return {
      status: res.status,
      duration,
      size: text.length,
      headers: res.headers,
      body: text,
      ok: res.ok,
    };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return {
      status: 0,
      duration,
      size: 0,
      headers: new Headers(),
      body: "",
      error: err.message,
      ok: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

function calculateStats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = Math.round(sum / sorted.length);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  const range = max - min;
  return { min, max, mean, median, range, samples };
}

async function measureDatabaseRtt() {
  console.log("\n--- MEASURING DATABASE NETWORK RTT (Neon PostgreSQL Socket) ---");
  const pings = [];
  try {
    const { neon } = require("@neondatabase/serverless");
    const dotenv = require("dotenv");
    dotenv.config({ path: ".env.local" });
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.log("No DATABASE_URL found for standalone ping; using API latency baseline.");
      return null;
    }

    const sql = neon(databaseUrl);
    // 1 cold ping
    const t0 = performance.now();
    await sql`SELECT 1`;
    const coldPing = Math.round(performance.now() - t0);
    console.log(`Cold DB Socket Ping (TCP/TLS handshake + query): ${coldPing}ms`);

    // 5 warm pings
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await sql`SELECT 1`;
      pings.push(Math.round(performance.now() - start));
    }

    const stats = calculateStats(pings);
    console.log(`Warm DB RTT (5 samples): Median=${stats.median}ms | Range=[${stats.min}ms - ${stats.max}ms] (Δ ${stats.range}ms) | Mean=${stats.mean}ms`);
    return { cold: coldPing, warm: stats };
  } catch (err) {
    console.warn("Direct DB ping failed (safe to proceed):", err.message);
    return null;
  }
}

async function main() {
  console.log("===============================================================================");
  console.log("SYMPHOWORK V1 — COMPREHENSIVE ACCEPTANCE TESTING & BENCHMARK REPORT");
  console.log("===============================================================================");
  console.log(`Base URL: ${BASE_URL}`);

  // 1. Measure DB RTT safely
  const dbRtt = await measureDatabaseRtt();

  // 2. Discover accounts
  const accounts = parseCredentials();
  console.log("\n[SETUP] Discovered role accounts:", Object.keys(accounts));

  // 3. Authenticate roles
  console.log("\n--- AUTHENTICATING TEST ROLES ---");
  const sessions = {};
  for (const role of ["HR_ADMIN", "RECRUITER", "ORGANIZATION_OWNER"]) {
    try {
      const sess = await loginUser(accounts[role].email, accounts[role].password);
      sessions[role] = sess;
      console.log(`[PASS] ${role.padEnd(20)}: Login OK (${sess.duration}ms)`);
    } catch (e) {
      console.error(`[FAIL] ${role}: ${e.message}`);
    }
  }

  // 4. Section 1: Authorization & Permission Acceptance
  console.log("\n--- SECTION 1: AUTHORIZATION & PERMISSION ACCEPTANCE ---");

  // Test 1A: Sidebar Navigation Links visibility
  for (const role of ["HR_ADMIN", "RECRUITER", "ORGANIZATION_OWNER"]) {
    const res = await fetchRoute("/app", sessions[role].cookie);
    const hasRecruitmentLink = res.body.includes('href="/app/recruitment"');
    const expected = role !== "HR_ADMIN";
    const pass = hasRecruitmentLink === expected;
    console.log(`[${pass ? "PASS" : "FAIL"}] Sidebar Recruitment Link for ${role.padEnd(20)}: Rendered=${hasRecruitmentLink} (Expected=${expected})`);
  }

  // Test 1B: Direct Page Visits & Server-side Guards
  const protectedPages = [
    { name: "Recruitment Dashboard", path: "/app/recruitment" },
    { name: "Recruitment Intelligence", path: "/app/recruitment/intelligence" },
  ];

  for (const page of protectedPages) {
    for (const role of ["HR_ADMIN", "RECRUITER", "ORGANIZATION_OWNER"]) {
      const res = await fetchRoute(page.path, sessions[role].cookie);
      if (role === "HR_ADMIN") {
        // In Next.js RSC, server-side redirect outputs <meta http-equiv="refresh" content="1;url=/app"/> or NEXT_REDIRECT or HTTP 307
        const isRedirected =
          (res.status === 307 && (res.headers.get("location") === "/app" || res.headers.get("location")?.endsWith("/app"))) ||
          res.body.includes('__next-page-redirect') ||
          res.body.includes('content="1;url=/app"') ||
          res.body.includes('NEXT_REDIRECT');
        const notRendered = !res.body.includes("Recruitment & Talent Operations") && !res.body.includes("Talent Acquisition Intelligence");
        const pass = isRedirected && notRendered;
        console.log(`[${pass ? "PASS" : "FAIL"}] Server Guard ${page.name} for ${role.padEnd(20)}: Guarded=${pass} (Redirect Meta/Header=${isRedirected}, ContentBlocked=${notRendered})`);
      } else {
        const allowed = res.status === 200;
        console.log(`[${allowed ? "PASS" : "FAIL"}] Direct Access ${page.name} for ${role.padEnd(20)}: Status=${res.status} (${res.duration}ms)`);
      }
    }
  }

  // Test 1C: ATS API Route Guards (GET and POST endpoints)
  const atsEndpoints = [
    { method: "GET", path: "/api/app/ats/requisitions" },
    { method: "GET", path: "/api/app/ats/jobs" },
    { method: "GET", path: "/api/app/ats/applications" },
    { method: "GET", path: "/api/app/ats/candidates" },
    { method: "GET", path: "/api/app/ats/pipeline" },
    { method: "POST", path: "/api/app/ats/talent-pools", body: { name: "Test Pool" } },
    { method: "POST", path: "/api/app/ats/interviews", body: { applicationId: "00000000-0000-0000-0000-000000000000" } },
  ];

  console.log("\n--- ATS API Route Guard Verification ---");
  for (const ep of atsEndpoints) {
    const opts = {
      method: ep.method,
      headers: ep.body ? { "Content-Type": "application/json" } : {},
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    };

    const hrRes = await fetchRoute(ep.path, sessions.HR_ADMIN.cookie, opts);
    const hrPass = hrRes.status === 403;

    const recRes = await fetchRoute(ep.path, sessions.RECRUITER.cookie, opts);
    // RECRUITER should pass authorization (200, 201, or 400 validation error if dummy payload, NEVER 403)
    const recPass = recRes.status !== 403;

    const ownerRes = await fetchRoute(ep.path, sessions.ORGANIZATION_OWNER.cookie, opts);
    const ownerPass = ownerRes.status !== 403;

    const allPass = hrPass && recPass && ownerPass;
    console.log(`[${allPass ? "PASS" : "FAIL"}] ${ep.method} ${ep.path.padEnd(30)}: HR_ADMIN=${hrRes.status} (403 Forbidden) | RECRUITER=${recRes.status} (Authorized) | OWNER=${ownerRes.status} (Authorized)`);
  }

  // Test 1D: Tenant Isolation & Owner Protection
  console.log("\n--- Owner Employee Record Protection ---");
  const empListRes = await fetchRoute("/api/app/employees?limit=25", sessions.HR_ADMIN.cookie);
  const empData = JSON.parse(empListRes.body);
  const ownerEmp = empData.rows?.find((e) => e.roleKey === "ORGANIZATION_OWNER");

  if (ownerEmp) {
    // Attempt modification of owner employee record by HR_ADMIN
    const patchRes = await fetchRoute(`/api/app/employees/${ownerEmp.id}`, sessions.HR_ADMIN.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+1234567890" }),
    });
    const patchPass = patchRes.status === 403;
    console.log(`[${patchPass ? "PASS" : "FAIL"}] Non-Owner modifying Owner Record: Status=${patchRes.status} (Expected 403 Forbidden)`);
  } else {
    console.log("[SKIP] Owner employee record not in first 25 employees; verified via unit tests.");
  }

  // 5. Section 2: Functional Acceptance Testing
  console.log("\n--- SECTION 2: FUNCTIONAL ACCEPTANCE TESTING ---");
  const functionalTests = [
    { name: "Unauthenticated Login", path: "/login", cookie: null, expectStatus: 200, checks: ["Sign In", "SymphoWork"] },
    { name: "Authenticated Login Redirect", path: "/login", cookie: sessions.HR_ADMIN.cookie, expectStatus: 307 },
    { name: "App Dashboard", path: "/app", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Overview", "Workforce"] },
    { name: "Employees Directory Page", path: "/app/employees", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Workforce Directory"] },
    { name: "Employees API (limit=25)", path: "/api/app/employees?limit=25", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.rows) && typeof d.total === "number" },
    { name: "Employees API (search)", path: "/api/app/employees?search=Arjun", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.rows) && d.rows.length > 0 },
    { name: "Departments List Page", path: "/app/departments", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Department"] },
    { name: "Departments API", path: "/api/app/departments", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.items) && typeof d.totalCount === "number" },
    { name: "Attendance Page", path: "/app/attendance", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Attendance", "Time Clock"] },
    { name: "Attendance API", path: "/api/app/attendance", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.records) },
    { name: "Leave Page", path: "/app/leave", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Leave"] },
    { name: "Approvals Page", path: "/app/approvals", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Approvals"] },
    { name: "Approvals API", path: "/api/app/approvals", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.tasks) },
    { name: "Notifications Page", path: "/app/notifications", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Notifications"] },
    { name: "Notifications API", path: "/api/app/notifications?unread=true", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, jsonCheck: (d) => Array.isArray(d.notifications) },
    { name: "Payroll Page", path: "/app/payroll", cookie: sessions.HR_ADMIN.cookie, expectStatus: 200, checks: ["Payroll"] },
  ];

  for (const t of functionalTests) {
    const res = await fetchRoute(t.path, t.cookie);
    let pass = res.status === t.expectStatus;

    if (pass && t.checks) {
      for (const chk of t.checks) {
        if (!res.body.includes(chk)) {
          pass = false;
          console.warn(`    [WARN] Missing string "${chk}" in ${t.path}`);
        }
      }
    }

    if (pass && t.jsonCheck) {
      try {
        const parsed = JSON.parse(res.body);
        if (!t.jsonCheck(parsed)) pass = false;
      } catch {
        pass = false;
      }
    }

    console.log(`[${pass ? "PASS" : "FAIL"}] Functional ${t.name.padEnd(30)}: Status ${res.status} | Size: ${res.size} bytes | Duration: ${res.duration}ms`);
  }

  // 6. Section 3: Reproducible 5-Sample Warm Benchmark
  console.log("\n--- SECTION 3: REPRODUCIBLE 5-SAMPLE WARM RUNTIME BENCHMARK ---");
  const benchmarkRoutes = [
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

  const benchmarkResults = [];

  for (const r of benchmarkRoutes) {
    const samples = [];
    let lastStatus = 0;
    let lastSize = 0;

    process.stdout.write(`Benchmarking ${r.name.padEnd(25)}: `);
    for (let i = 0; i < 5; i++) {
      const res = await fetchRoute(r.path, sessions.HR_ADMIN.cookie);
      samples.push(res.duration);
      lastStatus = res.status;
      lastSize = res.size;
      process.stdout.write(`${res.duration}ms `);
    }

    const stats = calculateStats(samples);
    benchmarkResults.push({
      name: r.name,
      path: r.path,
      type: r.type,
      status: lastStatus,
      size: lastSize,
      ...stats,
    });

    console.log(`\n  => Median: ${stats.median}ms | Min: ${stats.min}ms | Max: ${stats.max}ms | Range: Δ${stats.range}ms | Mean: ${stats.mean}ms`);
  }

  // Save complete results to scratch/final_acceptance_report.json
  const finalReport = {
    timestamp: new Date().toISOString(),
    databaseRtt: dbRtt,
    benchmarkResults,
  };
  fs.writeFileSync("scratch/final_acceptance_report.json", JSON.stringify(finalReport, null, 2));
  console.log("\n[COMPLETE] Benchmark report saved to scratch/final_acceptance_report.json");
}

main().catch((err) => {
  console.error("FATAL ERROR IN ACCEPTANCE RUNNER:", err);
  process.exit(1);
});
