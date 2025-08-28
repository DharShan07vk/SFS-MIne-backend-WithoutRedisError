import {
  char,
  date,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { addressTable } from "./misc";
import { relations } from "drizzle-orm";
import { timestamps } from "./helper";
import { nanoid } from "nanoid";
import { transactionStatusEnum } from "./training";

export const caEducationType = pgEnum("ca_edu_type", ["UG", "PG", "PhD"]);
export const institutionPlans = pgEnum("inst_plans", ["Basics", "Premium"]);

export const institutionPlanTable = pgTable("institution_plan", {
  id: uuid().primaryKey().defaultRandom(),
  schoolName: varchar({ length: 200 }).notNull().unique(),
  addressId: integer()
    .references(() => addressTable.id)
    .notNull(),
  contactName: varchar({ length: 200 }).notNull(),
  contactMobile: char({ length: 10 }).notNull().unique(),
  contactEmail: varchar().notNull().unique(),
  studentsCount: integer(),
});

export const psychologyTrainingTable = pgTable("psychology_training", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar({ length: 50 }).notNull(),
  lastName: varchar({ length: 50 }),
  email: varchar({ length: 200 }).notNull(),
  mobile: char({ length: 10 }).notNull(),
  city: varchar("city", { length: 200 }).notNull(),
  state: varchar("state", { length: 200 }).notNull(),
  idCardURL: text(),
  ...timestamps(),
});

export const careerCounsellingTable = pgTable("career_counselling", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar({ length: 50 }).notNull(),
  lastName: varchar({ length: 50 }),
  email: varchar({ length: 200 }).notNull(),
  mobile: char({ length: 10 }).notNull(),
  service: varchar({ length: 100 }),
  plan: institutionPlans(),
  ...timestamps(),
});

/** This table contains transactions for psychology payments, institution plan payments and career counselling payments */
export const institutionTransactionTable = pgTable("institution_transaction", {
  id: uuid().primaryKey().defaultRandom(),
  institutionId: uuid("institution_id")
    .references(() => institutionPlanTable.id)
    .notNull(),
  plan: institutionPlans().notNull(),
  transactionId: uuid("transaction_id")
    .references(() => enquiryTransactionTable.id)
    .notNull(),
  ...timestamps(),
});

export const careerCounsellingTransactionTable = pgTable("career_transaction", {
  id: uuid().primaryKey().defaultRandom(),
  careerId: uuid("institution_id")
    .references(() => careerCounsellingTable.id)
    .notNull(),
  transactionId: uuid("transaction_id")
    .references(() => enquiryTransactionTable.id)
    .notNull(),
  ...timestamps(),
});

export const psychologyTransactionTable = pgTable("psychology_transaction", {
  id: uuid().primaryKey().defaultRandom(),
  psychologyId: uuid("psych_req_id")
    .references(() => psychologyTrainingTable.id)
    .notNull(),
  transactionId: uuid("transaction_id")
    .references(() => enquiryTransactionTable.id)
    .notNull(),
  ...timestamps(),
});

export const enquiryTransactionTable = pgTable("enq_transaction", {
  id: uuid().primaryKey().defaultRandom(),
  txnNo: char("txn_no", { length: 50 }).$defaultFn(() => nanoid(21)),
  paymentId: varchar({ length: 500 }),
  orderId: varchar({ length: 500 }).notNull(),
  signature: varchar({ length: 500 }),
  idempotencyId: varchar({ length: 500 }),
  amount: varchar({ length: 10 }).notNull(),
  status: transactionStatusEnum("status").default("pending"),
  ...timestamps(),
});

export const campusAmbassadorTable = pgTable("ca_application", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar({ length: 50 }).notNull(),
  lastName: varchar({ length: 50 }),
  email: varchar({ length: 200 }).notNull(),
  mobile: char({ length: 10 }).notNull(),
  eduType: caEducationType().notNull(),
  department: varchar({ length: 100 }).notNull(),
  collegeName: varchar({ length: 200 }).notNull(),
  yearInCollege: smallint(),
  collegeCity: varchar("city", { length: 200 }).notNull(),
  dob: date("date_of_birth"),
  linkedin: varchar(),
  ...timestamps(),
});

export const institutionTransactionTableRelations = relations(
  institutionTransactionTable,
  ({ one }) => ({
    institutionPlan: one(institutionPlanTable, {
      fields: [institutionTransactionTable.institutionId],
      references: [institutionPlanTable.id],
    }),
    transaction: one(enquiryTransactionTable, {
      fields: [institutionTransactionTable.transactionId],
      references: [enquiryTransactionTable.id],
    }),
  }),
);

export const careerTransactionTableRelations = relations(
  careerCounsellingTransactionTable,
  ({ one }) => ({
    career: one(careerCounsellingTable, {
      fields: [careerCounsellingTransactionTable.careerId],
      references: [careerCounsellingTable.id],
    }),
    transaction: one(enquiryTransactionTable, {
      fields: [careerCounsellingTransactionTable.transactionId],
      references: [enquiryTransactionTable.id],
    }),
  }),
);

export const psychologyTransactionTableRelations = relations(
  psychologyTransactionTable,
  ({ one }) => ({
    psychology: one(psychologyTrainingTable, {
      fields: [psychologyTransactionTable.psychologyId],
      references: [psychologyTrainingTable.id],
    }),
    transaction: one(enquiryTransactionTable, {
      fields: [psychologyTransactionTable.transactionId],
      references: [enquiryTransactionTable.id],
    }),
  }),
);

export const institutionPlanTableRelations = relations(
  institutionPlanTable,
  ({ one, many }) => ({
    address: one(addressTable, {
      fields: [institutionPlanTable.addressId],
      references: [addressTable.id],
    }),
    transactions: many(institutionTransactionTable),
  }),
);

export const psychologyTrainingTableRelations = relations(
  psychologyTrainingTable,
  ({ many }) => ({
    transactions: many(psychologyTransactionTable),
  }),
);

export const careerCounsellingRelations = relations(
  careerCounsellingTable,
  ({ many }) => ({
    transactions: many(careerCounsellingTransactionTable),
  }),
);
