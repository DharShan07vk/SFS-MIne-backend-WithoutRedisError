import {
  char,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helper";
import { relations } from "drizzle-orm";
import { blogTable } from "./blog";
import { trainingEnrolmentTable, trainingTable } from "./training";
import { addressTable } from "./misc";
import { accountTable } from "./payout";


export const userTable = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar({ length: 200 }).notNull().unique(),
  mobile: char({ length: 10 }).notNull().unique(),
  profileImageURL: text().unique(),
  hash: varchar().notNull(),
  salt: varchar().notNull(),
  ...timestamps(),
});

export const instructorTable = pgTable("instructor", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar({ length: 200 }).notNull().unique(),
  mobile: char({ length: 10 }).notNull().unique(),
  hash: varchar().notNull(),
  salt: varchar().notNull(),
  topics: varchar("topics").array(10),
  institutionName: varchar("institution_name", { length: 100 }),
  profileImageURL: text().unique(),
  addressId: integer("address_id").references(() => addressTable.id),
  approvedBy: uuid("approved_by").references(() => adminTable.id),
  gst: varchar("gst", { length: 30 }),
  logo: varchar("logo"),
  digitalSign : varchar("digitalSign"),
  ...timestamps(),
});

export const adminTable = pgTable("admin", {
  id: uuid().primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar({ length: 200 }).notNull().unique(),
  mobile: char({ length: 10 }).notNull().unique(),
  hash: varchar().notNull(),
  salt: varchar().notNull(),
  ...timestamps(),
});

export const userTableRelations = relations(userTable, ({ many }) => ({
  enrolments: many(trainingEnrolmentTable),
}));

export const instructorRelations = relations(
  instructorTable,
  ({ one, many }) => ({
    approvedByAdmin: one(adminTable, {
      fields: [instructorTable.approvedBy],
      references: [adminTable.id],
    }),
    trainings: many(trainingTable),
    address: one(addressTable, {
      fields: [instructorTable.addressId],
      references: [addressTable.id],
    }),
    account: one(accountTable),
  }),
);

export const adminTableRelations = relations(adminTable, ({ one, many }) => ({
  instructorsApproved: many(instructorTable),
  blogsApproved: many(blogTable),
  trainingsApproved: many(trainingTable),
}));
