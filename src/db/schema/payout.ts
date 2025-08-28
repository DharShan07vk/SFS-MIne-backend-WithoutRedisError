import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { instructorTable } from "./users";
import { timestamps } from "./helper";
import { trainingTable } from "./training";
import { relations } from "drizzle-orm";

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "queued",
  "scheduled",
  "processing",
  "processed",
  "reversed",
  "cancelled",
  "rejected",
  "failed",
]);

/** Never touch `rzpyFundingAcctId` field */
export const accountTable = pgTable("account", {
  id: uuid().defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .references(() => instructorTable.id)
    .unique()
    .notNull(),
  rzpyContactId: varchar({ length: 40 }).unique(),
  rzpyFundingAcctId: varchar({ length: 40 }).unique(), // fundingAcct and bankAcc refer to same
  rzpyBankAcctId: varchar({ length: 40 }).unique(), // fundingAcct and bankAcc refer to same
  rzpyVPAId: varchar("rzpy_vpa_id", { length: 40 }).unique(),
  rzpyCardId: varchar({ length: 40 }).unique(),
  bankAccVerifiedOn: timestamp({ withTimezone: true }),
  VPAVerifiedOn: timestamp("vpa_verified_on", { withTimezone: true }),
  cardVerifiedOn: timestamp({ withTimezone: true }),
});

export const payoutTable = pgTable("payout", {
  id: uuid().defaultRandom().primaryKey(),
  acctId: uuid("account_id").references(() => accountTable.id),
  referenceNo: varchar({ length: 30 }).notNull(),
  rzpyPayoutId: varchar({ length: 40 }),
  ...timestamps("createdAt", "completedOn"),
  status: payoutStatusEnum("status").default("pending"),
  reason: text(),
  trainingId: uuid("training_id").references(() => trainingTable.id),
  amount: varchar({ length: 10 }),
});

export const accountTableRelations = relations(
  accountTable,
  ({ one, many }) => ({
    partner: one(instructorTable, {
      fields: [accountTable.partnerId],
      references: [instructorTable.id],
    }),
    payouts: many(payoutTable),
  }),
);

export const payoutTableRelations = relations(payoutTable, ({ one }) => ({
  account: one(accountTable, {
    fields: [payoutTable.acctId],
    references: [accountTable.id],
  }),
  training: one(trainingTable, {
    fields: [payoutTable.trainingId],
    references: [trainingTable.id],
  }),
}));
