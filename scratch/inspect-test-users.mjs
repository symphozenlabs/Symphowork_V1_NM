const users = [
  { email: "kavita.hr.exec@dev.local", pass: "TestUser@2026#Sympho", name: "Kavita Menon" },
  { email: "vikram.lead@dev.local", pass: "TestUser@2026#Sympho", name: "Vikram Mehta" },
  { email: "anand.manager@dev.local", pass: "TestUser@2026#Sympho", name: "Anand Rao" },
  { email: "suresh.finance@dev.local", pass: "TestUser@2026#Sympho", name: "Suresh Iyer" },
];

async function main() {
  for (const u of users) {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: u.email, password: u.pass }),
    });
    const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) continue;

    const res = await fetch("http://localhost:3000/api/app/attendance", { headers: { cookie } });
    const data = await res.json();
    console.log(`${u.name} (${u.email}):`, {
      hasShift: data.hasShift,
      shift: data.shift?.name,
      recordsCount: data.records?.length,
      today: data.records?.[0]?.attendanceDate,
      firstIn: data.records?.[0]?.actualFirstIn,
      lastOut: data.records?.[0]?.actualLastOut,
    });
  }
}

main().catch(console.error);
