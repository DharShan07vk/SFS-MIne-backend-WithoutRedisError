/**
 * ⚠️  DESTRUCTIVE: Full Database Wipe Script
 *
 * Deletes ALL rows from every table in the correct order
 * (children first, then parents — to respect foreign key constraints).
 *
 * Tables wiped:
 *  Transactions / Enrolments / Payouts / Accounts
 *  Training lessons / Progress / Ratings / Trainings
 *  Enquiry transactions (institution, career, psychology, individual)
 *  Institution plans / Career counselling / Psychology training
 *  Campus ambassador applications
 *  Individual+Institution enquiries
 *  Blogs / Blog authors
 *  OTP records
 *  Users / Instructors (partners) / Admins
 *  Address / Pricing plans & points / Our partners
 *
 * Admin accounts are PRESERVED by default.
 * Set WIPE_ADMINS=true env var to also wipe admins.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const DB_URL =
  process.env.DB_MODE === "prod"
    ? process.env.DB_URL_PROD
    : process.env.DB_URL_LOCAL;

const WIPE_ADMINS = process.env.WIPE_ADMINS === "true";

if (!DB_URL) {
  console.error("❌ No DB_URL found. Check your .env file.");
  process.exit(1);
}

const db = drizzle(DB_URL, { schema, casing: "snake_case" });

// ── Helper ────────────────────────────────────────────────────────
async function truncate(tableName: string): Promise<number> {
  const result = await db.execute(
    sql.raw(`DELETE FROM "${tableName}" RETURNING id`),
  );
  return result.rowCount ?? (result.rows?.length ?? 0);
}

async function truncateSerial(tableName: string): Promise<number> {
  // For tables with serial (integer) PKs — RETURNING id still works
  const result = await db.execute(
    sql.raw(`DELETE FROM "${tableName}"`),
  );
  return result.rowCount ?? 0;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(65));
  console.log("⚠️   FULL DATABASE WIPE");
  console.log("=".repeat(65));
  console.log(`\n  DB Mode    : ${process.env.DB_MODE ?? "local"}`);
  console.log(`  Wipe Admins: ${WIPE_ADMINS}`);
  console.log("\n  Starting in 3 seconds... (Ctrl+C to abort)\n");
  await new Promise((r) => setTimeout(r, 3000));

  let total = 0;

  // ── 1. Leaf-level: junction / transaction tables ───────────────
  console.log("── [1/7] Clearing transaction & junction tables ─────────────");

  total += await truncate("transaction");
  console.log("  ✅ transaction");

  total += await truncate("training_enrolment");
  console.log("  ✅ training_enrolment");

  total += await truncate("user_training_progress");
  console.log("  ✅ user_training_progress");

  total += await truncate("rating");
  console.log("  ✅ rating");

  total += await truncate("payout");
  console.log("  ✅ payout");

  total += await truncate("account");
  console.log("  ✅ account");

  // ── 2. Enquiry junction tables ─────────────────────────────────
  console.log("\n── [2/7] Clearing enquiry junction tables ───────────────────");

  total += await truncate("institution_transaction");
  console.log("  ✅ institution_transaction");

  total += await truncate("career_transaction");
  console.log("  ✅ career_transaction");

  total += await truncate("psychology_transaction");
  console.log("  ✅ psychology_transaction");

  total += await truncate("individual_institution_transaction");
  console.log("  ✅ individual_institution_transaction");

  total += await truncate("enq_transaction");
  console.log("  ✅ enq_transaction");

  // ── 3. Training tables ─────────────────────────────────────────
  console.log("\n── [3/7] Clearing training tables ───────────────────────────");

  total += await truncate("training_lesson");
  console.log("  ✅ training_lesson");

  total += await truncate("training");
  console.log("  ✅ training");

  // ── 4. Enquiry entity tables ───────────────────────────────────
  console.log("\n── [4/7] Clearing enquiry entity tables ─────────────────────");

  total += await truncate("institution_plan");
  console.log("  ✅ institution_plan");

  total += await truncate("career_counselling");
  console.log("  ✅ career_counselling");

  total += await truncate("psychology_training");
  console.log("  ✅ psychology_training");

  total += await truncate("individual_institution");
  console.log("  ✅ individual_institution");

  total += await truncate("ca_application");
  console.log("  ✅ ca_application (campus ambassador)");

  // ── 5. Blog tables ─────────────────────────────────────────────
  console.log("\n── [5/7] Clearing blog tables ───────────────────────────────");

  total += await truncate("blog");
  console.log("  ✅ blog");

  total += await truncate("blog_author");
  console.log("  ✅ blog_author");

  // ── 6. User tables ─────────────────────────────────────────────
  console.log("\n── [6/7] Clearing user tables ───────────────────────────────");

  total += await truncate("user");
  console.log("  ✅ user (students)");

  total += await truncate("instructor");
  console.log("  ✅ instructor (partners)");

  total += await truncate("userotp");
  console.log("  ✅ userotp");

  if (WIPE_ADMINS) {
    total += await truncate("admin");
    console.log("  ✅ admin");
  } else {
    console.log("  ⏭️  admin — SKIPPED (set WIPE_ADMINS=true to include)");
  }

  // ── 7. Misc / reference tables ─────────────────────────────────
  console.log("\n── [7/7] Clearing misc tables ───────────────────────────────");

  total += await truncateSerial("address");
  console.log("  ✅ address");

  total += await truncateSerial("plan_points");
  console.log("  ✅ plan_points");

  total += await truncateSerial("pricing_plan");
  console.log("  ✅ pricing_plan");

  total += await truncateSerial("our_partners");
  console.log("  ✅ our_partners");

  // ── Done ───────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(65));
  console.log(`✅ Database wipe complete. Total rows deleted: ${total}`);
  if (!WIPE_ADMINS) {
    console.log("   ℹ️  Admin accounts were preserved.");
  }
  console.log("=".repeat(65));

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
