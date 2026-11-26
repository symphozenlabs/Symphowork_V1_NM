// Build first. Set PG_BIN to a local PostgreSQL bin directory containing initdb and pg_ctl.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import assert from "node:assert/strict";
import postgres from "postgres";

const dir = mkdtempSync(path.join(tmpdir(), "sw-communication-"));
const pw = randomUUID(),
  data = path.join(dir, "data"),
  root = process.cwd();
const bin = (name) =>
  path.join(
    process.env.PG_BIN,
    name + (process.platform === "win32" ? ".exe" : ""),
  );
const key = path.join(dir, "key");
writeFileSync(key, pw + "\n", { mode: 0o600 });
const probe = net.createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
execFileSync(bin("initdb"), [
  "-D",
  data,
  "-U",
  "postgres",
  "-A",
  "scram-sha-256",
  "--pwfile=" + key,
  "--encoding=UTF8",
  "--locale=C",
]);
execFileSync(bin("pg_ctl"), [
  "-D",
  data,
  "-l",
  path.join(dir, "pg.log"),
  "-o",
  "-p " + port + " -h 127.0.0.1",
  "start",
], {stdio:"ignore",windowsHide:true});
const sql = postgres({
  host: "127.0.0.1",
  port,
  username: "postgres",
  database: "postgres",
  password: pw,
  onnotice: () => {},
});
let app, scanner;
try {
  await sql.unsafe("CREATE ROLE sympowork_app LOGIN PASSWORD '" + pw + "'");
  for (const f of readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await sql.unsafe(
      readFileSync("drizzle/" + f, "utf8").replaceAll(
        "--> statement-breakpoint",
        "\n",
      ),
    );
  await sql.unsafe(
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sympowork_app",
  );
  const sessions = {};
  let org;
  for (const role of [
    "PLATFORM_SUPPORT",
    "PLATFORM_OWNER",
    "PRODUCT_OWNER",
    "PLATFORM_ADMIN",
    "PLATFORM_BILLING",
    "EMPLOYEE",
    "ORGANIZATION_OWNER",
    "HR_ADMIN",
    "OTHER_ORG",
  ]) {
    const platform = role.startsWith("PLATFORM") || role === "PRODUCT_OWNER";
    const [u] =
      await sql`insert into users(email,full_name,password_hash,platform_role) values(${role + "@example.test"},${role},'unused',${platform ? role : "NONE"}) returning id`;
    if (!platform) {
      if (!org || role === "OTHER_ORG")
        [org] =
          await sql`insert into organizations(name,legal_name,slug,status) values(${role},${role},${role.toLowerCase()},'active') returning id`;
      const [r] =
        await sql`insert into roles(organization_id,name,key) values(${org.id},${role},${role === "OTHER_ORG" ? "EMPLOYEE" : role}) returning id`;
      await sql`insert into memberships(user_id,organization_id,role_id,status) values(${u.id},${org.id},${r.id},'active')`;
    }
    const token = randomUUID();
    await sql`insert into sessions(user_id,token_hash,expires_at) values(${u.id},${createHash("sha256").update(token).digest("hex")},now()+interval '1 hour')`;
    sessions[role] = { token, id: u.id, org: org?.id };
  }
  const sessionFile = path.join(dir, "sessions.json");
  writeFileSync(sessionFile, JSON.stringify(sessions), { mode: 0o600 });
  // Synthetic clamd protocol fixture. No production scanner or storage is contacted.

  scanner = net.createServer((s) => {
    let buffer = Buffer.alloc(0);
    s.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length < 14) return;
      let cursor = 10;
      while (cursor + 4 <= buffer.length) {
        const len = buffer.readUInt32BE(cursor);
        cursor += 4;
        if (!len) {
          s.end(
            buffer.includes("test-infected-file")
              ? "stream: Fixture FOUND\0"
              : "stream: OK\0",
          );
          return;
        }
        cursor += len;
      }
    });
  });
  await new Promise((resolve) => scanner.listen(0, "127.0.0.1", resolve));
  process.env.CLAMAV_HOST = "127.0.0.1";
  process.env.CLAMAV_PORT = String(scanner.address().port);

  const env = {
    ...process.env,
    DATABASE_URL:
      "postgres://sympowork_app:" + pw + "@127.0.0.1:" + port + "/postgres",
    HOST: "127.0.0.1",
    PORT: "4199",
    ORIGIN: "http://127.0.0.1:4199",
    BODY_SIZE_LIMIT: "3M",
    OBJECT_STORAGE_PROVIDER: "local",
    SUPPORT_TEST_SESSIONS: sessionFile,
  };
  app = spawn(process.execPath, [path.join(root, "build/index.js")], {
    cwd: dir,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise((resolve, reject) => {
    app.stdout.on("data", (d) => {
      if (d.toString().includes("Listening")) resolve();
    });
    app.once("exit", (code) => reject(new Error("Server exited " + code)));
  });
  process.env.SUPPORT_TEST_SESSIONS = sessionFile;
  await import("./verify-support-communication.mjs");
  const audit =
    await sql`select action,metadata from audit_logs where action like 'support_%'`;
  for (const action of [
    "support_attachment_uploaded",
    "support_attachment_accessed",
    "support_submission_created",
    "support_private_reply_sent",
    "support_announcement_published",
    "support_announcement_recipient_snapshot_created",
    "support_communication_access_denied",
  ])
    assert.ok(
      audit.some((row) => row.action === action),
      action,
    );
  for (const row of audit) {
    assert.ok(JSON.parse(row.metadata).actorRole);
    assert.doesNotMatch(
      row.metadata,
      /example\.test|storageKey|Private response|Synthetic announcement/,
    );
  }
  const [member] =
    await sql`select role_id,organization_id from memberships where user_id=${sessions.EMPLOYEE.id}`;
  const [late] =
    await sql`insert into users(email,full_name,password_hash) values('late@example.test','Late member','unused') returning id`;
  await sql`insert into memberships(user_id,role_id,organization_id,status) values(${late.id},${member.role_id},${member.organization_id},'active')`;
  const token = randomUUID();
  await sql`insert into sessions(user_id,token_hash,expires_at) values(${late.id},${createHash("sha256").update(token).digest("hex")},now()+interval '1 hour')`;
  const headers = { cookie: "symphowork_session=" + token };
  const lateWorkspace = await fetch(env.ORIGIN + "/api/app/support", {
    headers,
  });
  assert.deepEqual((await lateWorkspace.json()).announcements, []);
  const [announcement] =
    await sql`select id, title, body from support_announcements limit 1`;
  assert.equal(
    (
      await fetch(env.ORIGIN + "/api/app/support/announcements/" + announcement.id, {
        headers,
      })
    ).status,
    404,
  );
  const latePageRes = await fetch(env.ORIGIN + "/app/support?announcement=" + announcement.id, {
    headers,
  });
  assert.equal(latePageRes.status, 200);
  const lateHtml = await latePageRes.text();
  assert.ok(lateHtml.includes("This announcement is unavailable or you are not an authorized recipient."));
  assert.ok(!lateHtml.includes(announcement.body));
  console.log(
    "Verified audit events and publish-time snapshot isolation for a later member.",
  );
} finally {
  if (app && app.exitCode === null) {
    const exited = new Promise((resolve) => app.once("exit", resolve));
    app.kill();
    await exited;
  }
  scanner?.close();
  await sql.end();
  execFileSync(bin("pg_ctl"), ["-D", data, "-m", "fast", "stop"]);
}
