import { eq, or } from "drizzle-orm";
import { db } from "../connection";
import { adminTable, instructorTable } from "../schema/users";
import { generateHashPassword } from "../../utils/password";

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
    if (admin.email === demoAdmin.email) {
      const pwd = await generateHashPassword(demoAdmin.password);
      await db
        .update(adminTable)
        .set({
          hash: pwd.hash,
          salt: pwd.salt,
        })
        .where(eq(adminTable.id, admin.id));
      console.log("Updated demo admin password:", admin.email);
      return admin.id;
    }

    console.log(
      "Admin with demo mobile exists but email differs:",
      admin.email,
    );
    return null;
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

  console.log("Created demo admin:", created.email);
  return created.id;
}

async function ensureDemoPartner(approvedById: string | null): Promise<void> {
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
    console.log("Demo partner already exists:", existing[0].email);
    return;
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

  console.log("Created demo partner:", created.email);
}

async function main(): Promise<void> {
  const adminId = await ensureDemoAdmin();
  await ensureDemoPartner(adminId);
}

main()
  .then(() => {
    console.log("Demo seed complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed demo users:", error);
    process.exit(1);
  });
