/**
 * Seed Script: Demo Partner + Training Course
 *
 * Creates (or re-creates) :
 *   - Demo admin        admin@admin.com  / Admin@123
 *   - Demo partner      partner@partner.com / partner@123
 *   - Demo training     starts tomorrow, runs 4 hours, ₹10, OFFLINE, Chennai
 */

import { eq, or } from "drizzle-orm";
import { db } from "../connection";
import { adminTable, instructorTable, userTable } from "../schema/users";
import { trainingTable } from "../schema/training";
import { generateHashPassword } from "../../utils/password";

// ── Config ────────────────────────────────────────────────────────
const demoAdmin = {
  email: "admin@admin.com",
  password: "Admin@123",
  firstName: "Demo",
  lastName: "Admin",
  mobile: "9000000001",
};

const demoPartner = {
  email: "partner@partner.com",
  password: "partner@123",
  firstName: "Demo",
  lastName: "Partner",
  mobile: "9000000002",
  institutionName: "Demo Partner",
};

const demoStudent = {
  email: "student@student.com",
  password: "student@123",
  firstName: "Demo",
  lastName: "Student",
  mobile: "9000000003",
};

// Training: starts tomorrow at 10:00 AM IST, ends at 2:00 PM IST
function buildTrainingDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(14, 0, 0, 0); // 4 hours later

  return { startDate: tomorrow, endDate: end };
}

// ── Ensure Demo Admin ─────────────────────────────────────────────
async function ensureDemoAdmin(): Promise<string | null> {
  const existing = await db
    .select()
    .from(adminTable)
    .where(
      or(
        eq(adminTable.email, demoAdmin.email),
        eq(adminTable.mobile, demoAdmin.mobile),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const admin = existing[0];
    const pwd = await generateHashPassword(demoAdmin.password);
    await db
      .update(adminTable)
      .set({ hash: pwd.hash, salt: pwd.salt })
      .where(eq(adminTable.id, admin.id));
    console.log("  ✅ Demo admin (updated password):", admin.email);
    return admin.id;
  }

  const pwd = await generateHashPassword(demoAdmin.password);
  const [created] = await db
    .insert(adminTable)
    .values({
      email: demoAdmin.email,
      firstName: demoAdmin.firstName,
      lastName: demoAdmin.lastName,
      mobile: demoAdmin.mobile,
      hash: pwd.hash,
      salt: pwd.salt,
    })
    .returning();

  console.log("  ✅ Demo admin (created):", created.email);
  return created.id;
}

// ── Ensure Demo Partner ───────────────────────────────────────────
async function ensureDemoPartner(approvedById: string | null): Promise<string | null> {
  const existing = await db
    .select()
    .from(instructorTable)
    .where(
      or(
        eq(instructorTable.email, demoPartner.email),
        eq(instructorTable.mobile, demoPartner.mobile),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const partner = existing[0];
    const pwd = await generateHashPassword(demoPartner.password);
    await db
      .update(instructorTable)
      .set({ hash: pwd.hash, salt: pwd.salt })
      .where(eq(instructorTable.id, partner.id));
    console.log("  ✅ Demo partner (updated password):", partner.email);
    return partner.id;
  }

  const pwd = await generateHashPassword(demoPartner.password);
  const [created] = await db
    .insert(instructorTable)
    .values({
      email: demoPartner.email,
      firstName: demoPartner.firstName,
      lastName: demoPartner.lastName,
      mobile: demoPartner.mobile,
      institutionName: demoPartner.institutionName,
      hash: pwd.hash,
      salt: pwd.salt,
      ...(approvedById ? { approvedBy: approvedById } : {}),
    })
    .returning();

  console.log("  ✅ Demo partner (created):", created.email);
  return created.id;
}

// ── Ensure Demo Training ──────────────────────────────────────────
async function ensureDemoTraining(
  partnerId: string | null,
  adminId: string | null,
): Promise<void> {
  const TRAINING_TITLE = "Demo Skill Development Course";

  const existing = await db
    .select()
    .from(trainingTable)
    .where(eq(trainingTable.title, TRAINING_TITLE))
    .limit(1);

  const { startDate, endDate } = buildTrainingDates();

  if (existing.length > 0) {
    // Update dates so it's always "next day from now"
    await db
      .update(trainingTable)
      .set({
        startDate,
        endDate,
        ...(partnerId ? { createdBy: partnerId } : {}),
        ...(adminId ? { approvedBy: adminId } : {}),
      })
      .where(eq(trainingTable.id, existing[0].id));

    console.log("  ✅ Demo training (dates refreshed):", TRAINING_TITLE);
    console.log(`     Start : ${startDate.toISOString()}`);
    console.log(`     End   : ${endDate.toISOString()}`);
    return;
  }

  const [created] = await db
    .insert(trainingTable)
    .values({
      title: TRAINING_TITLE,
      description:
        "A hands-on skill development workshop covering practical industry tools and techniques. Perfect for beginners and professionals looking to upskill.",
      location: "Chennai",
      cost: "10.00",
      type: "OFFLINE",
      courseType: "Skill Development",
      category: "tech",
      startDate,
      endDate,
      whoIsItFor: ["Students", "Working Professionals", "Freshers"],
      whatYouWillLearn: [
        "Industry-relevant practical skills",
        "Hands-on project experience",
        "Networking with peers",
      ],
      cut: 10,
      ...(partnerId ? { createdBy: partnerId } : {}),
      ...(adminId ? { approvedBy: adminId } : {}),
    })
    .returning();

  console.log("  ✅ Demo training (created):", created.title);
  console.log(`     Start : ${startDate.toISOString()}`);
  console.log(`     End   : ${endDate.toISOString()}`);
  console.log(`     Cost  : ₹${created.cost}`);
  console.log(`     Type  : ${created.type} | ${created.location}`);
}

// ── Ensure Demo Student ───────────────────────────────────────────
async function ensureDemoStudent(): Promise<string | null> {
  const existing = await db
    .select()
    .from(userTable)
    .where(
      or(
        eq(userTable.email, demoStudent.email),
        eq(userTable.mobile, demoStudent.mobile),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const student = existing[0];
    const pwd = await generateHashPassword(demoStudent.password);
    await db
      .update(userTable)
      .set({ hash: pwd.hash, salt: pwd.salt })
      .where(eq(userTable.id, student.id));
    console.log("  ✅ Demo student (updated password):", student.email);
    return student.id;
  }

  const pwd = await generateHashPassword(demoStudent.password);
  const [created] = await db
    .insert(userTable)
    .values({
      email: demoStudent.email,
      firstName: demoStudent.firstName,
      lastName: demoStudent.lastName,
      mobile: demoStudent.mobile,
      hash: pwd.hash,
      salt: pwd.salt,
    })
    .returning();

  console.log("  ✅ Demo student (created):", created.email);
  return created.id;
}

// ── Main ──────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("=".repeat(55));
  console.log("🌱 Seeding Demo Data");
  console.log("=".repeat(55));

  const adminId = await ensureDemoAdmin();
  const partnerId = await ensureDemoPartner(adminId);
  await ensureDemoTraining(partnerId, adminId);
  await ensureDemoStudent();

  console.log("\n" + "=".repeat(55));
  console.log("✅ Seed complete!");
  console.log("   Student  : student@student.com / student@123");
  console.log("   Partner  : partner@partner.com / partner@123");
  console.log("   Admin    : admin@admin.com / Admin@123");
  console.log("=".repeat(55));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
