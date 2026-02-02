import {
  char,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helper";
import { adminTable, instructorTable, userTable } from "./users";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import { payoutTable } from "./payout";

export const durationTypeEnum = pgEnum("duration_type", [
  "Weeks",
  "Days",
  "Hours",
  "Months",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "success",
  "cancelled",
  "failed",
]);



export const trainingTypeEnum = pgEnum("training_type", [
  "ONLINE",
  "OFFLINE",
  "HYBRID",
]);

export const trainingTable = pgTable("training", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 300 }).notNull().unique(),
  description: text(),
  coverImg: varchar("cover_img", { length: 2000 }),
  link: varchar({ length: 2000 }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  durationValue: integer("duration_value"),
  durationType: durationTypeEnum("duration_type"),
  location: varchar({ length: 200 }),
  cost: varchar({ length: 10 }),
  type: trainingTypeEnum("type"),
  color: varchar("color", { length: 30 }),
  category: varchar({ length: 200 }), 
  createdBy: uuid("created_by").references(() => instructorTable.id),
  approvedBy: uuid("approved_by").references(() => adminTable.id),
  cut: integer(),
  ...timestamps(),
});

export const trainingLessonTable = pgTable("training_lesson", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 300 }).notNull().unique(),
  video: text(),
  content: text(),
  location: varchar({ length: 400 }),
  type: trainingTypeEnum("type").notNull(),
  trainingId: uuid("training_id").references(() => trainingTable.id),
  lastDate: timestamp("last_date", { withTimezone: true }),
  ...timestamps(),
});

export const userTraningProgressTable = pgTable("user_training_progress", {
  id: uuid().primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id").references(() => trainingLessonTable.id),
  userId: uuid("user_id").references(() => userTable.id),
  completedOn: timestamp("completed_on", { withTimezone: true }),
});

export const trainingEnrolmentTable = pgTable(
  "training_enrolment",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => userTable.id),
    trainingId: uuid("training_id").references(() => trainingTable.id),
    completedOn: timestamp("completed_on", { withTimezone: true }),
    paidOn: timestamp("paid_on", { withTimezone: true }), // if this has a date, then it must mean that training has been paid for successfully and can be shown to the user
    certificateNo: varchar({ length: 30 }),
    certificate: text("certificate_url"),
    ...timestamps(),
  },
  (t) => ({
    uniqueTogether: unique("training_user_course_unique").on(
      t.userId,
      t.trainingId,
    ),
  }),
);

export const trainingRatingTable = pgTable(
  "rating",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userTable.id)
      .notNull(),
    trainingId: uuid("training_id")
      .references(() => trainingTable.id)
      .notNull(),
    rating: smallint("rating").notNull(),
    feedback: text("feedback").notNull(),
    completedOn: timestamp("rated_on", { withTimezone: true }),
  },
  (t) => ({
    unq: unique("rating_user_training").on(t.userId, t.trainingId),
  }),
);

export const transactionTable = pgTable("transaction", {
  id: uuid().primaryKey().defaultRandom(),
  txnNo: char("txn_no", { length: 21 }).$defaultFn(() => nanoid(21)),
  paymentId: varchar({ length: 500 }),
  orderId: varchar({ length: 500 }).notNull(),
  signature: varchar({ length: 500 }),
  idempotencyId: varchar({ length: 500 }),
  amount: varchar({ length: 10 }).notNull(),
  status: transactionStatusEnum("status").default("pending"),
  enrolmentId: uuid("enrolment_id").references(() => trainingEnrolmentTable.id),
  ...timestamps(),
});

export const trainingTableRelations = relations(
  trainingTable,
  ({ one, many }) => ({
    approvedByAdmin: one(adminTable, {
      fields: [trainingTable.approvedBy],
      references: [adminTable.id],
    }),
    instructor: one(instructorTable, {
      fields: [trainingTable.createdBy],
      references: [instructorTable.id],
    }),
    enrolments: many(trainingEnrolmentTable),
    ratings: many(trainingRatingTable),
    payout: one(payoutTable),
    lessons: many(trainingLessonTable),
  }),
);

export const trainingLessonTableRelations = relations(
  trainingLessonTable,
  ({ one }) => ({
    training: one(trainingTable, {
      fields: [trainingLessonTable.trainingId],
      references: [trainingTable.id],
    }),
  }),
);

export const userTrainingProgressRelations = relations(
  userTraningProgressTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [userTraningProgressTable.userId],
      references: [userTable.id],
    }),
    lesson: one(trainingLessonTable, {
      fields: [userTraningProgressTable.lessonId],
      references: [trainingLessonTable.id],
    }),
  }),
);

export const trainingRatingTableRelations = relations(
  trainingRatingTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [trainingRatingTable.userId],
      references: [userTable.id],
    }),
    training: one(trainingTable, {
      fields: [trainingRatingTable.trainingId],
      references: [trainingTable.id],
    }),
  }),
);

export const trainingEnrolmentTableRelations = relations(
  trainingEnrolmentTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [trainingEnrolmentTable.userId],
      references: [userTable.id],
    }),
    training: one(trainingTable, {
      fields: [trainingEnrolmentTable.trainingId],
      references: [trainingTable.id],
    }),
    transactions: many(transactionTable),
  }),
);

export const transactionTableRelations = relations(
  transactionTable,
  ({ one }) => ({
    enrolment: one(trainingEnrolmentTable, {
      fields: [transactionTable.enrolmentId],
      references: [trainingEnrolmentTable.id],
    }),
  }),
);
