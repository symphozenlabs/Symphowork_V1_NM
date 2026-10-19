async function test() {
  async function testLogin(email, pwd) {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pwd }),
    });
    return res.headers.get("set-cookie")?.split(";")[0] || "";
  }

  // 1. Owner
  const ownerCookie = await testLogin("contact@nareshtechnologies.example", "Naresh@27452005");
  const ownerRes = await fetch("http://localhost:3000/api/app/attendance/organization", {
    headers: { cookie: ownerCookie },
  });
  const ownerData = await ownerRes.json();
  console.log("OWNER STATUS:", ownerRes.status);
  console.log("OWNER SUMMARY:", JSON.stringify(ownerData.summary));
  console.log("OWNER EMPLOYEES COUNT:", ownerData.employees?.length);

  // 2. HR Admin
  const hrAdminCookie = await testLogin("arjunsharma@gmail.com", "Naresh@27452005");
  const hrAdminRes = await fetch("http://localhost:3000/api/app/attendance/organization", {
    headers: { cookie: hrAdminCookie },
  });
  console.log("HR ADMIN STATUS:", hrAdminRes.status);

  // 3. HR Executive
  const hrExecCookie = await testLogin("kavita.hr.exec@dev.local", "TestUser@2026#Sympho");
  const hrExecRes = await fetch("http://localhost:3000/api/app/attendance/organization", {
    headers: { cookie: hrExecCookie },
  });
  console.log("HR EXEC STATUS:", hrExecRes.status);

  // 4. Employee (must be 403)
  const empCookie = await testLogin("amit.employee@dev.local", "TestUser@2026#Sympho");
  const empRes = await fetch("http://localhost:3000/api/app/attendance/organization", {
    headers: { cookie: empCookie },
  });
  console.log("EMPLOYEE STATUS (EXPECT 403):", empRes.status);

  // 5. CSV Export
  const csvRes = await fetch("http://localhost:3000/api/app/attendance/organization?format=csv", {
    headers: { cookie: ownerCookie },
  });
  const csvText = await csvRes.text();
  console.log("CSV EXPORT STATUS:", csvRes.status, "HEADER LINE:", csvText.split("\r\n")[0]);
}

test().catch(console.error);
