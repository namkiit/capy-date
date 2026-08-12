import type { z } from "zod";
import {
  contentConfigSchema,
  durationsConfigSchema,
  scheduleConfigSchema,
} from "@/lib/admin-schemas";
import {
  DEFAULT_CONTENT,
  DEFAULT_DURATIONS,
  DEFAULT_SCHEDULE,
  mergeWithDefaults,
} from "@/lib/config-defaults";
import { getConfigValue, setConfigValue } from "@/lib/db/queries";
import type { AppConfig, ContentConfig, ScheduleConfig, TimelineDurations } from "@/lib/types";

export const CONFIG_KEYS = {
  content: "content",
  schedule: "schedule",
  durations: "durations",
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

/**
 * Merge DB lên default rồi validate lại bằng zod — dữ liệu DB sai kiểu
 * (sửa tay, restore backup cũ, đổi schema) thì log và rơi hẳn về default,
 * không để type cast suông làm crash phía khách.
 */
function resolveConfig<T extends object>(
  key: string,
  defaults: T,
  schema: z.ZodType<T>,
  stored: unknown
): T {
  const merged = mergeWithDefaults(defaults, stored);
  const parsed = schema.safeParse(merged);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    console.error(
      `Config "${key}" trong DB không hợp lệ (${issue.path.join(".")}: ${issue.message}) — dùng default`
    );
    return defaults;
  }
  return parsed.data;
}

/** Đọc toàn bộ config: giá trị DB đè lên default trong code — bảng trống vẫn chạy */
export async function getAppConfig(): Promise<AppConfig> {
  const [content, schedule, durations] = await Promise.all([
    getConfigValue(CONFIG_KEYS.content),
    getConfigValue(CONFIG_KEYS.schedule),
    getConfigValue(CONFIG_KEYS.durations),
  ]);
  return {
    content: resolveConfig(CONFIG_KEYS.content, DEFAULT_CONTENT, contentConfigSchema, content),
    schedule: resolveConfig(CONFIG_KEYS.schedule, DEFAULT_SCHEDULE, scheduleConfigSchema, schedule),
    durations: resolveConfig(
      CONFIG_KEYS.durations,
      DEFAULT_DURATIONS,
      durationsConfigSchema,
      durations
    ),
  };
}

export async function saveContentConfig(value: ContentConfig): Promise<void> {
  await setConfigValue(CONFIG_KEYS.content, value);
}

export async function saveScheduleConfig(value: ScheduleConfig): Promise<void> {
  await setConfigValue(CONFIG_KEYS.schedule, value);
}

export async function saveDurationsConfig(value: TimelineDurations): Promise<void> {
  await setConfigValue(CONFIG_KEYS.durations, value);
}
