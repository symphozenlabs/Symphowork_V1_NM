async function login(email: string, password: string) {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  const cookie = (res.headers.get("set-cookie") || "").split(";")[0];
  return { status: res.status, data, cookie };
}

async function main() {
  console.log("=== 1. Employee Login (Amit) ===");
  const empLogin = await login("amit.employee@dev.local", "TestUser@2026#Sympho");
  const empCookie = empLogin.cookie;

  console.log("=== 2. Employee views own attendance ===");
  const ownAttRes = await fetch("http://localhost:3000/api/app/attendance", {
    headers: { Cookie: empCookie },
  });
  const ownAtt = await ownAttRes.json();
  console.log("Own attendance status:", ownAttRes.status, "Success:", ownAtt.success, "Employee ID:", ownAtt.employee?.id, "Records count:", ownAtt.records?.length);
  const amitEmployeeId = ownAtt.employee?.id;

  console.log("=== 3. Employee attempts to punch on behalf of another employee ===");
  const fakeOtherId = "00000000-0000-0000-0000-000000000001";
  const punchOtherRes = await fetch("http://localhost:3000/api/app/attendance/punch", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: empCookie },
    body: JSON.stringify({ type: "clock_in", employeeId: fakeOtherId }),
  });
  const punchOtherData = await punchOtherRes.json();
  console.log("Punch other status:", punchOtherRes.status, "Response:", punchOtherData);

  console.log("=== 4. Employee attempts to view another employee's attendance ===");
  const viewOtherRes = await fetch(`http://localhost:3000/api/app/attendance?employeeId=${fakeOtherId}`, {
    headers: { Cookie: empCookie },
  });
  const viewOtherData = await viewOtherRes.json();
  console.log("View other status:", viewOtherRes.status, "Response:", viewOtherData);

  console.log("=== 5. HR Admin Login (Arjun Sharma) ===");
  const hrLogin = await login("arjunsharma@gmail.com", "Naresh@27452005");
  const hrCookie = hrLogin.cookie;

  console.log("=== 6. HR Admin inspects Amit's attendance ===");
  const hrInspectRes = await fetch(`http://localhost:3000/api/app/attendance?employeeId=${amitEmployeeId}`, {
    headers: { Cookie: hrCookie },
  });
  const hrInspectData = await hrInspectRes.json();
  console.log("HR inspect status:", hrInspectRes.status, "Success:", hrInspectData.success, "Inspected Employee:", hrInspectData.employee?.displayName);

  console.log("=== 7. Org Owner Login ===");
  const ownerLogin = await login("contact@nareshtechnologies.example", "Naresh@27452005");
  const ownerCookie = ownerLogin.cookie;

  console.log("=== 8. Org Owner inspects Amit's attendance ===");
  const ownerInspectRes = await fetch(`http://localhost:3000/api/app/attendance?employeeId=${amitEmployeeId}`, {
    headers: { Cookie: ownerCookie },
  });
  const ownerInspectData = await ownerInspectRes.json();
  console.log("Owner inspect status:", ownerInspectRes.status, "Success:", ownerInspectData.success, "Inspected Employee:", ownerInspectData.employee?.displayName);
}

main().catch(console.error);
