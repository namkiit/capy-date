import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "./client";
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
  const rows = await db.select().from(config).where(eq(config.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

export async function setConfigValue(key: string, value: unknown): Promise<void> {
  await db
    .insert(config)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: config.key,
      set: { value, updatedAt: new Date() },
    });
}

// ---------- options ----------

export async function getActiveOptions(type: OptionType): Promise<OptionRow[]> {
  return db
    .select()
    .from(options)
    .where(and(eq(options.type, type), eq(options.isActive, true)))
    .orderBy(asc(options.sortOrder), asc(options.id));
}

export async function getAllOptions(): Promise<OptionRow[]> {
  return db
    .select()
    .from(options)
    .orderBy(asc(options.type), asc(options.sortOrder), asc(options.id));
}

export async function getOptionById(id: number): Promise<OptionRow | null> {
  const rows = await db.select().from(options).where(eq(options.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createOption(data: NewOptionRow): Promise<OptionRow> {
  const rows = await db.insert(options).values(data).returning();
  return rows[0];
}

export async function updateOption(
  id: number,
  data: Partial<NewOptionRow>
): Promise<OptionRow | null> {
  const rows = await db.update(options).set(data).where(eq(options.id, id)).returning();
  return rows[0] ?? null;
}

export async function deleteOption(id: number): Promise<boolean> {
  const rows = await db.delete(options).where(eq(options.id, id)).returning({ id: options.id });
  return rows.length > 0;
}

// ---------- submissions ----------

export async function createSubmission(payload: SubmissionPayload): Promise<SubmissionRow> {
  const rows = await db.insert(submissions).values({ payload }).returning();
  return rows[0];
}

export async function listSubmissions(): Promise<SubmissionRow[]> {
  return db.select().from(submissions).orderBy(desc(submissions.createdAt));
}
