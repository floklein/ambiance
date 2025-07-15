import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const log = pgTable("log", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
});
