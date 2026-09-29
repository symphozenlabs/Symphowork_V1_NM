import dotenv from "dotenv";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { eq, or, sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const EMAIL_ENV = "BOOTSTRAP_PLATFORM_OWNER_EMAIL";
const NAME_ENV = "BOOTSTRAP_PLATFORM_OWNER_NAME";
const PASSWORD_ENV = "BOOTSTRAP_PLATFORM_OWNER_PASSWORD";

function readRequiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

async function promptValue(rl: ReturnType<typeof createInterface>, label: string, environmentName: string) {
  return readRequiredEnvironment(environmentName) ?? (await rl.question(`${label}: `)).trim();
}

async function promptSecret(label: string, environmentName: string) {
  const fromEnvironment = readRequiredEnvironment(environmentName);
  if (fromEnvironment) return fromEnvironment;
  if (!input.isTTY || !output.isTTY) throw new Error(`${environmentName} is required when no interactive terminal is available.`);

  output.write(`${label}: `);
  input.setRawMode(true);
  input.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      const character = chunk.toString("utf8");
      if (character === "\u0003") {
        cleanup();
        reject(new Error("Bootstrap cancelled."));
      } else if (character === "\r" || character === "\n") {
        cleanup();
        output.write("\n");
        resolve(value);
      } else if (character === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    };
    const cleanup = () => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
    };
    input.on("data", onData);
  });
}

function validateInput(email: string, name: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) throw new Error("A valid owner email is required.");
  if (!name || name.length > 160) throw new Error("A valid owner name is required.");
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("The owner password must be 12 characters with upper, lower, and numeric characters.");
  }
}

async function main() {
  if (!readRequiredEnvironment("DATABASE_URL")) throw new Error("DATABASE_URL is required.");

  const rl = createInterface({ input, output });
  try {
    const email = (await promptValue(rl, "Platform Owner email", EMAIL_ENV)).toLowerCase();
    const name = await promptValue(rl, "Platform Owner name", NAME_ENV);
    rl.close();
    const password = await promptSecret("Platform Owner password", PASSWORD_ENV);
    validateInput(email, name, password);

    const [{ db, sql: database }] = await Promise.all([import("@/db/client")]);
    const [{ auditLogs, users }, { hashPassword }] = await Promise.all([import("@/db/schema"), import("@/lib/crypto")]);

    try {
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext('symphowork:first-platform-owner'))`);
        const highAuthority = await tx.select({ id: users.id, email: users.email, platformRole: users.platformRole, status: users.status, emailVerifiedAt: users.emailVerifiedAt }).from(users).where(or(eq(users.platformRole, "PLATFORM_OWNER"), eq(users.platformRole, "PRODUCT_OWNER")));
        const existingOwner = highAuthority[0];
        if (existingOwner) {
          if (existingOwner.email !== email) throw new Error("A high-authority platform user already exists; no new owner was created.");
          if (existingOwner.platformRole !== "PLATFORM_OWNER" || existingOwner.status !== "active" || !existingOwner.emailVerifiedAt) throw new Error("The requested owner identity already exists but is not an active verified Platform Owner.");
          return { created: false };
        }

        const existingEmail = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
        if (existingEmail.length) throw new Error("That email already belongs to an application user; no changes were made.");
        const [user] = await tx.insert(users).values({ email, fullName: name, passwordHash: await hashPassword(password), mustChangePassword: true, platformRole: "PLATFORM_OWNER", emailVerifiedAt: new Date() }).returning({ id: users.id });
        await tx.insert(auditLogs).values({ actorUserId: user.id, action: "platform_owner_bootstrap", resource: "user", resourceId: user.id, metadata: JSON.stringify({ method: "controlled_cli" }) });
        return { created: true };
      });
      console.log(result.created ? "Initial Platform Owner created." : "Initial Platform Owner already exists; no changes made.");
    } finally {
      await database.end();
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Platform Owner bootstrap failed.");
  process.exitCode = 1;
});
