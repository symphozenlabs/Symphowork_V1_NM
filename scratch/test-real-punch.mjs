async function main() {
  console.log("1. Logging in as Arjun Kumar...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "arjunsharma@gmail.com",
      password: "Naresh@27452005",
    }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  const loginBody = await loginRes.json();
  console.log("Login result:", loginBody);
  console.log("Cookie header:", cookieHeader ? "Cookie received" : "No cookie");

  const cookie = cookieHeader ? cookieHeader.split(";")[0] : "";

  console.log("\n2. Getting attendance status before punch...");
  const getRes = await fetch("http://localhost:3000/api/app/attendance", {
    headers: { cookie },
  });
  const getBody = await getRes.json();
  console.log("Attendance GET status:", getRes.status);
  console.log("Employee:", getBody.employee);
  console.log("Has shift:", getBody.hasShift);
  console.log("Shift:", getBody.shift?.name, `${getBody.shift?.startTime} - ${getBody.shift?.endTime}`);
  console.log("Records count:", getBody.records?.length);
  if (getBody.records?.[0]) {
    console.log("Existing record for today:", getBody.records[0].attendanceDate, "status:", getBody.records[0].status);
  }

  console.log("\n3. Testing attendance punch POST /api/app/attendance/punch...");
  const punchRes = await fetch("http://localhost:3000/api/app/attendance/punch", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({ type: "clock_in" }),
  });

  const punchBody = await punchRes.json();
  console.log("Punch HTTP Status:", punchRes.status);
  console.log("Punch Response Body:", JSON.stringify(punchBody, null, 2));

  if (punchRes.status === 200 && punchBody.success) {
    console.log("\n>>> PUNCH SUCCESSFUL! Arjun Kumar successfully clocked in for his own attendance!");
  } else if (punchRes.status === 409 && punchBody.error?.message?.includes("already clocked in")) {
    console.log("\n>>> PUNCH VALIDATION CONFIRMED: Already clocked in for this work date (business rule working correctly).");
  } else {
    console.error("\n>>> PUNCH FAILED:", punchBody);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
