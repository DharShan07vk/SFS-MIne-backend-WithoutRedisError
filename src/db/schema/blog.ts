import { char, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { adminTable } from "./users";
import { timestamps } from "./helper";
import { relations } from "drizzle-orm";

export const blogTable = pgTable("blog", {
  id: uuid().primaryKey().defaultRandom(),
  title: varchar({ length: 200 }).notNull().unique(),
  slug: varchar({ length: 221 }).notNull().unique(),
  content: text().notNull(),
  coverImage: varchar("cover_image"),
  references: varchar("references").array(10),
  approvedBy: uuid("approved_by").references(() => adminTable.id),
  author: uuid("blog_author").references(() => blogAuthorTable.id),
  category: varchar({ length: 50 }),
  ...timestamps(),
});

export const blogAuthorTable = pgTable("blog_author", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 200 }).notNull().unique(),
  mobile: char({ length: 10 }).notNull().unique(),
  linkedin: varchar(),
  designation: varchar({ length: 50 }),
});

export const blogAuthorTableRelations = relations(
  blogAuthorTable,
  ({ one }) => ({
    blog: one(blogTable),
  }),
);

export const blogTableRelations = relations(blogTable, ({ one }) => ({
  approvedByAdmin: one(adminTable, {
    fields: [blogTable.approvedBy],
    references: [adminTable.id],
  }),
  blogAuthor: one(blogAuthorTable, {
    fields: [blogTable.author],
    references: [blogAuthorTable.id],
  }),
}));
