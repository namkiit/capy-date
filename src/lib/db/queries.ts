import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  config,
  options,
  submissions,
  type NewOptionRow,
  type OptionRow,
  type SubmissionRow,
} from "./schema";
import type { OptionType, SubmissionPayload } from "@/lib/types";

/** Tầng data access duy nhất — mọi truy cập DB đi qua file này */

// ---------- config ----------

export async function getConfigValue(key: string): Promise<unknown> {
  const rows = await getDb().select().from(config).where(eq(config.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setConfigValue(key: string, value: unknown): Promise<void> {
  await getDb()
    .insert(config)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: config.key,
      set: { value, updatedAt: new Date() },
    });
}

// ---------- options ----------

export async function getActiveOptions(type: OptionType): Promise<OptionRow[]> {
  return getDb()
    .select()
    .from(options)
    .where(and(eq(options.type, type), eq(options.isActive, true)))
    .orderBy(asc(options.sortOrder), asc(options.id));
}

export type OptionsByType = Record<OptionType, OptionRow[]>;

/** Toàn bộ option đang active, gom theo loại — dữ liệu cho user flow */
export async function getActiveOptionsGrouped(): Promise<OptionsByType> {
  const rows = await getDb()
    .select()
    .from(options)
    .where(eq(options.isActive, true))
    .orderBy(asc(options.sortOrder), asc(options.id));
  const grouped: OptionsByType = { activity: [], food: [], movie: [], cafe: [] };
  for (const row of rows) {
    grouped[row.type].push(row);
  }
  return grouped;
}

export async function getAllOptions(): Promise<OptionRow[]> {
  return getDb()
    .select()
    .from(options)
    .orderBy(asc(options.type), asc(options.sortOrder), asc(options.id));
}

export async function getOptionById(id: number): Promise<OptionRow | null> {
  const rows = await getDb().select().from(options).where(eq(options.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createOption(data: NewOptionRow): Promise<OptionRow> {
  const rows = await getDb().insert(options).values(data).returning();
  return rows[0];
}

export async function updateOption(
  id: number,
  data: Partial<NewOptionRow>
): Promise<OptionRow | null> {
  const rows = await getDb().update(options).set(data).where(eq(options.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteOption(id: number): Promise<boolean> {
  const rows = await getDb().delete(options).where(eq(options.id, id)).returning({ id: options.id });
  return rows.length > 0;
}

// ---------- submissions ----------

export async function createSubmission(payload: SubmissionPayload): Promise<SubmissionRow> {
  const rows = await getDb().insert(submissions).values({ payload }).returning();
  return rows[0];
}

export async function listSubmissions(): Promise<SubmissionRow[]> {
  return getDb().select().from(submissions).orderBy(desc(submissions.createdAt));
}
