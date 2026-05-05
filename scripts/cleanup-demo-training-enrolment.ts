/**
 * Cleanup: Remove enrollment + transactions for Demo Skill Development Course
 *
 * Training ID : bb108e64-dc1d-4f7c-8831-f49d1439613c
 * Enrollment ID: 2a4b7506-801b-4f13-a740-ad7961edd794
 * User ID      : d580a1d6-3a7d-49c9-b49b-970f17c1c5b9
 *
 * Deletes (in order):
 *   1. All transactions linked to this enrollment
 *   2. The enrollment record itself
 *
 * Everything else (training, user, partner) is PRESERVED.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const TRAINING_ID  = "bb108e64-dc1d-4f7c-8831-f49d1439613c";
const ENROLMENT_ID = "2a4b7506-801b-4f13-a740-ad7961edd794";

const DB_URL =
  process.env.DB_MODE === "prod"
    ? process.env.DB_URL_PROD
    : process.env.DB_URL_LOCAL;

if (!DB_URL) {
  console.error("❌ No DB_URL found. Check your .env file.");
  process.exit(1);
}

const db = drizzle(DB_URL, { schema, casing: "snake_case" });

async function main() {
  console.log("=".repeat(60));
  console.log("🧹  Cleanup: Demo Training Enrollment");
  console.log("=".repeat(60));
  console.log(`  DB Mode     : ${process.env.DB_MODE ?? "local"}`);
  console.log(`  Training ID : ${TRAINING_ID}`);
  console.log(`  Enrolment ID: ${ENROLMENT_ID}`);
  console.log("\n  Starting in 3 seconds... (Ctrl+C to abort)\n");
  await new Promise((r) => setTimeout(r, 3000));

  // Step 1: Delete all transactions for this enrollment
  const deletedTxns = await db
    .delete(schema.transactionTable)
    .where(eq(schema.transactionTable.enrolmentId, ENROLMENT_ID))
    .returning();

  console.log(`✅ Deleted ${deletedTxns.length} transaction(s):`);
  for (const t of deletedTxns) {
    console.log(`   - txn ${t.id} | status: ${t.status} | amount: ${t.amount}`);
  }

  // Step 2: Delete the enrollment
  const deletedEnrolments = await db
    .delete(schema.trainingEnrolmentTable)
    .where(eq(schema.trainingEnrolmentTable.id, ENROLMENT_ID))
    .returning();

  console.log(`✅ Deleted ${deletedEnrolments.length} enrollment(s):`);
  for (const e of deletedEnrolments) {
    console.log(`   - enrolment ${e.id} | userId: ${e.userId}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Cleanup complete. User can now re-enroll and pay again.");
  console.log("=".repeat(60));

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
