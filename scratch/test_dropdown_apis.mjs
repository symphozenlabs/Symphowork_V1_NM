import fs from "fs";

const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  return res.headers.get("set-cookie").split(";")[0];
}

async function testRole(name, email, password) {
  console.log(`\n================ Testing APIs for role: ${name} (${email}) ================`);
  const cookie = await login(email, password);
  const endpoints = [
    "/api/app/master-data/departments",
    "/api/app/master-data/designations",
    "/api/app/master-data/locations",
    "/api/app/master-data/shifts",
    "/api/app/master-data/employment-types",
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep}`, {
        headers: { Cookie: cookie, Connection: "close" },
      });
      const data = await res.json();
      console.log(`${ep.padEnd(40)} -> Status: ${res.status} | Success: ${data.success} | Items count: ${data.items ? data.items.length : 'N/A'}`);
      if (!res.ok || !data.success) {
        console.log(`   Error:`, data.error);
      } else if (data.items && data.items.length > 0) {
        console.log(`   Items:`, data.items.map(i => i.name || i.code));
      }
    } catch (err) {
      console.log(`${ep.padEnd(40)} -> Failed:`, err.message);
    }
  }
}

async function main() {
  const text = fs.readFileSync("crediantials.txt", "utf8");
  
  const ownerEmail = text.match(/Org Owner Email:\s*([^\r\n]+)/i)[1].trim();
  const ownerPass = text.match(/Org Owner Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i)[1].trim();

  const hrAdminEmail = text.match(/Org HR Admin Email:\s*([^\r\n]+)/i)[1].trim();
  const hrAdminPass = text.match(/Org HR Admin Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i)[1].trim();

  const hrExecMatch = text.match(/Org HR Executive Email:\s*([^\r\n]+)/i);
  let hrExecEmail = hrExecMatch ? hrExecMatch[1].trim() : null;
  let hrExecPass = null;
  if (hrExecEmail) {
    hrExecPass = text.match(/Org HR Executive Email:[^\r\n]+[\r\n]+Password:\s*([^\r\n]+)/i)[1].trim();
  }

  await testRole("ORGANIZATION_OWNER", ownerEmail, ownerPass);
  await testRole("HR_ADMIN", hrAdminEmail, hrAdminPass);
  if (hrExecEmail && hrExecPass) {
    await testRole("HR_EXECUTIVE", hrExecEmail, hrExecPass);
  }
}

main().catch(console.error);
