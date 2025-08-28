import { relations } from "drizzle-orm";
import {
  char,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const pricingPlanTable = pgTable("pricing_plan", {
  id: serial().primaryKey(),
  title: varchar({ length: 30 }).notNull().unique(),
  description: varchar({ length: 200 }),
  cost: varchar({ length: 10 }),
});

export const pricingPlanPointsTable = pgTable("plan_points", {
  id: serial().primaryKey(),
  planId: integer("plan_id").references(() => pricingPlanTable.id),
  point: varchar({ length: 100 }).notNull(),
});

export const addressTable = pgTable("address", {
  id: serial().primaryKey(),
  addressLine1: varchar("address_line_1").notNull(),
  addressLine2: varchar("address_line_2"),
  city: varchar("city", { length: 200 }).notNull(),
  district: varchar("district", { length: 200 }),
  state: varchar("state", { length: 200 }).notNull(),
  pincode: char("pincode", { length: 6 }).notNull(),
});

export const ourPartnersTable = pgTable("our_partners", {
  id: serial().primaryKey(),
  name: varchar({ length: 100 }),
  logo: text().notNull().unique(),
  updatedAt: timestamp({
    withTimezone: true,
  }).$onUpdateFn(() => new Date()),
});

export const pricingPlanTableRelations = relations(
  pricingPlanTable,
  ({ many }) => ({
    points: many(pricingPlanPointsTable),
  }),
);

export const pricingPlanPointsTableRelations = relations(
  pricingPlanPointsTable,
  ({ one }) => ({
    plan: one(pricingPlanTable, {
      fields: [pricingPlanPointsTable.planId],
      references: [pricingPlanTable.id],
    }),
  }),
);
