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

/** Đọc toàn bộ config: giá trị DB đè lên default trong code — bảng trống vẫn chạy */
export async function getAppConfig(): Promise<AppConfig> {
  const [content, schedule, durations] = await Promise.all([
    getConfigValue(CONFIG_KEYS.content),
    getConfigValue(CONFIG_KEYS.schedule),
    getConfigValue(CONFIG_KEYS.durations),
  ]);
  return {
    content: mergeWithDefaults(DEFAULT_CONTENT, content),
    schedule: mergeWithDefaults(DEFAULT_SCHEDULE, schedule),
    durations: mergeWithDefaults(DEFAULT_DURATIONS, durations),
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
