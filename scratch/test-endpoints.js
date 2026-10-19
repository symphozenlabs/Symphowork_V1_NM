async function run() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "arjunsharma@gmail.com",
      password: "Naresh@27452005"
    })
  });
  console.log("Login status:", loginRes.status);
  const cookieHeader = loginRes.headers.get("set-cookie");
  const body = await loginRes.json();
  console.log("Login body:", body);

  if (!cookieHeader) {
    console.error("No cookie returned!");
    return;
  }
  const cookies = cookieHeader.split(";")[0];

  const endpoints = [
    "/app",
    "/app/departments",
    "/app/work",
    "/api/app/employees?limit=1",
    "/api/app/approvals",
    "/api/app/notifications?unread=true",
    "/api/app/projects",
    "/api/app/tasks",
    "/api/app/departments",
    "/api/app/departments/eligible-managers"
  ];

  for (const ep of endpoints) {
    const res = await fetch("http://localhost:3000" + ep, {
      headers: { Cookie: cookies }
    });
    console.log(`Endpoint ${ep} -> status ${res.status}`);
    if (res.status !== 200) {
      const text = await res.text();
      console.log(`Response for ${ep}:`, text.slice(0, 300));
    }
  }
}

run().catch(console.error);
