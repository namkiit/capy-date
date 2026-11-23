import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  OPTION_TYPES,
  type OptionExtra,
  type OptionType,
  type SubmissionPayload,
} from "@/lib/types";

/** Key-value config: content, schedule, durations — value là jsonb typed ở tầng service */
export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Lựa chọn vui chơi / quán ăn / phim / cafe do host cấu hình */
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  // cột text thường (không CHECK ở DB) — thêm loại mới không cần migration
  type: text("type", { enum: OPTION_TYPES }).$type<OptionType>().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Danh sách URL ảnh (Blob hoặc URL ngoài) */
  images: jsonb("images").$type<string[]>().notNull(),
  /** Khoảng giá dạng text tự do, VD "250–350k/người" */
  priceRange: text("price_range"),
  address: text("address"),
  mapUrl: text("map_url"),
  /** Ghi chú của host hiện trong popup chi tiết */
  hostNote: text("host_note"),
  extra: jsonb("extra").$type<OptionExtra>(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  payload: jsonb("payload").$type<SubmissionPayload>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OptionRow = typeof options.$inferSelect;
export type NewOptionRow = typeof options.$inferInsert;
export type SubmissionRow = typeof submissions.$inferSelect;
export type ConfigRow = typeof config.$inferSelect;
