async function main() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "amit.employee@dev.local",
      password: "TestUser@2026#Sympho",
    }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  const cookie = cookieHeader ? cookieHeader.split(";")[0] : "";

  const res = await fetch("http://localhost:3000/api/app/attendance", {
    headers: { cookie },
  });

  const data = await res.json();
  console.log("AMIT DATA:\n", JSON.stringify({
    success: data.success,
    hasShift: data.hasShift,
    shift: data.shift?.name,
    recordsCount: data.records?.length,
    todayRecord: data.records?.[0] ? {
      date: data.records[0].attendanceDate,
      firstIn: data.records[0].actualFirstIn,
      lastOut: data.records[0].actualLastOut,
      status: data.records[0].status,
    } : null,
  }, null, 2));
}

main().catch(console.error);
