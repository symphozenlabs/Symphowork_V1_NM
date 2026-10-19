async function main() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "arjunsharma@gmail.com",
      password: "Naresh@27452005",
    }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  const cookie = cookieHeader ? cookieHeader.split(";")[0] : "";

  const res = await fetch("http://localhost:3000/api/app/attendance", {
    headers: { cookie },
  });

  const data = await res.json();
  console.log("RECORD:", JSON.stringify(data.records?.[0], null, 2));
  console.log("PUNCHES:", JSON.stringify(data.punches, null, 2));
  console.log("SHIFT:", JSON.stringify(data.shift, null, 2));
}

main().catch(console.error);
