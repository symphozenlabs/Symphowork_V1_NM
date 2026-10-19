import { readFileSync } from "fs";

async function login(email: string, password: string) {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  const cookieHeader = res.headers.get("set-cookie") || "";
  const cookie = cookieHeader.split(";")[0];
  return { status: res.status, data, cookie };
}

async function testEndpoint(name: string, url: string, cookie: string) {
  try {
    const res = await fetch(url, {
      headers: { Cookie: cookie },
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}
    console.log(`[${name}] ${url} -> Status: ${res.status}`);
    if (res.status >= 400) {
      console.log(`[${name}] Error response:`, text.slice(0, 500));
    } else {
      console.log(`[${name}] OK response preview:`, text.slice(0, 150));
    }
    return { status: res.status, body: json || text };
  } catch (err: any) {
    console.error(`[${name}] Fetch exception on ${url}:`, err.message);
    return { error: err.message };
  }
}

async function main() {
  console.log("=== STEP 1: Test Employee amit.employee@dev.local ===");
  const empLogin = await login("amit.employee@dev.local", "TestUser@2026#Sympho");
  console.log("Employee Login status:", empLogin.status, empLogin.data?.user?.email, "Cookie present:", !!empLogin.cookie);

  if (empLogin.cookie) {
    await testEndpoint("EMP UI", "http://localhost:3000/app/attendance", empLogin.cookie);
    await testEndpoint("EMP API Own Attendance", "http://localhost:3000/api/app/attendance", empLogin.cookie);
    await testEndpoint("EMP API Reminder", "http://localhost:3000/api/app/attendance/reminder", empLogin.cookie);
    await testEndpoint("EMP API Notifications", "http://localhost:3000/api/app/notifications", empLogin.cookie);
    
    // Try querying another employee or specific employeeId
    const employeeId = empLogin.data?.user?.employeeId || "some-emp-id";
    await testEndpoint("EMP API with own employeeId", `http://localhost:3000/api/app/attendance?employeeId=${employeeId}`, empLogin.cookie);
    await testEndpoint("EMP API with other employeeId", `http://localhost:3000/api/app/attendance?employeeId=00000000-0000-0000-0000-000000000000`, empLogin.cookie);
  }

  console.log("\n=== STEP 2: Test HR Admin arjunsharma@gmail.com ===");
  const hrLogin = await login("arjunsharma@gmail.com", "Naresh@27452005");
  console.log("HR Login status:", hrLogin.status, hrLogin.data?.user?.email, "Cookie present:", !!hrLogin.cookie);

  if (hrLogin.cookie) {
    await testEndpoint("HR UI", "http://localhost:3000/app/attendance", hrLogin.cookie);
    await testEndpoint("HR API Attendance", "http://localhost:3000/api/app/attendance", hrLogin.cookie);
    await testEndpoint("HR API Reminder", "http://localhost:3000/api/app/attendance/reminder", hrLogin.cookie);
    await testEndpoint("HR API Notifications", "http://localhost:3000/api/app/notifications", hrLogin.cookie);

    const empId = empLogin.data?.user?.employeeId;
    if (empId) {
      await testEndpoint("HR API Attendance for Amit", `http://localhost:3000/api/app/attendance?employeeId=${empId}`, hrLogin.cookie);
    }
  }

  console.log("\n=== STEP 3: Test Org Owner contact@nareshtechnologies.example ===");
  const ownerLogin = await login("contact@nareshtechnologies.example", "Naresh@27452005");
  console.log("Owner Login status:", ownerLogin.status, ownerLogin.data?.user?.email, "Cookie present:", !!ownerLogin.cookie);

  if (ownerLogin.cookie) {
    await testEndpoint("OWNER UI", "http://localhost:3000/app/attendance", ownerLogin.cookie);
    await testEndpoint("OWNER API Attendance", "http://localhost:3000/api/app/attendance", ownerLogin.cookie);
    const empId = empLogin.data?.user?.employeeId;
    if (empId) {
      await testEndpoint("OWNER API Attendance for Amit", `http://localhost:3000/api/app/attendance?employeeId=${empId}`, ownerLogin.cookie);
    }
  }
}

main().catch(console.error);
