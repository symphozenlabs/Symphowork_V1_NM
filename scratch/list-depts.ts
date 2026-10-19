import { db } from "../src/db/client";
import { departments } from "../src/db/schema";

async function run() {
  const depts = await db.select().from(departments);
  console.log("Departments in DB:", depts);
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
