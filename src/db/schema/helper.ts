import { timestamp } from "drizzle-orm/pg-core";

export function timestamps(
  createdAtFieldName = "created_at",
  updatedAtFieldName = "updated_at",
) {
  return {
    createdAt: timestamp(createdAtFieldName, {
      withTimezone: true,
    }).defaultNow(),
    updatedAt: timestamp(updatedAtFieldName, {
      withTimezone: true,
    }).$onUpdateFn(() => new Date()),
  };
}
