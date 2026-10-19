async function test() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "arjunsharma@gmail.com", password: "Naresh@27452005" }),
  });
  const cookie = (loginRes.headers.get("set-cookie") || "").split(";")[0];

  console.log("Testing with employeeId=emp-nonexistent:");
  const res1 = await fetch("http://localhost:3000/api/app/attendance?employeeId=emp-nonexistent", {
    headers: { Cookie: cookie },
  });
  console.log("Status:", res1.status);
  console.log("Body:", await res1.text());

  console.log("\nTesting with employeeId=00000000-0000-0000-0000-000000000000 (valid UUID nonexistent):");
  const res2 = await fetch("http://localhost:3000/api/app/attendance?employeeId=00000000-0000-0000-0000-000000000000", {
    headers: { Cookie: cookie },
  });
  console.log("Status:", res2.status);
  console.log("Body:", await res2.text());
}

test().catch(console.error);
