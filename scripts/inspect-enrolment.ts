import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/connection";
import { trainingEnrolmentTable, transactionTable } from "../src/db/schema";

function getArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

async function main() {
  const enrolmentId = getArg("--id");
  if (!enrolmentId) {
    console.error("Missing --id <enrolmentId>");
    process.exitCode = 1;
    return;
  }

  const enrolment = await db.query.trainingEnrolmentTable.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, enrolmentId);
    },
    with: {
      user: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      training: {
        columns: {
          id: true,
          title: true,
          cost: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  const transactions = await db
    .select()
    .from(transactionTable)
    .where(eq(transactionTable.enrolmentId, enrolmentId));

  console.log("Enrolment:", enrolment);
  console.log("Transactions:", transactions);
}

main().catch((error) => {
  console.error("Error inspecting enrolment:", error);
  process.exitCode = 1;
});
